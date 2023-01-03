![Dark logo](./logo/logo-dark.png#gh-dark-mode-only)
![Light logo](./logo/logo-light.png#gh-light-mode-only)

![CDN Status](https://img.shields.io/website?label=CDN%20Status&style=flat-square&url=https%3A%2F%2Fbulma-on-demand.vercel.app%2Fapi%2Fbulma.min.css)
[![GitHub Continuous Deployment Status](https://img.shields.io/github/actions/workflow/status/wakeful-cloud/bulma-on-demand/cd.yml?label=Deployment&style=flat-square)](https://github.com/wakeful-cloud/bulma-on-demand/actions/workflows/cd.yml)
[![Package.json Version](https://img.shields.io/github/package-json/v/wakeful-cloud/bulma-on-demand?label=Version&style=flat-square)](https://github.com/Wakeful-Cloud/bulma-on-demand/blob/main/package.json)

Customize [Bulma](https://bulma.io) without installing anything

*Note: Bulma On Demand is not affiliated with Jeremy Thomas.*

## Documentation

### Deployment
Bulma On Demand can be deployed pretty much anywhere you can run [SvelteKit](https://kit.svelte.dev).
However, environments that limit execution-time/request to under ~1 second (eg: Cloudflare Workers
free tier) will not work.

#### Docker
```bash
docker run -p 3000:3000/tcp --rm --name bulma-on-demand ghcr.io/wakeful-cloud/bulma-on-demand:latest
```

*Note: because no data is persisted, attaching a volume is not necessary or even recommended.*

#### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwakeful-cloud%2Fbulma-on-demand&env=ENABLE_VC_BUILD&envDescription=Set%20to%20%601%60%20in%20order%20for%20SvelteKit%20to%20build%20correctly.&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fbuild-output-api%2Fv3&project-name=bulma-on-demand&repo-name=bulma-on-demand)

*Note: you need to use `npm run build:vercel` for the build command and set the `ENABLE_VC_BUILD`
environment variable to `1`.*

### Environment Variables
Name | Required/Default | Description
--- | --- | ---
`CACHE_MAX` | `2560` | Maximum number of cached Bulma compilations (Each compilation is ~210 KiB)
`CACHE_TTL` | 1 hour | Cached Bulma compilation Time To Live in milliseconds
`VITE_CANONICAL_URL` | `https://bulma-on-demand.vercel.app` | HTML/OpenGraph canonical URL

### Development
1. Install prerequisites:
    * [NodeJS (With NPM)](https://nodejs.org)
2. Run in development:
```bash
npm run dev
```