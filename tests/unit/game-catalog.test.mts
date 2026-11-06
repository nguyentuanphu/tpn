// The small synchronous menu must agree with every lazy implementation, in both languages/currencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const root = new URL('../../js/games/', import.meta.url);
const text = fs.readFileSync(new URL('catalog.js', root), 'utf8');
const source = file => ts.createSourceFile(file, fs.readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
// Each registration of a file, in source order, as a function of the test's context that gives its definitions.
// A plain register({...}) is read from its object literal. (v1.08b games) a register call inside a loop over lists of game
// data (for (const G of [...QUIZ_GAMES, ...FEST_GAMES]) register({...})) is run for real: the loop, with its skips, runs in
// the test's context over the lists imported from the data files, so every game it registers is compared one by one.
async function registered(file) {
  const ast = source(file), vars = {}, out = [], imports = {};
  const visit = (n, f) => { f(n); ts.forEachChild(n, x => visit(x, f)); };
  const locals = {};
  visit(ast, n => { if (ts.isVariableDeclaration(n) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) vars[n.name.getText(ast)] = n.initializer; });
  for (const st of ast.statements) if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.initializer) locals[d.name.text] = d.initializer;
  for (const st of ast.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings))
    for (const el of st.importClause.namedBindings.elements) if (!el.isTypeOnly && !st.importClause.isTypeOnly) imports[el.name.text] = new URL((st.moduleSpecifier as ts.StringLiteral).text, new URL(file, root));
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
  const hasRegister = n => { let found = false; visit(n, x => { if (ts.isCallExpression(x) && x.expression.getText(ast) === 'register') found = true; }); return found; };
  // data written out in the file (strings, numbers, true/false, and lists and objects of them); code is left out
  const plain = e => ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isNumericLiteral(e) || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(e.kind)
    || (ts.isPrefixUnaryExpression(e) && ts.isNumericLiteral(e.operand)) || (ts.isArrayLiteralExpression(e) && e.elements.every(plain))
    || (ts.isObjectLiteralExpression(e) && e.properties.every(p => ts.isPropertyAssignment(p) && plain(p.initializer)));
  // the games a registration loop goes over: lists imported from data files (taken from the built module), or lists
  // written in the file itself, whose games are read field by field (the fields that are plain data; a game's code, such
  // as its rounds, is only used inside run, which the menu never calls)
  const listOf = async e => {
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression?.(e)) return listOf(e.expression);
    if (ts.isArrayLiteralExpression(e)) { const all = []; for (const x of e.elements) { if (ts.isSpreadElement(x)) all.push(...await listOf(x.expression)); else all.push(await itemOf(x)); } return all; }
    if (ts.isIdentifier(e) && imports[e.text]) { const v = (await import(imports[e.text].href))[e.text]; assert.ok(Array.isArray(v), `${e.text} in ${file} is not a list`); return v; }
    if (ts.isIdentifier(e) && locals[e.text]) return listOf(locals[e.text]);
    assert.fail(`unsupported registration loop in ${file}: ${e.getText(ast)}`);
  };
  const itemOf = async e => {
    if (ts.isObjectLiteralExpression(e)) {
      const o = {};
      for (const p of e.properties) if (ts.isPropertyAssignment(p) && plain(p.initializer)) o[p.name.getText(ast)] = vm.runInNewContext(`(${p.initializer.getText(ast)})`);
      return o;
    }
    assert.ok(plain(e), `unsupported game in a registration loop in ${file}: ${e.getText(ast).slice(0, 80)}`);
    return vm.runInNewContext(`(${e.getText(ast)})`);
  };
  const walk = async n => {
    if (ts.isForOfStatement(n) && hasRegister(n.statement)) {
      // the loop runs for real over those games, with its own skips, and each register() it makes is one game
      const list = await listOf(n.expression);
      const code = ts.transpileModule(`for (${n.initializer.getText(ast)} of __games) ${n.statement.getText(ast)}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
      out.push(context => {
        const defs = [];
        Object.assign(context, { __games: JSON.parse(JSON.stringify(list)), register: def => defs.push(def) });
        try { vm.runInContext(code, context); } finally { delete context.__games; delete context.register; }
        assert.ok(defs.length, `the registration loop in ${file} registered nothing`);
        return defs;
      });
      return;
    }
    if (ts.isCallExpression(n) && n.expression.getText(ast) === 'register') { const expression = `({${[...props(n.arguments[0]).values()].join(',')}})`; out.push(context => [vm.runInContext(expression, context)]); }
    for (const c of n.getChildren(ast)) await walk(c);
  };
  await walk(ast);
  return out;
}
test('menu catalogue matches lazy game definitions, order, names and eligibility', async () => {
  const regs = {}, files = Object.keys(vm.runInContext(text.replace(/^import .*;$/gm, '').replace(/export const/g, 'const') + '\nGAME_LOADERS', vm.createContext({ T: (...pair) => pair[0], curCode: () => 'AUD', familyQuizQuestions: () => [] })));
  for (const file of files) regs[file] = await registered(file);
  for (const hasQuiz of [false, true]) for (const lang of [0, 1]) for (const currency of ['AUD', 'VND']) {
    const context = vm.createContext({ T: (...pair) => pair[lang], curCode: () => currency, familyQuizQuestions: () => hasQuiz ? [{}] : [] });
    const c = vm.runInContext(text.replace(/^import .*;$/gm, '').replace(/export const/g, 'const') + '\n({catalog:GAME_CATALOG, groups:GAME_LOADERS})', context);
    const expected = Object.entries(c.groups).flatMap(([file, group]) => {
      const defs = regs[file].flatMap(f => f(context));
      assert.deepEqual(Array.from(group.ids), defs.map(d => d.id), file);
      return defs;
    });
    const plain = defs => JSON.parse(JSON.stringify(defs.map(d => ({ ...d, name: d.name() }))));
    assert.deepEqual(plain(c.catalog), plain(expected.filter(d => d.id !== 'familyquiz' || hasQuiz)));
    assert.equal(new Set(c.catalog.map(d => d.id)).size, c.catalog.length);
  }
});
