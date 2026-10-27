// The small synchronous menu must agree with every lazy implementation, in both languages/currencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const root = new URL('../../js/games/', import.meta.url);
const text = fs.readFileSync(new URL('catalog.js', root), 'utf8');
const source = file => ts.createSourceFile(file, fs.readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function registered(file) {
  const ast = source(file), vars = {}, out = [];
  const visit = (n, f) => { f(n); ts.forEachChild(n, x => visit(x, f)); };
  visit(ast, n => { if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) vars[n.name.getText(ast)] = n.initializer; });
  const props = n => {
    if (ts.isIdentifier(n)) n = vars[n.getText(ast)];
    assert.ok(n && ts.isObjectLiteralExpression(n), `unsupported registration in ${file}`);
    const p = new Map();
    for (const prop of n.properties) {
      if (ts.isSpreadAssignment(prop)) for (const [k, v] of props(prop.expression)) p.set(k, v);
      else if (prop.name?.getText(ast) !== 'run') p.set(prop.name.getText(ast), prop.getText(ast));
    }
    return p;
  };
  visit(ast, n => { if (ts.isCallExpression(n) && n.expression.getText(ast) === 'register') out.push(`({${[...props(n.arguments[0]).values()].join(',')}})`); });
  return out;
}
test('menu catalogue matches lazy game definitions, order, names and eligibility', () => {
  for (const hasQuiz of [false, true]) for (const lang of [0, 1]) for (const currency of ['AUD', 'VND']) {
    const context = vm.createContext({ T: (...pair) => pair[lang], curCode: () => currency, familyQuizQuestions: () => hasQuiz ? [{}] : [] });
    const c = vm.runInContext(text.replace(/^import .*;$/gm, '').replace(/export const/g, 'const') + '\n({catalog:GAME_CATALOG, groups:GAME_LOADERS})', context);
    const expected = Object.entries(c.groups).flatMap(([file, group]) => {
      const defs = registered(file).map(expression => vm.runInContext(expression, context));
      assert.deepEqual(Array.from(group.ids), defs.map(d => d.id), file);
      return defs;
    });
    const plain = defs => JSON.parse(JSON.stringify(defs.map(d => ({ ...d, name: d.name() }))));
    assert.deepEqual(plain(c.catalog), plain(expected.filter(d => d.id !== 'familyquiz' || hasQuiz)));
    assert.equal(new Set(c.catalog.map(d => d.id)).size, c.catalog.length);
  }
});
