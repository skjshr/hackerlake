$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$DesignDir = Join-Path $Root "docs\design"
$UmlDir = Join-Path $Root "docs\uml"
$PdfDir = Join-Path $Root "docs\design\pdf"
$HtmlDir = Join-Path $Root "docs\design\html"

$expectedWorkbooks = @(
    "01_基本設計書_HackerLake.xlsx",
    "02_画面設計書_HackerLake.xlsx",
    "03_詳細設計書_HackerLake.xlsx",
    "04_データ設計書_HackerLake.xlsx",
    "05_API設計書_HackerLake.xlsx",
    "06_認証認可設計書_HackerLake.xlsx",
    "07_テスト設計書_HackerLake.xlsx",
    "08_図面集_HackerLake.xlsx"
)

$expectedUml = @(
    "usecase.puml",
    "state.puml",
    "component.puml",
    "class.puml",
    "sequence_node_select.puml",
    "activity_learning_flow.puml",
    "auth_future_state.puml",
    "system_architecture.puml",
    "data_flow.puml",
    "er.puml",
    "screen_transition.puml"
)

$missing = @()
foreach ($file in $expectedWorkbooks) {
    $path = Join-Path $DesignDir $file
    if (!(Test-Path -LiteralPath $path)) {
        $missing += $path
    } elseif ((Get-Item -LiteralPath $path).Length -lt 5000) {
        throw "Workbook appears too small: $path"
    }
}
foreach ($file in $expectedWorkbooks) {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($file)
    $pdf = Join-Path $PdfDir "$base.pdf"
    $html = Join-Path $HtmlDir "$base.htm"
    if (Test-Path -LiteralPath $pdf) {
        if ((Get-Item -LiteralPath $pdf).Length -lt 10000) {
            throw "PDF preview appears too small: $pdf"
        }
    }
    if (Test-Path -LiteralPath $html) {
        if ((Get-Item -LiteralPath $html).Length -lt 5000) {
            throw "HTML preview appears too small: $html"
        }
    }
}
foreach ($file in $expectedUml) {
    $path = Join-Path $UmlDir $file
    if (!(Test-Path -LiteralPath $path)) {
        $missing += $path
    } else {
        $text = Get-Content -LiteralPath $path -Raw
        if ($text -notmatch "@startuml" -or $text -notmatch "@enduml") {
            throw "Invalid PlantUML boundary: $path"
        }
    }
}
if ($missing.Count -gt 0) {
    throw "Missing expected artifacts:`n$($missing -join "`n")"
}

Write-Host "Design artifacts validated: $($expectedWorkbooks.Count) workbooks, $($expectedUml.Count) UML sources."
