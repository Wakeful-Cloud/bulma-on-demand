/**
 * @fileoverview Bulma helper
 */

//Imports
import Cache from 'lru-cache';
import Hasher from 'node-object-hash';
import files from './files';
import script from './script';
import type {CompileResult, OutputStyle} from 'sass';
import type {Version} from './variables';
import {NodeVM} from 'vm2';

/**
 * VM sandbox
 */
interface VMSandbox
{
  /**
   * Source files
   * * Key: file path
   * * Value: file content
   */
  files: Map<string, string>;

  /**
   * Source code
   */
  source: string;

  /**
   * Output style
   */
  style: OutputStyle;
}

//Cache
const CACHE_MAX = process.env.CACHE_MAX != null ? parseInt(process.env.CACHE_MAX, 10) : 2560;
const CACHE_TTL = process.env.CACHE_TTL != null ? parseInt(process.env.CACHE_TTL, 10) : 60 * 60 * 1000; //1 hour
const cache = new Cache<string, string>({
  allowStale: true,
  max: CACHE_MAX,
  ttl: CACHE_TTL,
  ttlResolution: 5 * 60 * 1000, //5 minutes
});

//Initialize the hasher
const hasher = Hasher({
  coerce: true,
  enc: 'base64'
});

/**
 * Compile Bulma with the specified variables
 * @param version Bulma version
 * @param minify Whether or not to minify Bulma
 * @param variables Bulma SASS variables
 * @returns Raw Bulma CSS
 */
const compile = async (version: Version, minify: boolean, variables: Record<string, string>) =>
{
  //Generate the cache key
  const key = hasher.hash({
    version,
    minify,
    ...variables,
  });

  //Check cache
  if (cache.has(key))
  {
    return cache.get(key);
  }
  else
  {
    //Generate the source
    const source = `@charset "utf-8"
/*! Built by Bulma On Demand | MIT License | github.com/wakeful-cloud/bulma-on-demand */

${Object.entries(variables).map(([key, value]) => `$${key}: ${value}`).join('\r\n')}

@import "bulma.sass"`;

    //Initialize the VM
    const vm = new NodeVM({
      allowAsync: false,
      eval: true,
      require: {
        builtin: [
          'path/posix',
          'url',
          'util'
        ],
        context: 'sandbox',
        external: {
          modules: [
            'immutable',
            'sass'
          ],
          transitive: false
        },
        mock: {
          fs: {}
        }
      },
      sandbox: {
        source,
        style: minify ? 'compressed' : 'expanded'
      } as VMSandbox,
      wasm: false,
      wrapper: 'none'
    });
    vm.freeze(files[version], 'files');

    //Run the SASS compiler in the VM
    const result = vm.run(script) as CompileResult | undefined;

    //Get the CSS
    const css = result?.css;
    if (typeof css != 'string' || css.length > (1 << 20))
    {
      throw new Error('Failed to compile Bulma! (Result is unexpected)');
    }

    //Update cache
    cache.set(key, css);

    return css;
  }
};

//Export
export default compile;