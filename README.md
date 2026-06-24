# HackerLake

HackerLake は、CTF や security study を「知識マップ」で進めるための学習プロダクトです。

今の repo には、最初の SIer っぽい設計パッケージが入っています。いきなり派手なアプリを作るより、画面、データ、API、認証、テストの形を先に固めるための版です。

## 入っているもの

- `docs/design/*.xlsx`
  - 基本設計、詳細設計、画面設計、データ設計、API設計、認証設計、テスト設計
- `docs/uml/*.puml`
  - 図の元になる PlantUML file
- `tools/build-design-docs.ps1`
  - Excel workbook を再生成する script
- `tools/validate-design-docs.ps1`
  - 生成物を軽く確認する script

## v1 の範囲

v1 はここまでです。

- guest access
- interactive knowledge map
- Web domain の深掘り learning node

認証は設計学習用に書いていますが、v1 実装の中心には置いていません。

## 設計 docs を作り直す

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-design-docs.ps1
```

確認します。

```powershell
powershell -ExecutionPolicy Bypass -File tools\validate-design-docs.ps1
```

## メモ

これは CTF の問題集そのものではありません。

「どの順番で学ぶか」「今どこにいるか」「次に何を見るか」を、地図っぽく扱うための実験です。まだ荒いですが、方向はそこです。
