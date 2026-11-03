# JSTQB AL-TA v4.0 練習問題

JSTQB Advanced Level テストアナリスト（CTAL-TA）シラバス v4.0 の試験対策用に作った、非公式の練習問題です。本番の試験構成（45問・78点・合格51点・120分）に合わせています。

**公開ページ：https://zun0922.github.io/jstqb-alta/**

| ページ | 内容 |
|---|---|
| v3→v4 差分 | シラバスv3.1.1とv4.0の比較表、v3の知識で間違えやすいひっかけ問題10問 |
| 章別ドリル | 111問。単元ごとに5〜10問、前回間違えた問題と未出題の問題を優先して出題 |
| 長文模試 | 長文問題45問から、本番の章別比率で15問（40分）または20問（53分）を出題 |
| 模擬試験 第1回・第2回 | 本番形式の45問・120分（学習モードあり） |

解答状況と学習履歴は、閲覧したブラウザーの localStorage にだけ保存されます。

> この問題集は個人が作成した非公式のものであり、JSTQB および ISTQB® とは関係ありません。実際の試験問題ではありません。ISTQB® は International Software Testing Qualifications Board の登録商標です。

## フォルダー構成

```
banks/        問題データ（配列の中身だけを持つJS）
  mock-1.js, mock-2.js                           模擬試験 第1回・第2回（各45問）
  drill-ch1-2.js, drill-ch3.js, drill-ch4-5.js   章別ドリル
  long-b1.js, long-b2.js, long-b3.js             長文模試（各15問）
templates/    ページのひな形（/*__BANK__*/ に問題データを差し込む）
pages/        単体のページ（差分ページ、トップページ）
config/       試験構成（exam-ctal-ta-v4.json：章別の配分、配点、LOとKレベル）
scripts/      build.mjs（組み立て）、validate.mjs（検証）、pages.mjs（ページ定義）
docs/         組み立て済みの公開ページ（GitHub Pages はこのフォルダーを公開する）
```

## 組み立てと検証

Node.js 20 以上で動きます。依存パッケージはありません。問題を変更したら、検証してから docs/ を組み立て直してコミットします。

```
node scripts/validate.mjs --sim   # 問題データと本番配分を検証し、長文模試の出題を試す
node scripts/build.mjs --site     # docs/ に GitHub Pages 用のページを出力
```

検証する内容：選択肢と解説の数・正解の対応、LOごとのKレベルと配点、模擬試験と長文模試が本番の配分（章別・Kレベル別・LO別）と一致すること、選択肢をシャッフルするページで解説が記号（a〜e）を参照していないこと、問題文の重複。

## 参照資料

シラバスと試験構成表は JSTQB / ISTQB の著作物なので、このリポジトリには含めていません。作成者の手元では `sources/` に置いています。

- JSTQB シラバス：https://jstqb.jp/syllabus.html
- ISTQB Exam Structures & Rules：https://www.istqb.org/

## 変更履歴

- 2026-11-03：章別ドリルの D1-11 が模擬試験 第1回の TA-1.3.1 と重複していたため、D1-22 に差し替えた。
- 2026-11-03：GitHub で公開。
