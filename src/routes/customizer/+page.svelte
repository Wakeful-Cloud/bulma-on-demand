<script lang="ts">
  //Imports
  import getIntegrity from '$lib/integrity';
  import { Check, Copy, ListPlus, LogIn, X } from 'lucide-svelte';
  import { debounce } from 'lodash-es';
  import { error } from '$lib/stores';
  import { variables, versions, type Version } from '$lib/variables';

  //Types
  interface Variable {
    name: string;
    value: string;
  }

  //State
  const input = {
    existing: '',
    version: versions[0]!,
    variables: [] as Variable[],
    minify: true,
  };

  const output = {
    url: new URL('invalid://error'),
    snippet: undefined as string | undefined,
    copied: false,
  };

  //Reactive
  $: {
    //Update the URL
    output.url = new URL(
      `/api/bulma-${input.version}.${input.minify ? 'min.' : ''}css`,
      typeof window != 'undefined' ? window.location.origin : 'invalid://error'
    );
    output.url.search = new URLSearchParams(
      Object.fromEntries(
        input.variables.map((variable) => [variable.name, variable.value])
      )
    ).toString();

    //Update the snippet
    updateSnippet();
  }

  //Methods
  const updateFromExisting = () => {
    //Parse the existing URL
    try {
      const url = new URL(input.existing, 'https://dummy');

      //Parse the suffix
      const suffix = /(?:-(\d+\.\d+\.\d+))?\.(css|min\.css)$/.exec(
        url.pathname
      );

      if (suffix == null || suffix.length != 3) {
        throw new Error('Invalid CSS URL!');
      }

      //Update state
      input.version = (suffix[1] as Version) ?? versions[0];
      input.minify = suffix[2] == 'min.css';

      //Add variables
      input.variables = Array.from(url.searchParams.entries()).map(
        ([name, value]) =>
          ({
            name,
            value,
          } as Variable)
      );

      //Clear
      input.existing = '';
    } catch (err) {
      error.show(err as string);
    }
  };

  const onDragStart = (event: DragEvent) => {
    //Get the dragged index
    const draggedIndex = input.variables.findIndex(
      (variable) =>
        variable.name == (event.target as HTMLElement)?.dataset?.variable
    );

    //Store the index
    event.dataTransfer?.setData(
      'application/json',
      JSON.stringify(draggedIndex)
    );
  };

  const onDrop = (event: DragEvent) => {
    //Retrieve the dragged index
    const draggedIndex = JSON.parse(
      event.dataTransfer?.getData('application/json') ?? '-1'
    );

    //Get the dropped index
    let droppedIndex = -1;

    for (const candidate of event.composedPath()) {
      //Get the index for the candidate
      const candidateIndex = input.variables.findIndex(
        (variable) =>
          variable.name == (candidate as HTMLElement)?.dataset?.variable
      );

      //If the candidate index isn't invalid, use it
      if (candidateIndex != -1) {
        droppedIndex = candidateIndex;
      }
    }

    if (draggedIndex < 0 || droppedIndex < 0) {
      return;
    }

    //Get the dragged variable, filter it out, and insert it after the dropped variable
    const tempVariable = input.variables[draggedIndex]!;
    input.variables = input.variables.filter(
      (variable) => variable != tempVariable
    );
    input.variables.splice(droppedIndex, 0, tempVariable);
  };

  const addVariable = () => {
    input.variables = [
      ...input.variables,
      {
        name: '',
        value: '',
      },
    ];
  };

  const removeVariable = (index: number) => {
    input.variables = input.variables.filter((_, i) => i != index);
  };

  const updateSnippet = debounce(async () => {
    //Show the progress bar
    output.snippet = undefined;

    //Skip if SSR
    if (output.url.protocol.startsWith('invalid')) {
      return;
    }

    try {
      //Get the integrity
      const integrity = await getIntegrity(output.url);

      //Update the snippet and hide the progess bar
      output.snippet = `<link rel="stylesheet" href="${output.url.toString()}" integrity="${integrity}" crossorigin="anonymous">`;
    } catch (err) {
      error.show(err as string);
      return;
    }
  }, 1000);

  const copySnippet = async () => {
    //Copy
    await navigator.clipboard.writeText(output.snippet ?? '');

    //Update copied
    output.copied = true;
    setTimeout(() => (output.copied = false), 1000);
  };
</script>

