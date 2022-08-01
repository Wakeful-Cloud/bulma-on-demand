/**
 * @fileoverview Bulma on demand
 */

//Imports
import compile from '$lib/compile';
import sass from 'sass-embedded';
import type {RequestHandler, RequestHandlerOutput} from '@sveltejs/kit';
import {type ObjectSchema, ValidationError, object, string} from 'yup';
import {variables, versions, type Version} from '$lib/variables';

//Common response headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET'
} as RequestHandlerOutput['headers'];

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
  catch (error)
  {
    if (error instanceof ValidationError)
    {
      return {
        headers,
        body: error.errors.join('\r\n'),
        status: 400
      };
    }
    else
    {
      console.error(error);
      return {
        headers,
        body: 'Invalid request format!',
        status: 400
      };
    }
  }

  //Compile Bulma
  try
  {
    //Compile
    const css = await compile(version, minify, userVariables);

    return {
      body: css,
      headers: {
        ...headers,
        'Cache-Control': 'max-age=31536000, stale-while-revalidate, no-transform, immutable',
        'Content-Type': 'text/css'
      }
    };
  }
  catch (error)
  {
    if (error instanceof sass.Exception)
    {
      return {
        headers,
        body: error.toString(),
        status: 400
      };
    }
    else
    {
      console.error(error);
      return {
        headers,
        body: 'Invalid request format!',
        status: 400
      };
    }
  }
};