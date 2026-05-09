import { extractDependencies } from '../utils/parser.mjs';
import { resolvePackage } from './PackageManager.js';
import settingsService from './settingsService.mjs';

export const bundleCode = async (code, treeShake = false) => {
  const deps = extractDependencies(code);
  if (deps.length === 0) return code;

  const lines = code.split('\n');
  let hoistedImports = [];
  let reqCounter = 0;
  
  // Sort dependencies by line number descending
  deps.sort((a, b) => b.loc.start.line - a.loc.start.line);

  for (const dep of deps) {
    if (dep.name.startsWith('data:') || dep.name.startsWith('http://') || dep.name.startsWith('https://')) {
      continue;
    }

    const lineIndex = dep.loc.start.line - 1;
    const originalLine = lines[lineIndex];
    const cdns = settingsService.getItem('cdns') || [];

    if (dep.type === 'import') {
      const { code: pkgCode } = await resolvePackage(dep.name, dep.version, treeShake, dep.specifiers, cdns);
      // Encode to base64 safely
      const base64 = btoa(unescape(encodeURIComponent(pkgCode)));
      const dataUri = `data:text/javascript;base64,${base64}`;
      
      // Replace the module specifier (e.g. 'lodash' or "lodash") with the data URI
      const regex = new RegExp(`(['"])${dep.name}\\1`);
      lines[lineIndex] = originalLine.replace(regex, `'${dataUri}'`);
      
    } else if (dep.type === 'require') {
      // Fetch ESM equivalent and hoist it as an import to properly bundle require dependencies
      const { code: pkgCode } = await resolvePackage(dep.name, dep.version, treeShake, dep.specifiers, cdns);
      const base64 = btoa(unescape(encodeURIComponent(pkgCode)));
      const dataUri = `data:text/javascript;base64,${base64}`;
      
      const varName = `__req_${reqCounter++}`;
      hoistedImports.push(`import * as ${varName} from '${dataUri}';`);
      
      const regex = new RegExp(`require\\(\\s*['"]${dep.name}['"]\\s*\\)`);
      lines[lineIndex] = originalLine.replace(regex, `(${varName}.default || ${varName})`);
    }
  }

  const resultLines = [];
  if (hoistedImports.length > 0) {
    resultLines.push(hoistedImports.join('\n'));
    resultLines.push('');
  }
  resultLines.push(lines.join('\n'));

  return resultLines.join('\n');
};
