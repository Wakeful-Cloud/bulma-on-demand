<script lang="ts">
  //Imports
  import {ArrowRight} from 'lucide-svelte';
</script>

<div class="content has-text-centered mx-6">
  <img alt="Light logo" class="logo only-light" src="/logo-light.webp" />
  <img alt="Dark logo" class="logo only-dark" src="/logo-dark.webp" />
  <p class="is-size-4">
    Customize <a
      href="https://bulma.io"
      target="_blank"
      rel="noreferer nofollow">Bulma</a
    > without installing anything
  </p>
  <a class="button is-light is-primary" href="/customizer"><span class="mr-1">Get started</span><span class="icon ml-1"><ArrowRight /></span></a>
</div>

<style>
  .logo {
    max-width: 50vw;
  }
</style>