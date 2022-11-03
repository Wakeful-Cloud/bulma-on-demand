/**
 * @fileoverview Bulma on demand
 */

//Imports
import compile from '$lib/compile';
import {error, type RequestHandler} from '@sveltejs/kit';
import {type ObjectSchema, ValidationError, object, string} from 'yup';
import {variables, versions, type Version} from '$lib/variables';

//Suffix pattern
const suffixPattern = /^(?:-(\d+\.\d+\.\d+))?\.(css|min\.css)$/;

//Parsed suffix schema
const suffixSchema = object({
  version: string().oneOf(versions).default(versions[0]).required(),
  extension: string().oneOf(['css', 'min.css']).required()
}).required();

//Generate version-specific request schemas
const schemas = Object.fromEntries(Object.entries(variables).map(([version, releaseVariables]) => [
  version,
  object(Object.fromEntries(releaseVariables.map(variable => [
    variable,
    string().min(1).max(256).optional()
  ])))
])) as Record<Version, ObjectSchema<any, any, any, any>>;

/**
 * GET handler
 * @param ctx Response context
 * @returns Response
 */
export const GET: RequestHandler = async ctx =>
{
  //Set common headers
  ctx.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET'
  });

  //Get the raw query parameters
  const query = Object.fromEntries(ctx.url.searchParams.entries());

  //Validate the request
  let version: Version;
  let minify: boolean;
  let userVariables: Record<string, string>;
  try
  {
    //Parse the suffix
    const parsed = suffixPattern.exec(ctx.params.suffix!)!;

    //Validate the suffix
    const suffix = await suffixSchema.validate({
      version: parsed?.[1],
      extension: parsed?.[2]
    });
    version = suffix.version;
    minify = suffix.extension == 'min.css';

    //Get the version-specific schema
    const versionSpecific = schemas[version];

    //Validate against the version-specific schema
    userVariables = await versionSpecific.validate(query, {
      stripUnknown: true
    });
  }
  catch (err)
  {
    if (err instanceof ValidationError)
    {
      throw error(400, err);
    }
    else
    {
      console.error(err);
      throw error(400, 'Invalid request format!');
    }
  }

  //Compile Bulma
  try
  {
    //Compile
    const css = await compile(version, minify, userVariables);

    //Add additional headers
    ctx.setHeaders({
      'Cache-Control': 'max-age=31536000, stale-while-revalidate, no-transform, immutable',
      'Content-Type': 'text/css'
    });

    return new Response(css);
  }
  catch (err)
  {
    if (err instanceof ValidationError)
    {
      throw error(400, err);
    }
    else
    {
      console.error(err);
      throw error(400, 'Invalid request format!');
    }
  }
};