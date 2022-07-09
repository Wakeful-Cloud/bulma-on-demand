/**
 * @fileoverview Fetch all Bulma releases
 * 
 * *Note: this should be ran with `npm run fetch-bulma`.*
 */

//Imports
import JSZip from 'jszip';
import got from 'got';
import type {Endpoints} from '@octokit/types';
import {dirname, extname, join} from 'path';
import {fileURLToPath} from 'url';
import {writeFile} from 'fs/promises';

//Maximum releases
const maxReleases = 10;

//Patters of files containing SASS variables (Ordered by descending importance)
const variableFilePatterns = [
  /^bulma(?:-[^/]+)?\/sass\/utilities\/initial-variables\.s[ac]ss$/,
  /^bulma(?:-[^/]+)?\/sass\/utilities\/derived-variables\.s[ac]ss$/,
  /^bulma(?:-[^/]+)?\/sass\/base\/generic\.s[ac]ss$/
];

//SASS variable name pattern
const variablePattern = /(?<=\$)(?:[a-zA-Z0-9_-]|\\[0-9a-fA-F]{1,6}\s*)+/g;

//Get releases response type
type Releases = Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data'];

const main = async () =>
{
  //Get all releases
  let releases = await got('https://api.github.com/repos/jgthms/bulma/releases', {
    method: 'GET',
  }).json<Releases>();

  //Truncate
  if (releases.length > maxReleases)
  {
    releases = releases.slice(0, maxReleases);
  }

  //Download releases and extract data
  const files = new Map<string, Map<string, string>>();
  const variables = new Map<string, Set<string>>();

  for (const release of releases.slice(0, Math.min(maxReleases, releases.length)))
  {
    //Skip releases missing information
    if (release.name == null || release.assets.length == 0)
    {
      console.warn(`Failed to get release name and/or assets for release ${release.name ?? release.tag_name}`);
      continue;
    }

    //Get the source asset
    const asset = release.assets.find(asset => asset.name.startsWith('bulma-') && asset.content_type == 'application/zip');

    if (asset == null)
    {
      console.warn(`Failed to get asset for release ${release.name}`);
      continue;
    }

    //Download the release
    const downloader = await got(asset.browser_download_url, {
      followRedirect: true,
      method: 'GET'
    }).buffer();

    //Load the ZIP
    const zip = await JSZip.loadAsync(downloader);

    //Extract files
    const releaseFiles = new Map<string, string>();
    for (const [path, file] of Object.entries(zip.files))
    {
      //Skip folders and non-SASS files
      if (file.dir || !['.sass', '.scss'].includes(extname(path)))
      {
        continue;
      }

      //Get the path without the top level folder
      const subpath = path.replace(/^[/\\]?[^/\\]+(?:([/\\])|$)/g, '$1');

      //Read the file
      const raw = await file.async('string');

      //Add the file
      releaseFiles.set(subpath, raw);
    }

    //Add files
    files.set(release.name, releaseFiles);

    //Extract variables
    const releaseVariables = [] as string[];
    for (const pattern of variableFilePatterns)
    {
      //Get the file
      const file = await zip.file(pattern);

      if (file == null || file.length == 0)
      {
        console.warn(`Failed to get file ${pattern} for release ${release.name}`);
        continue;
      }

      //Read the file
      const text = await file[0]!.async('text');

      //Extract variables
      const matches = text.match(variablePattern);

      //Add
      if (matches != null)
      {
        releaseVariables.push(...matches);
      }
    }

    //Sort
    releaseVariables.sort();

    //Add variables
    variables.set(release.name, new Set(releaseVariables));
  }

  //Format
  const formattedFiles = `/**
 * @fileoverview Bulma source code files
 *
 * AUTO-GENERATED - DO NOT EDIT!
 * *Note: this can be regenerated/updated with \`npm run fetch-bulma\`.*
 */

/**
 * Bulma SASS files
 * * Key: release version
 * * Value: SASS files indexed by path
 */
const files = {
${Array.from(files).map(([release, releaseFiles]) =>
    `  '${release}': {
${Array.from(releaseFiles).map(([path, raw]) => `    '${path}': ${JSON.stringify(raw)}`).join(',\r\n')}
    }`).join(',\r\n')}
};

//Export
export default files;`;

  const formattedVariables = `/**
 * @fileoverview Bulma variables
 *
 * AUTO-GENERATED - DO NOT EDIT!
 * *Note: this can be regenerated/updated with \`npm run fetch-bulma\`.*
 */

/**
 * Bulma SASS variables
 * * Key: release version
 * * Value: SASS variables
 */
export const variables = {
${Array.from(variables).map(([release, releaseVariables]) =>
      `  '${release}': [
${Array.from(releaseVariables).map(variable => `    '${variable}'`).join(',\r\n')}
  ]`).join(',\r\n')}
};

/**
 * Bulma version
 */
export type Version = keyof typeof variables;

/**
 * Bulma versions
 */
export const versions = Object.keys(variables) as Version[];`;

  //Get the current dir
  const dir = dirname(fileURLToPath(import.meta.url));

  //Get output paths
  const filesOutput = join(dir, '..', 'src', 'lib', 'files.ts');
  const variablesOutput = join(dir, '..', 'src', 'lib', 'variables.ts');

  //Save
  await writeFile(filesOutput, formattedFiles);
  await writeFile(variablesOutput, formattedVariables);

  //Print
  console.log(`Saved to ${filesOutput} and ${variablesOutput}.`);
};

main();