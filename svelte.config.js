/**
 * @fileoverview SvelteKit config
 */

//Imports
import preprocess from 'svelte-preprocess';

//Adapters
import cloudflare from '@sveltejs/adapter-cloudflare';
import netlify from '@sveltejs/adapter-netlify';
import node from '@sveltejs/adapter-node';
import vercel from '@sveltejs/adapter-vercel';

const adapters = [
	{
		name: 'Cloudflare',
		test: () => process.env.CF_PAGES != null,
		adapter: cloudflare(),
	},
	{
		name: 'Netlify',
		test: () => process.env.NETLIFY != null,
		adapter: netlify({
			split: true
		}),
	},
	{
		name: 'Vercel',
		test: () => process.env.VERCEL != null,
		adapter: vercel({
			split: true
		}),
	}
];

//Get the most relevant adapter
let adapter;

const adapterMetadata = adapters.find(adapter => adapter.test());
if (adapterMetadata != null)
{
	adapter = adapterMetadata.adapter;
	console.log(`Using adapter ${adapter.name}.`);
}
else
{
	adapter = node();
	console.log('Using adapter Node.');
}

/**
 * SvelteKit config
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
	preprocess: preprocess(),
	kit: {
		adapter,
		csp: {
			mode: 'auto'
		}
	}
};

//Export
export default config;