// 使い方: node scripts/validate.mjs [--sim]
//   問題バンクの形式・正誤と解説の対応・Kレベル・配点・本番配分を検証する。
//   --sim を付けると、長文模試の出題ロジックを実際に動かして配分と一巡までの回数を確認する。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './pages.mjs';
import { buildPage } from './build.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const EXAM = JSON.parse(read('config/exam-ctal-ta-v4.json'));
const L = 'abcde';
let errors = 0, warnings = 0;
const err = (ctx, m) => { errors++; console.log(`  ✗ ${ctx}: ${m}`); };
const warn = (ctx, m) => { warnings++; console.log(`  ! ${ctx}: ${m}`); };
const loOf = q => q.lo.replace(/^TA-/, '');
const chOf = q => +loOf(q)[0];
const text = s => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, '');

function parseBank(src, where) {
  try { return new Function(`return [${src}]`)(); }
  catch (e) { err(where, `構文エラー: ${e.message}`); return []; }
}

function checkQuestion(q, ctx, { shuffled, needId }) {
  if (needId && !q.id) err(ctx, 'id がない');
  if (!Array.isArray(q.opts) || q.opts.length < 3) err(ctx, '選択肢が3つ未満');
  if (!Array.isArray(q.why) || q.why.length !== q.opts.length) err(ctx, 'why の数が選択肢の数と違う');
  const need = q.pick || 1;
  if (!Array.isArray(q.ans) || q.ans.length !== need) err(ctx, `ans の数が ${need} でない`);
  if (q.ans.some(a => a < 0 || a >= q.opts.length)) err(ctx, 'ans が範囲外');
  (q.why || []).forEach((w, i) => {
    if (w.startsWith('正解') !== q.ans.includes(i)) err(ctx, `why[${i}] の「正解」表記と ans が一致しない`);
  });
  if (q.lo && q.k !== undefined) { // 差分ページのひっかけ問題はKレベルを持たない
    const k = EXAM.kByLo[loOf(q)];
    if (k === undefined) err(ctx, `未知のLO ${q.lo}`);
    else if (q.k !== k) err(ctx, `${q.lo} はK${k}（K${q.k}になっている）`);
    if (q.pts !== undefined && q.pts !== EXAM.pointsByK[q.k]) err(ctx, `K${q.k} の配点は ${EXAM.pointsByK[q.k]} 点`);
  }
  if (!q.exp) err(ctx, 'exp（解説）がない');
  const all = [q.stem, ...q.opts, q.exp, ...(q.why || [])].join('\n');
  if (/<script/i.test(all)) err(ctx, '<script> がそのまま含まれている（&lt;script&gt; にする）');
  if (shuffled && /選択肢[a-e]|[（(][a-e][）)]|^[a-e]は/m.test([q.exp, ...(q.why || [])].join('\n')))
    err(ctx, '選択肢がシャッフルされるのに解説が記号（a〜e）で参照している');
}

function checkExamDistribution(qs, ctx) {
  const n = qs.length, pts = qs.reduce((s, q) => s + q.pts, 0);
  if (n !== EXAM.questions) err(ctx, `問題数 ${n}（本番 ${EXAM.questions}）`);
  if (pts !== EXAM.points) err(ctx, `合計 ${pts} 点（本番 ${EXAM.points}）`);
  for (const [c, def] of Object.entries(EXAM.chapters)) {
    const xs = qs.filter(q => chOf(q) === +c);
    const p = xs.reduce((s, q) => s + q.pts, 0);
    if (xs.length !== def.questions || p !== def.points) err(ctx, `第${c}章 ${xs.length}問/${p}点（本番 ${def.questions}問/${def.points}点）`);
  }
  for (const [k, cnt] of Object.entries(EXAM.questionsByK)) {
    const x = qs.filter(q => q.k === +k).length;
    if (x !== cnt) err(ctx, `K${k} が ${x} 問（本番 ${cnt}）`);
  }
  for (const [g, def] of Object.entries(EXAM.loGroups)) {
    const x = qs.filter(q => def.los.includes(loOf(q))).length;
    if (x !== def.questions) err(ctx, `LO ${g} が ${x} 問（本番 ${def.questions}）`);
  }
}

