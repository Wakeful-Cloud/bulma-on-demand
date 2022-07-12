/**
 * @fileoverview Bulma helper
 */

//Imports
import Cache from 'lru-cache';
import Hasher from 'node-object-hash';
import files from './files';
import type {Version} from './variables';
import {compileStringAsync} from 'sass-embedded';
import {extname, format, join, parse} from 'path/posix';

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

    //Get the release files
    const releaseFiles = files[version];

    //Compile the SASS
    const result = await compileStringAsync(source, {
      alertAscii: true,
      alertColor: false,
      //See https://sass-lang.com/documentation/js-api/interfaces/Importer
      importer: {
        canonicalize: url =>
        {
          //Convert the URL to a path (fileURLToPath doesn't support POSIX paths on Windows)
          const path = new URL(url).pathname;

          //Parse the path
          const parsed = parse(path);

          //Generate candidates
          const candidates = parsed.ext == '' ? [
            format({
              ...parsed,
              base: `${parsed.name}.sass`
            }),
            format({
              ...parsed,
              base: `${parsed.name}.scss`
            }),
            format({
              ...parsed,
              base: `_${parsed.name}.sass`
            }),
            format({
              ...parsed,
              base: `_${parsed.name}.scss`
            }),

            join(path, 'index.sass'),
            join(path, 'index.scss'),
            join(path, '_index.sass'),
            join(path, '_index.scss')
          ] : [
            path,
            format({
              ...parsed,
              base: `_${parsed.base}`
            }),
          ];

          //Evaluate candidates
          for (const candidate of candidates)
          {
            if (releaseFiles[candidate as keyof typeof releaseFiles] != null)
            {
              //pathToFileURL doesn't support POSIX paths on Windows
              return new URL(candidate, 'file:///');
            }
          }

          throw new Error(`Invalid import URL ${url}!`);
        },
        load: url =>
        {
          //Convert the URL to a path
          const path = url.pathname;

          //Get the file
          const contents = releaseFiles[path as keyof typeof releaseFiles];

          if (contents == null)
          {
            return null;
          }

          //Get the extension
          const extension = extname(path);

          return {
            contents: contents,
            syntax: extension == '.sass' ? 'indented' : 'scss'
          };
        }
      },
      style: minify ? 'compressed' : 'expanded',
      syntax: 'indented',
      url: new URL('file:///')
    });

    //Get the CSS
    const css = result?.css;
    if (css.length > (1 << 20))
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