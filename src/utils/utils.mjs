
import { parseScript } from 'meriyah';

export const addDefaultLog = code => {
  const lines = code.split('\n');
  const tree = parseScript(code, { loc: true });
  const insert = ({ line, column }, str, trim = false) => {
    const l = lines[line-1];
    lines[line-1] = [
      trim ? l.substr(0, column).replace(/;$/, '') : l.substr(0, column),
      str,
      l.substr(column)
    ].join('');
  };

  const exprs = (tree.body
    .filter(node => node.type === 'ExpressionStatement')
    .filter(node => {
      if (node.expression.type !== 'Literal') return true;
      if (node.expression.value !== 'use strict') return true;
      return false;
    })
    .filter(node => {
      const expr = node.expression;
      if (expr.type !== 'CallExpression') return true;
      const callee = expr.callee;
      if (callee.type !== 'MemberExpression') return true;
      if (callee.object.type !== 'Identifier') return true;
      if (callee.object.name !== 'console') return true;
      return false;
    })
  );

  exprs.map(expr => {
    const { start, end } = expr.loc;
    insert(end, ');', true);
    insert(start, 'console.log(');
  });

  return lines.join('\n');
};
