/**
 * @fileoverview Vite config
 */

//Imports
import {defineConfig} from 'vite';
import {sveltekit} from '@sveltejs/kit/vite';

//Export
export default defineConfig({
  plugins: [
    sveltekit()
  ]
});