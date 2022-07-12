<script lang="ts">
  //Imports
  import {Github, Home, Info, Sliders} from 'lucide-svelte';
  import {MetaTags} from 'svelte-meta-tags';
  import {error} from '$lib/stores';

  //Data
  const title = 'Bulma On Demand';
  const description = 'Customize Bulma without installing anything';
  const canonicalUrl = import.meta.env.VITE_CANONICAL_URL ?? 'https://bulma-on-demand.vercel.app';
  const author = 'Wakeful Cloud';
  const keywords = 'Bulma,SASS,Svelte,SvelteKit';

  const darkLogoAlt = 'Dark logo';
  const darkLogoUrl = new URL('/logo-dark.webp', canonicalUrl).toString();
  const lightLogoAlt = 'Light logo';
  const lightLogoUrl = new URL('/logo-light.webp', canonicalUrl).toString();

  //State
  let menuOpen = false;
</script>

<!-- Metadata -->
<MetaTags
{title}
{description}
additionalMetaTags={[
  {
    name: 'keywords',
    content: keywords
  },
  {
    name: 'author',
    content: author
  },
  {
    name: 'theme-color',
    content: '#00d1b2'
  },
  {
    name: 'msapplication-TileColor',
    content: '#333333'
  }
]}
openGraph={{
  type: 'website',
  url: canonicalUrl,
  title,
  site_name: title,
  description,
  images: [
    {
      url: darkLogoUrl,
      alt: darkLogoAlt
    },
    {
      url: lightLogoUrl,
      alt: lightLogoAlt
    }
  ]
}}
twitter={{
  cardType: 'summary_large_image',
  title,
  description,
  image: darkLogoUrl,
  imageAlt: darkLogoAlt
}}
/>

<!-- Header-->
<header class="navbar" role="navigation" aria-label="main navigation">
  <!-- Banner -->
  <div class="navbar-brand">
    <!-- Logo button -->
    <a class="py-0 navbar-item" href="/">
      <img alt="Light logo" class="logo only-light" src="/logo-light.webp" />
      <img alt="Dark logo" class="logo only-dark" src="/logo-dark.webp" />
    </a>

    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      on:click={() => (menuOpen = !menuOpen)}
      role="button"
      class="navbar-burger"
      class:is-active={menuOpen}
      aria-label="menu"
      aria-expanded="false"
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </a>
  </div>

  <!-- Pages -->
  <div class="navbar-menu" class:is-active={menuOpen}>
    <div class="navbar-start">
      <a class="navbar-item" href="/">
        <span class="icon mr-1"><Home /></span>
        <span class="ml-1">Home</span>
      </a>
      <a class="navbar-item" href="/customizer">
        <span class="icon mr-1"><Sliders /></span>
        <span class="ml-1">Customizer</span>
      </a>
      <a class="navbar-item" href="/about">
        <span class="icon mr-1"><Info /></span>
        <span class="ml-1">About</span>
      </a>
    </div>
  </div>

  <!-- Links -->
  <div class="navbar-end">
    <a
      class="navbar-item"
      href="https://github.com/wakeful-cloud/bulma-on-demand"
      target="_blank"
      rel="noreferer nofollow"
    >
      <span class="icon mr-1"><Github /></span>
      <span class="ml-1">GitHub</span>
    </a>
  </div>
</header>

<!-- Content -->
<main
  class="mx-6 is-align-items-center is-flex is-flex-direction-column is-flex-grow-1 is-justify-content-center"
>
  <slot />
</main>

<!-- Footer -->
<footer class="hero is-small">
  <div class="has-text-centered hero-body">
    <p class="is-size-6">
      Made with ❤️ by <a
        href="https://wakefulcloud.dev"
        target="_blank"
        rel="noreferer nofollow">Wakeful Cloud</a
      >.
      <br />
      Bulma On Demand is not affiliated with Jeremy Thomas.
    </p>
  </div>
</footer>

<!-- Error snackbar -->
{#if $error.visible}
  <div class="error-container">
    <div class="error is-danger mx-auto notification">
      <pre class="error-text">{$error.text}</pre>
      <button class="delete" on:click={error.close} />
    </div>
  </div>
{/if}

<style>
  .error-container {
    bottom: 10px;
    position: fixed;
    width: 100%;
  }

  .error {
    width: fit-content;
  }

  .error-text {
    background: inherit;
  }

  @media (prefers-color-scheme: dark) {
    .error-text {
      color: #ffffff;
    }
  }

  @media (prefers-color-scheme: light) {
    .error-text {
      color: #000000;
    }
  }

  .logo {
    max-height: none;
    height: 1.5rem;
  }
</style>