const allStems = [];
for (const page of PAGES) {
  console.log(`\n■ ${page.title}（${page.out}）`);
  let qs = [];
  if (page.kind === 'static') {
    const html = read(page.template);
    const m = html.match(/const QZ = \[([\s\S]*?)\n\];/);
    if (!m) { console.log('  （問題データなし）'); continue; }
    qs = parseBank(m[1], page.out);
    qs.forEach((q, i) => {
      checkQuestion(q, `問${i + 1}`, { shuffled: false, needId: false });
      if ((q.v3 || []).some(v => q.ans.includes(v))) err(`問${i + 1}`, 'v3の考え方の選択肢が正解になっている');
    });
  } else {
    const shuffled = page.kind === 'drill' || page.kind === 'long';
    for (const b of page.banks) {
      const part = parseBank(read(b), b);
      part.forEach((q, i) => checkQuestion(q, `${b} ${q.id || '#' + (i + 1)}`, { shuffled, needId: shuffled }));
      qs.push(...part);
    }
    if (shuffled) {
      const seen = new Set();
      qs.forEach(q => { if (seen.has(q.id)) err(q.id, 'id が重複'); seen.add(q.id); });
    }
    if (page.kind === 'drill') qs.forEach(q => { if (!loOf(q).startsWith(q.unit + '.')) err(q.id, `unit ${q.unit} と ${q.lo} が合わない`); });
    if (page.kind === 'mock' || page.kind === 'long') checkExamDistribution(qs, page.out);
    if (page.kind === 'mock') {
      const pos = {}; qs.forEach(q => q.ans.forEach(a => pos[L[a]] = (pos[L[a]] || 0) + 1));
      const tot = Object.values(pos).reduce((a, b) => a + b, 0);
      const max = Math.max(...Object.values(pos));
      console.log(`  正解の位置: ${Object.entries(pos).sort().map(([k, v]) => `${k}=${v}`).join(' ')}`);
      if (max / tot > 0.35) warn(page.out, '正解の位置が偏っている（選択肢は固定表示なので並べ替える）');
    }
  }
  qs.forEach(q => allStems.push({ where: `${page.out} ${q.id || q.lo || ''}`, key: text(q.stem) }));
  const byCh = [1, 2, 3, 4, 5].map(c => qs.filter(q => q.lo && chOf(q) === c).length);
  console.log(`  ${qs.length}問　章別 ${byCh.join('・')}　K2/K3/K4 ${[2, 3, 4].map(k => qs.filter(q => q.k === k).length).join('/')}`);
}

// 問題文全体が同じ問題の検出（同じモデルを使う別の問いは対象外。場面や数値の類似は目視で確認する）
const dup = {};
allStems.forEach(s => (dup[s.key] = dup[s.key] || []).push(s.where));
Object.values(dup).filter(v => v.length > 1).forEach(v => warn('重複の疑い', v.join(' ／ ')));

if (process.argv.includes('--sim')) {
  console.log('\n■ 長文模試の出題シミュレーション');
  const html = buildPage(PAGES.find(p => p.kind === 'long'));
  const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const store = {}, mk = () => ({ innerHTML: '', hidden: false, textContent: '', classList: { toggle() {} }, parentElement: { classList: { toggle() {} } }, querySelectorAll: () => [], addEventListener() {}, scrollIntoView() {} });
  const els = {};
  globalThis.document = { querySelector: s => els[s] || (els[s] = mk()), addEventListener() {} };
  globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: k => delete store[k] };
  globalThis.window = { scrollTo() {} };
  globalThis.setInterval = () => 0; globalThis.clearInterval = () => {}; // タイマーを止めないとnodeが終了しない
  const T = new Function(js + ';return {Q,PLAN,build,canBuild,begin,finish,get S(){return S},H:()=>H};')();
  for (const n of Object.keys(T.PLAN).map(Number)) {
    if (!T.canBuild(n)) { console.log(`  ${n}問: 収録不足で選択不可`); continue; }
    const seen = {};
    for (let r = 0; r < 500; r++) {
      const b = T.build(n);
      const key = [1, 2, 3, 4, 5].map(c => b.filter(i => T.Q[i].ch === c).length).join('・') + ` K4=${b.filter(i => T.Q[i].k === 4).length}` + (new Set(b).size === n ? '' : ' 重複あり');
      seen[key] = (seen[key] || 0) + 1;
    }
    let tot = 0;
    for (let r = 0; r < 200; r++) {
      for (const k in store) delete store[k];
      T.H().n = 0; T.H().q = {};
      let s = 0;
      while (T.Q.some(q => !T.H().q[q.id]) && s < 50) {
        const b = T.build(n); T.begin('exam', 40, b);
        b.forEach(i => (T.S.ans[i] = Math.random() < 0.7 ? T.Q[i].ans.slice() : [(T.Q[i].ans[0] + 1) % T.Q[i].opts.length]));
        T.finish(); s++;
      }
      tot += s;
    }
    console.log(`  ${n}問: 構成 ${JSON.stringify(seen)}　全問が一巡するまで平均 ${(tot / 200).toFixed(1)} 回`);
  }
}

console.log(`\n結果: エラー ${errors} 件、警告 ${warnings} 件`);
if (errors) process.exitCode = 1;
