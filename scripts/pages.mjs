// 公開ページの定義。build.mjs と validate.mjs が共有する。
// kind: mock = 本番形式45問（選択肢固定）、drill = 章別ドリル、long = 長文模試、static = 単体ページ
export const PAGES = [
  {
    out: 'alta-v4-mock.html', kind: 'mock', template: 'templates/mock-shell.html',
    banks: ['banks/mock-1.js'],
    vars: { __KEY__: 'alta-v4-mock-1', __ROUND__: '第1回', __SUFFIX__: '' },
    url: 'https://claude.ai/artifact/8vdLLmmqonvHHRGeiwDrpE', title: '模擬試験 第1回',
  },
  {
    out: 'alta-v4-mock-2.html', kind: 'mock', template: 'templates/mock-shell.html',
    banks: ['banks/mock-2.js'],
    vars: { __KEY__: 'alta-v4-mock-2', __ROUND__: '第2回', __SUFFIX__: ' 第2回' },
    url: 'https://claude.ai/artifact/49JXxaxBkyyHBwUReZUsrY', title: '模擬試験 第2回',
  },
  {
    out: 'alta-v4-drill.html', kind: 'drill', template: 'templates/drill-shell.html',
    banks: ['banks/drill-ch1-2.js', 'banks/drill-ch3.js', 'banks/drill-ch4-5.js'],
    url: 'https://claude.ai/artifact/4J5iQR3H98KQ56yTRZftYc', title: '章別ドリル',
  },
  {
    out: 'alta-v4-long.html', kind: 'long', template: 'templates/long-shell.html',
    banks: ['banks/long-b1.js', 'banks/long-b2.js', 'banks/long-b3.js'],
    url: 'https://claude.ai/artifact/CMvtEmbK4z1WzEcFCSeKbc', title: '長文模試',
  },
  {
    out: 'alta-v3-v4-diff.html', kind: 'static', template: 'pages/alta-v3-v4-diff.html',
    url: 'https://claude.ai/artifact/1wLWnD43TSSLBKuX3mVopz', title: 'v3→v4 差分',
  },
  {
    out: 'index.html', kind: 'static', template: 'pages/index.html', siteOnly: true,
    title: 'トップページ（GitHub Pages 用）',
  },
];
