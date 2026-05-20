import { describe, it, expect } from 'vitest';
import { extractDependencies, transformImports } from '../src/utils/parser.mjs';

describe('parser.mjs', () => {
  describe('extractDependencies', () => {
    it('should extract require statements without version', () => {
      const code = `const _ = require('lodash');`;
      const deps = extractDependencies(code);
      expect(deps).toMatchObject([{ name: 'lodash', version: null }]);
    });

    it('should extract require statements with version comment', () => {
      const code = `const dayjs = require('dayjs'); /* @1.11.10 */`;
      const deps = extractDependencies(code);
      expect(deps).toMatchObject([{ name: 'dayjs', version: '1.11.10' }]);
    });

    it('should extract import statements with version comment', () => {
      const code = `import lodash from 'lodash'; /* v4.17.21 */`;
      const deps = extractDependencies(code);
      expect(deps).toMatchObject([{ name: 'lodash', version: '4.17.21' }]);
    });

    it('should extract named import statements with version comment', () => {
      const code = `import { format, parse } from 'date-fns'; // @2.30.0`;
      const deps = extractDependencies(code);
      expect(deps).toMatchObject([{ name: 'date-fns', version: '2.30.0' }]);
    });

    it('should extract multiple dependencies', () => {
      const code = `
        import lodash from 'lodash'; /* v1.0.0 */
        const uuid = require('uuid'); /* @2.0.0 */
      `;
      const deps = extractDependencies(code);
      expect(deps).toMatchObject([
        { name: 'lodash', version: '1.0.0' },
        { name: 'uuid', version: '2.0.0' }
      ]);
    });
  });

  describe('transformImports', () => {
    it('should transform bare imports', () => {
      const code = `import 'lodash';`;
      const transformed = transformImports(code);
      expect(transformed).toBe(`require('lodash');`);
    });

    it('should transform default imports', () => {
      const code = `import _ from 'lodash';`;
      const transformed = transformImports(code);
      expect(transformed).toBe(`const _ = require('lodash').default || require('lodash');`);
    });

    it('should transform named imports', () => {
      const code = `import { cloneDeep, merge } from 'lodash';`;
      const transformed = transformImports(code);
      expect(transformed).toBe(`const { cloneDeep, merge } = require('lodash');`);
    });

    it('should transform aliased named imports', () => {
      const code = `import { cloneDeep as clone } from 'lodash';`;
      const transformed = transformImports(code);
      expect(transformed).toBe(`const { cloneDeep: clone } = require('lodash');`);
    });

    it('should preserve line numbers for error reporting', () => {
      const code = `console.log(1);\nimport _ from 'lodash';\nconsole.log(2);`;
      const transformed = transformImports(code);
      expect(transformed.split('\n').length).toBe(3);
    });
  });
});
