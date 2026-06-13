$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$DesignDir = Join-Path $Root "docs\design"
$PdfDir = Join-Path $Root "docs\design\pdf"
$HtmlDir = Join-Path $Root "docs\design\html"
New-Item -ItemType Directory -Force -Path $PdfDir, $HtmlDir | Out-Null

Get-ChildItem -LiteralPath $PdfDir -File -Filter "*.pdf" | Remove-Item -Force
Get-ChildItem -LiteralPath $HtmlDir -Force | Remove-Item -Recurse -Force

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $files = Get-ChildItem -File -LiteralPath $DesignDir -Filter "*.xlsx" | Sort-Object Name
    foreach ($file in $files) {
        $wb = $excel.Workbooks.Open($file.FullName)
        try {
            $wb.Worksheets.Item(1).Activate() | Out-Null
            $base = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $pdfOut = Join-Path $PdfDir "$([System.IO.Path]::GetFileNameWithoutExtension($file.Name)).pdf"
            $wb.ExportAsFixedFormat(0, $pdfOut)
            $htmlOut = Join-Path $HtmlDir "$base.htm"
            $wb.SaveAs($htmlOut, 44)
        }
        finally {
            $wb.Close($false)
        }
    }
}
finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Rendered PDF previews to $PdfDir"
Write-Host "Rendered HTML previews to $HtmlDir"
