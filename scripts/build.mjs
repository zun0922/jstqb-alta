// 使い方: node scripts/build.mjs [--check] [--site]
//   テンプレートの /*__BANK__*/ に問題バンクを差し込み、dist/ に公開用HTMLを出力する（claude.ai の Artifact 用）。
//   --check を付けると、.published-snapshot/ の公開済みファイルとバイト単位で比較する。
//   --site を付けると、GitHub Pages 用に docs/ へも出力する（doctype・文字コード・viewport を補い、トップページを含める）。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './pages.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const check = process.argv.includes('--check');
const site = process.argv.includes('--site');

export function buildPage(page) {
  let html = read(page.template);
  if (page.banks) {
    const bank = page.banks.map(read).join('\n');
    // mock-*.js は末尾に改行を1つ付けて保存しているので、差し込む前に取り除く
    const body = page.kind === 'mock' ? bank.replace(/\n$/, '') : bank;
    if (!html.includes('/*__BANK__*/')) throw new Error(`${page.template} に /*__BANK__*/ がない`);
    html = html.replace('/*__BANK__*/', () => body);
  }
  for (const [k, v] of Object.entries(page.vars || {})) html = html.split(k).join(v);
  return html;
}

// Artifact は公開時に文書の骨組みを補うが、GitHub Pages では自分で付ける必要がある
const SITE_HEAD = '<!doctype html>\n<html lang="ja">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(join(ROOT, 'dist'), { recursive: true });
  if (site) mkdirSync(join(ROOT, 'docs'), { recursive: true });
  let bad = 0;
  for (const page of PAGES) {
    const html = buildPage(page);
    new Function(html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''); // 構文チェック
    if (site) writeFileSync(join(ROOT, 'docs', page.out), SITE_HEAD + html.replace(/<meta name="claude:[^>]*>\n?/g, ''));
    if (page.siteOnly) continue;
    writeFileSync(join(ROOT, 'dist', page.out), html);
    let note = '';
    if (check) {
      const snap = join(ROOT, '.published-snapshot', page.out);
      const same = existsSync(snap) && readFileSync(snap, 'utf8') === html;
      note = same ? '  公開済みと一致' : '  公開済みと差分あり';
      if (!same) bad++;
    }
    console.log(`dist/${page.out}  ${(html.length / 1024).toFixed(0)}KB${note}`);
  }
  if (site) console.log(`docs/ に ${PAGES.length} ページを出力`);
  if (bad) process.exitCode = 1;
}