<!-- Input -->
<section class="section">
  <h1 class="title">Input</h1>

  <!-- Existing URL -->
  <div class="block field mb-0 mr-2 is-flex-grow-1">
    <label class="label" for="existing-url">Enter existing CSS URL</label>
    <div
      class="is-justify-content-space-evenly is-flex-direction-row is-flex is-align-items-center control"
    >
      <input
        class="input mr-2"
        type="text"
        id="existing-url"
        bind:value={input.existing}
      />

      <button
        class="button ml-2 is-primary is-outlined"
        on:click={updateFromExisting}
      >
        <span class="mr-1">Submit</span>
        <span class="icon ml-1"><LogIn /></span>
      </button>
    </div>
    <p class="help">
      Use this option if you have an existing CSS URL generated by Bulma On
      Demand (instead of having to re-enter all variables).
    </p>
  </div>

  <hr />

  <!-- Version -->
  <div class="block field">
    <label class="label" for="version">Bulma Version</label>
    <div class="control">
      <select
        class="select"
        id="version"
        bind:value={input.version}
        on:change={(event) => (input.version = event.target?.value)}
      >
        {#each versions as possibleVersion}
          <option>{possibleVersion}</option>
        {/each}
      </select>
    </div>
    <p class="help">
      See the <a
        href="https://github.com/jgthms/bulma/releases"
        target="_blank"
        rel="noreferrer nofollow">Bulma releases</a
      > for more information.
    </p>
  </div>

  <!-- Variables -->
  <div class="block">
    <label class="label" for="variables">SASS Variables</label>
    <div class="mb-0 table-container variables">
      <!-- Variables -->
      <table class="is-fullwidth is-striped table">
        <!-- Header -->
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody>
          {#each input.variables as variable, index}
            <tr
              data-variable={variable.name}
              draggable="true"
              on:dragstart={onDragStart}
              on:dragover|preventDefault
              on:drop|preventDefault={onDrop}
            >
              <!-- Name -->
              <td>
                <select
                  class="select"
                  bind:value={variable.name}
                  on:change={(event) => (variable.name = event.target?.value)}
                >
                  {#each variables[input.version] as variableName}
                    <option>{variableName}</option>
                  {/each}
                </select>
              </td>

              <!-- Value -->
              <td>
                <input
                  bind:value={variable.value}
                  class="input"
                  type="text"
                  id={variable.name}
                />
              </td>

              <!-- Actions -->
              <td>
                <button
                  class="button is-danger"
                  on:click={() => removeVariable(index)}
                >
                  <span class="mr-1">Delete</span>
                  <span class="ml-1 icon"><X /></span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>

        <!-- Footer -->
        <tfoot>
          <tr>
            <th colspan="3">
              <button
                class="button is-light is-primary is-fullwidth"
                on:click={addVariable}
              >
                <span class="mr-1">Add variable</span>
                <span class="ml-1 icon"><ListPlus /></span>
              </button>
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
    <p class="help">
      See <a
        href="https://bulma.io/documentation/customize/variables"
        target="_blank"
        rel="noreferrer nofollow">Bulma's documentation</a
      >
      for more information. Full
      <a
        href="https://sass-lang.com/documentation/syntax/structure#expressions"
        target="_blank"
        rel="noreferrer nofollow">SASS syntax</a
      > is supported.
    </p>
  </div>

  <!-- Minify -->
  <div class="block field">
    <label class="label" for="minification">Minification</label>
    <label class="checkbox full-width" for="minification">
      <input bind:checked={input.minify} id="minification" type="checkbox" />
      Minify
    </label>
    <p class="help">
      <a
        href="https://developer.mozilla.org/en-US/docs/Glossary/minification"
        target="_blank"
        rel="noreferrer nofollow">Minify</a
      >
      the output CSS. <b>This is strongly recommended.</b>
    </p>
  </div>
</section>

<!-- Output -->
<section class="section">
  <h1 class="title">Output</h1>

  <!-- URL -->
  <div class="block">
    <label class="label" for="css-url">CSS URL</label>
    <a class="wrap" href={output.url.toString()} target="_blank" id="css-url"
      >{output.url.toString()}</a
    >
    <p class="help">
      Download this file and serve it for <a href="/about"
        >maximum performance and reliabilitiy</a
      >.
    </p>
  </div>

  <!-- Snippet -->
  <div class="block">
    <label class="label" for="snippet">Import Snippet</label>
    {#if output.snippet == undefined}
      <progress class="progress is-primary" />
    {:else}
      <div
        class="is-align-items-center is-flex is-flex-direction-row is-justify-content-center"
      >
        <div class="scroll mr-2">
          <pre><code id="snippet">{output.snippet}</code></pre>
        </div>
        <div class="ml-2">
          <button
            class="button mt-2 is-primary"
            class:is-outlined={!output.copied}
            on:click={copySnippet}
          >
            <span class="mr-1">{output.copied ? 'Copied' : 'Copy'}</span>
            <span class="ml-1 icon"
              >{#if output.copied}<Check />{:else}<Copy />{/if}</span
            >
          </button>
        </div>
      </div>
    {/if}
    <p class="help">
      Add this to your website's <a
        href="https://developer.mozilla.org/docs/Web/HTML/Element/head"
        target="_blank"
        rel="noreferrer nofollow"><code>head</code> element</a
      >. If you change any query parameters without updating the
      <a
        href="https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity"
        target="_blank"
        rel="noreferrer nofollow">integrity</a
      >, <b>Bulma On Demand will not work!</b>
    </p>
  </div>
</section>

<style>
  .section {
    padding-bottom: 24px;
    padding-top: 24px;
    width: 100%;
  }

  .select {
    border-radius: 4px;
    font-size: 1rem;
  }

  .wrap {
    overflow-wrap: break-word;
  }

  tbody > tr {
    cursor: grab;
    transition-duration: 200ms;
  }

  @media (prefers-color-scheme: dark) {
    tbody > tr:hover {
      background-color: #404040 !important;
    }
  }

  @media (prefers-color-scheme: light) {
    tbody > tr:hover {
      background-color: #e8e8e8 !important;
    }
  }
</style>
