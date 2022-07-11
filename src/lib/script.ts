/**
 * @fileoverview VM Script
 * 
 * @see https://github.com/patriksimek/vm2#vmscript
 */

//Imports
import {VMScript} from 'vm2';

/**
 * Bulma compiler script
 */
const script = new VMScript(`//Native imports
const {URL} = require('url');
const {extname, format, join, parse} = require('path/posix');

//Globals
globalThis.URL = URL;

//External imports
const {compileString} = require('sass');

//Compile the SASS
return compileString(source, {
  alertAscii: true,
  alertColor: false,
  //See https://sass-lang.com/documentation/js-api/interfaces/Importer
  importer: {
    canonicalize: {
      //Dart SASS invokes "call$2" instead of "call"
      call$2: url =>
      {
        //Convert the URL to a path (fileURLToPath doesn't support POSIX paths on Windows)
        const path = new URL(url).pathname;

        //Parse the path
        const parsed = parse(path);

        //Generate candidates
        const candidates = parsed.ext == '' ? [
          format({
            ...parsed,
            base: \`\${parsed.name}.sass\`
          }),
          format({
            ...parsed,
            base: \`\${parsed.name}.scss\`
          }),
          format({
            ...parsed,
            base: \`_\${parsed.name}.sass\`
          }),
          format({
            ...parsed,
            base: \`_\${parsed.name}.scss\`
          }),

          join(path, 'index.sass'),
          join(path, 'index.scss'),
          join(path, '_index.sass'),
          join(path, '_index.scss')
        ] : [
          path,
          format({
            ...parsed,
            base: \`_\${parsed.base}\`
          }),
        ];

        //Evaluate candidates
        for (const candidate of candidates)
        {
          if (files[candidate] != null)
          {
            //pathToFileURL doesn't support POSIX paths on Windows
            return new URL(candidate, 'file:///');
          }
        }

        throw new Error(\`Invalid import URL \${url}!\`);
      }
    },
    load: {
      //Dart SASS invokes "call$1" instead of "call"
      call$1: url =>
      {
        //Convert the URL to a path
        const path = url.pathname;

        //Get the file
        const contents = files[path];

        if (contents == null)
        {
          return null;
        }

        //Get the extension
        const extension = extname(path);

        return {
          contents,
          syntax: extension == '.sass' ? 'indented' : 'scss'
        };
      }
    }
  },
  style,
  syntax: 'indented',
  url: new URL('file:///')
});`);

//Export
export default script;