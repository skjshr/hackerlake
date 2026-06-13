# HackerLake Design Package

This directory contains the SIer-style design package for HackerLake.

## Workbooks

- `01_基本設計書_HackerLake.xlsx`
- `02_画面設計書_HackerLake.xlsx`
- `03_詳細設計書_HackerLake.xlsx`
- `04_データ設計書_HackerLake.xlsx`
- `05_API設計書_HackerLake.xlsx`
- `06_認証認可設計書_HackerLake.xlsx`
- `07_テスト設計書_HackerLake.xlsx`

## Regeneration

Run from the repository root:

```powershell
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\tools\build-design-docs.ps1
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\tools\validate-design-docs.ps1
```

Use `pwsh` instead of Windows PowerShell 5.x because the workbook generator contains Japanese text and is encoded as UTF-8.

## UML

PlantUML source files live in `docs/uml/*.puml`.
Rendered PNG files live in `docs/uml/rendered/*.png`.

The current UML strategy is:

- PlantUML is the source of truth because it is text-based and Git-friendly.
- draw.io can be used later for manual layout polishing or stakeholder-facing diagrams.
