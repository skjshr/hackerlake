# HackerLake

CTF と security study を、地図みたいに進めるための実験です。

問題をただ並べるだけだと、どこを分かっていて、どこで詰まっていて、次に何を見るべきかが見えにくい。HackerLake では、そのあたりを knowledge map として扱います。

今の repo は、最初の設計パッケージです。アプリ本体を盛る前に、画面、データ、API、認証、テストの形を先に置いています。

## 入っているもの

- `docs/design/*.xlsx`
  - 基本設計、詳細設計、画面設計、データ設計、API設計、認証設計、テスト設計
- `docs/uml/*.puml`
  - 図の元になる PlantUML file
- `tools/build-design-docs.ps1`
  - Excel workbook を作り直す script
- `tools/validate-design-docs.ps1`
  - 生成物を軽く見る script

## v1 で見る範囲

- guest access
- interactive knowledge map
- Web domain の learning node

認証まわりの設計もありますが、v1 の中心ではありません。設計練習として残しています。

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

今はまだ荒いです。まずは「学習を地図にする」という形を作っています。
