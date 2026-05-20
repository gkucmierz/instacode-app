import { parse } from 'meriyah';

const VERSION_REGEX = /(?:v|@)(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)/i;

const extractVersionFromComments = (comments, line) => {
  const lineComments = comments.filter(c => c.loc.start.line === line);
  for (const c of lineComments) {
    const match = VERSION_REGEX.exec(c.value);
    if (match) return match[1];
  }
  return null;
};

export const extractDependencies = (code) => {
  const deps = [];
  let tree;
  const comments = [];
  try {
    tree = parse(code, { loc: true, module: true, onComment: comments, next: true });
  } catch (e) {
    return []; // Invalid code, return empty deps
  }

  const { body } = tree;

  // Find all import declarations
  body.filter(node => node.type === 'ImportDeclaration').forEach(node => {
    const name = node.source.value;
    const line = node.loc.start.line;
    const version = extractVersionFromComments(comments, line);
    
    const specifiers = node.specifiers.map(s => {
      if (s.type === 'ImportSpecifier') return s.imported.name;
      if (s.type === 'ImportDefaultSpecifier') return 'default';
      return null;
    }).filter(Boolean);

    deps.push({ name, version, type: 'import', loc: node.loc, specifiers });
  });

  // Find all require calls
  const walk = (node) => {
    if (!node) return;
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require') {
      if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        const name = node.arguments[0].value;
        const line = node.loc.start.line;
        const version = extractVersionFromComments(comments, line);
        
        deps.push({ name, version, type: 'require', loc: node.loc });
      }
    }
    
    if (node.type === 'CallExpression' && node.callee.type === 'Import') {
      if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
        const name = node.arguments[0].value;
        const line = node.loc.start.line;
        const version = extractVersionFromComments(comments, line);
        
        deps.push({ name, version, type: 'dynamic-import', loc: node.loc });
      }
    }
    
    // Simple tree traversal for required calls
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(walk);
        } else {
          walk(node[key]);
        }
      }
    }
  };

  walk(tree);

  return deps;
};

export const transformImports = (code) => {
  const lines = code.split('\n');
  let tree;
  try {
    tree = parse(code, { loc: true, module: true, next: true });
  } catch (e) {
    return code; // Return original if it fails to parse
  }

  // We must transform from bottom to top to preserve line numbers
  const imports = tree.body.filter(node => node.type === 'ImportDeclaration').reverse();

  imports.forEach(node => {
    const pkg = node.source.value;
    const startLine = node.loc.start.line - 1;
    const endLine = node.loc.end.line - 1;
    
    let replacement = '';
    
    if (node.specifiers.length === 0) {
      replacement = `require('${pkg}');`;
    } else {
      const defaultSpec = node.specifiers.find(s => s.type === 'ImportDefaultSpecifier');
      const namedSpecs = node.specifiers.filter(s => s.type === 'ImportSpecifier');
      const namespaceSpec = node.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');

      const stmts = [];
      if (defaultSpec) {
        stmts.push(`const ${defaultSpec.local.name} = require('${pkg}').default || require('${pkg}');`);
      }
      if (namespaceSpec) {
        stmts.push(`const ${namespaceSpec.local.name} = require('${pkg}');`);
      }
      if (namedSpecs.length > 0) {
        const aliases = namedSpecs.map(s => {
          if (s.imported.name === s.local.name) return s.local.name;
          return `${s.imported.name}: ${s.local.name}`;
        }).join(', ');
        stmts.push(`const { ${aliases} } = require('${pkg}');`);
      }
      replacement = stmts.join('\n');
    }

    // Replace the lines
    const before = lines.slice(0, startLine);
    const after = lines.slice(endLine + 1);
    
    // We replace the entire block of the import with the replacement.
    // To preserve overall line count (so console.log lines match), we pad with empty lines.
    const padding = new Array(endLine - startLine).fill('');
    
    lines.splice(0, lines.length, ...before, replacement, ...padding, ...after);
  });

  return lines.join('\n');
};

export const extractExports = (code) => {
  const exports = new Set();
  let tree;
  try {
    tree = parse(code, { module: true, next: true });
  } catch (e) {
    return [];
  }

  tree.body.forEach(node => {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach(d => {
            if (d.id.type === 'Identifier') exports.add(d.id.name);
          });
        } else if (node.declaration.type === 'FunctionDeclaration' || node.declaration.type === 'ClassDeclaration') {
          if (node.declaration.id && node.declaration.id.name) {
            exports.add(node.declaration.id.name);
          }
        }
      }
      if (node.specifiers) {
        node.specifiers.forEach(s => {
          if (s.exported && s.exported.name) exports.add(s.exported.name);
        });
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      exports.add('default');
    }
  });

  return Array.from(exports);
};
