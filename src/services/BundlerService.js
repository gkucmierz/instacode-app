import { extractDependencies } from '../utils/parser.mjs';
import { resolvePackage } from './PackageManager.js';

const fetchUMD = async (name, version) => {
  const cacheKey = `umd:${name}@${version || 'latest'}`;
  // We don't cache UMD in IDB for now to keep it simple, or we could.
  // Let's just fetch it directly for the bundler export feature.
  const url = `https://unpkg.com/${name}${version ? `@${version}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.text();
};

export const bundleCode = async (code) => {
  const deps = extractDependencies(code);
  if (deps.length === 0) return code;

  // We need to replace from bottom to top to preserve line and character coordinates
  // But wait, if we only have line numbers, replacing lines is easier.
  // Actually, string replacement is easier.
  
  const lines = code.split('\n');
  
  // Sort dependencies by line number descending
  deps.sort((a, b) => b.loc.start.line - a.loc.start.line);

  for (const dep of deps) {
    if (dep.name.startsWith('data:') || dep.name.startsWith('http://') || dep.name.startsWith('https://')) {
      continue;
    }

    const lineIndex = dep.loc.start.line - 1;
    const originalLine = lines[lineIndex];

    if (dep.type === 'import') {
      const pkgCode = await resolvePackage(dep.name, dep.version);
      // Encode to base64 safely
      const base64 = btoa(unescape(encodeURIComponent(pkgCode)));
      const dataUri = `data:text/javascript;base64,${base64}`;
      
      // Replace the module specifier (e.g. 'lodash' or "lodash") with the data URI
      // We use a regex to match the exact string literal at the end of the import statement
      const regex = new RegExp(`(['"])${dep.name}\\1`);
      lines[lineIndex] = originalLine.replace(regex, `'${dataUri}'`);
      
    } else if (dep.type === 'require') {
      // Fetch UMD for synchronous require replacement
      const umdCode = await fetchUMD(dep.name, dep.version);
      
      // We escape backticks, dollar signs, and slashes just in case, but an IIFE doesn't need string escaping if we inject code directly!
      // Wait, we can't just inject code with `</script>` tags if they put it in HTML.
      // But we are generating JS.
      const iife = `(function(module, exports){ ${umdCode}\n;return module.exports; })({exports:{}}, {})`;
      
      const regex = new RegExp(`require\\(\\s*['"]${dep.name}['"]\\s*\\)`);
      lines[lineIndex] = originalLine.replace(regex, iife);
    }
  }

  return lines.join('\n');
};
