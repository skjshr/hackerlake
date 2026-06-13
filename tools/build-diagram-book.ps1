$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$DesignDir = Join-Path $Root "docs\design"
$RenderedDir = Join-Path $Root "docs\uml\rendered"
$OutPath = Join-Path $DesignDir "08_図面集_HackerLake.xlsx"

function Color-Rgb {
    param([int]$Red, [int]$Green, [int]$Blue)
    return $Red + ($Green * 256) + ($Blue * 65536)
}

$diagrams = @(
    [pscustomobject]@{ Id="DIA-001"; Sheet="構成図"; Name="システム構成図"; File="system_architecture.png"; Source="system_architecture.puml"; Purpose="v1のブラウザ内構成と将来Backend境界を示す" },
    [pscustomobject]@{ Id="DIA-002"; Sheet="データフロー図"; Name="データフロー図"; File="data_flow.png"; Source="data_flow.puml"; Purpose="カテゴリ選択からノード詳細・履歴更新までのデータ流れを示す" },
    [pscustomobject]@{ Id="DIA-003"; Sheet="状態遷移図"; Name="状態遷移図"; File="state.png"; Source="state.puml"; Purpose="アプリ内部状態の遷移を示す" },
    [pscustomobject]@{ Id="DIA-004"; Sheet="画面遷移図"; Name="画面遷移図"; File="screen_transition.png"; Source="screen_transition.puml"; Purpose="画面単位の遷移と将来画面を示す" },
    [pscustomobject]@{ Id="DIA-005"; Sheet="ER図"; Name="ER図"; File="er.png"; Source="er.puml"; Purpose="将来DB化時の主要エンティティ関係を示す" },
    [pscustomobject]@{ Id="DIA-006"; Sheet="コンポーネント図"; Name="コンポーネント図"; File="component.png"; Source="component.puml"; Purpose="Reactコンポーネントと静的データの依存関係を示す" },
    [pscustomobject]@{ Id="DIA-007"; Sheet="クラス図"; Name="クラス図"; File="class.png"; Source="class.puml"; Purpose="主要データ型の構造と関係を示す" },
    [pscustomobject]@{ Id="DIA-008"; Sheet="シーケンス図"; Name="ノード選択シーケンス"; File="sequence_node_select.png"; Source="sequence_node_select.puml"; Purpose="ノード選択時の処理順序を示す" },
    [pscustomobject]@{ Id="DIA-009"; Sheet="ユースケース図"; Name="ユースケース図"; File="usecase.png"; Source="usecase.puml"; Purpose="v1とFutureの利用者別ユースケースを示す" },
    [pscustomobject]@{ Id="DIA-010"; Sheet="学習フロー図"; Name="学習アクティビティ図"; File="activity_learning_flow.png"; Source="activity_learning_flow.puml"; Purpose="学習者がマップを辿る流れを示す" },
    [pscustomobject]@{ Id="DIA-011"; Sheet="認証状態図"; Name="将来認証状態遷移"; File="auth_future_state.png"; Source="auth_future_state.puml"; Purpose="将来認証導入時の状態遷移を示す" }
)

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    if (Test-Path -LiteralPath $OutPath) { Remove-Item -LiteralPath $OutPath -Force }
    $wb = $excel.Workbooks.Add()
    while ($wb.Worksheets.Count -lt ($diagrams.Count + 2)) {
        $wb.Worksheets.Add([System.Type]::Missing, $wb.Worksheets.Item($wb.Worksheets.Count)) | Out-Null
    }
    while ($wb.Worksheets.Count -gt ($diagrams.Count + 2)) {
        $wb.Worksheets.Item($wb.Worksheets.Count).Delete()
    }

    $cover = $wb.Worksheets.Item(1)
    $cover.Name = "表紙"
    $cover.Range("A1:H1").Merge() | Out-Null
    $cover.Cells.Item(1,1).Value2 = "08 図面集 - 表紙"
    $cover.Range("A1:H1").Font.Bold = $true
    $cover.Range("A1:H1").Font.Size = 16
    $cover.Range("A1:H1").Font.Color = (Color-Rgb 255 255 255)
    $cover.Range("A1:H1").Interior.Color = (Color-Rgb 16 46 79)
    $cover.Range("A3:H5").Value2 = @(
        @("文書名","HackerLake 図面集","対象","構成図/DFD/UML/ER","管理","PlantUML正本","形式","xlsx"),
        @("作成日",(Get-Date -Format "yyyy-MM-dd"),"作成者","ChatGPT","正本","docs/uml/*.puml","出力","docs/uml/rendered/*.png"),
        @("方針","PlantUMLを差分管理し、Excel図面集に貼付","備考","draw.ioで清書可能","スコープ","v1 + Future","状態","初版")
    )

    $list = $wb.Worksheets.Item(2)
    $list.Name = "図一覧"
    $list.Range("A1:H1").Merge() | Out-Null
    $list.Cells.Item(1,1).Value2 = "図一覧"
    $list.Range("A1:H1").Font.Bold = $true
    $list.Range("A1:H1").Font.Size = 16
    $list.Range("A1:H1").Font.Color = (Color-Rgb 255 255 255)
    $list.Range("A1:H1").Interior.Color = (Color-Rgb 16 46 79)
    $headers = @("図ID","図名","シート","PlantUML正本","PNG","目的","関連設計書","備考")
    for ($i=0; $i -lt $headers.Count; $i++) {
        $cell = $list.Cells.Item(3, $i + 1)
        $cell.Value2 = $headers[$i]
        $cell.Font.Bold = $true
        $cell.Font.Color = (Color-Rgb 255 255 255)
        $cell.Interior.Color = (Color-Rgb 0 96 128)
    }
    $r = 4
    foreach ($d in $diagrams) {
        $list.Cells.Item($r,1).Value2 = $d.Id
        $list.Cells.Item($r,2).Value2 = $d.Name
        $list.Cells.Item($r,3).Value2 = $d.Sheet
        $list.Cells.Item($r,4).Value2 = $d.Source
        $list.Cells.Item($r,5).Value2 = $d.File
        $list.Cells.Item($r,6).Value2 = $d.Purpose
        $list.Cells.Item($r,7).Value2 = "01-07設計書"
        $list.Cells.Item($r,8).Value2 = "PlantUMLから生成"
        if (($r % 2) -eq 0) {
            $list.Range($list.Cells.Item($r,1),$list.Cells.Item($r,8)).Interior.Color = (Color-Rgb 247 250 252)
        }
        $r++
    }
    $list.UsedRange.WrapText = $true
    $list.UsedRange.Borders.LineStyle = 1
    $list.UsedRange.Borders.Color = (Color-Rgb 217 217 217)
    $list.Columns.Item("A:H").ColumnWidth = 20
    $list.Columns.Item("F:F").ColumnWidth = 52
    $list.Rows.AutoFit()

    for ($i=0; $i -lt $diagrams.Count; $i++) {
        $d = $diagrams[$i]
        $ws = $wb.Worksheets.Item($i + 3)
        $ws.Name = $d.Sheet
        $ws.Range("A1:H1").Merge() | Out-Null
        $ws.Cells.Item(1,1).Value2 = "$($d.Id) $($d.Name)"
        $ws.Range("A1:H1").Font.Bold = $true
        $ws.Range("A1:H1").Font.Size = 16
        $ws.Range("A1:H1").Font.Color = (Color-Rgb 255 255 255)
        $ws.Range("A1:H1").Interior.Color = (Color-Rgb 16 46 79)
        $ws.Range("A3:B6").Value2 = @(
            @("目的", $d.Purpose),
            @("PlantUML", $d.Source),
            @("PNG", $d.File),
            @("備考", "正本はdocs/uml配下。必要に応じてdraw.ioで清書する。")
        )
        $ws.Range("A3:B6").WrapText = $true
        $ws.Range("A3:B6").Borders.LineStyle = 1
        $ws.Range("A3:A6").Interior.Color = (Color-Rgb 0 96 128)
        $ws.Range("A3:A6").Font.Color = (Color-Rgb 255 255 255)
        $ws.Range("A3:A6").Font.Bold = $true
        $ws.Columns.Item("A:A").ColumnWidth = 16
        $ws.Columns.Item("B:B").ColumnWidth = 90
        $imgPath = Join-Path $RenderedDir $d.File
        if (!(Test-Path -LiteralPath $imgPath)) {
            throw "Missing rendered diagram: $imgPath"
        }
        $shape = $ws.Shapes.AddPicture($imgPath, $false, $true, 20, 135, -1, -1)
        if ($shape.Width -gt 980) {
            $scale = 980 / $shape.Width
            $shape.Width = 980
            $shape.Height = $shape.Height * $scale
        }
        if ($shape.Height -gt 620) {
            $scale = 620 / $shape.Height
            $shape.Height = 620
            $shape.Width = $shape.Width * $scale
        }
        $ws.PageSetup.Orientation = 2
        $ws.PageSetup.Zoom = $false
        $ws.PageSetup.FitToPagesWide = 1
        $ws.PageSetup.FitToPagesTall = 1
        $ws.PageSetup.LeftMargin = $ws.Application.InchesToPoints(0.3)
        $ws.PageSetup.RightMargin = $ws.Application.InchesToPoints(0.3)
        $ws.PageSetup.TopMargin = $ws.Application.InchesToPoints(0.45)
        $ws.PageSetup.BottomMargin = $ws.Application.InchesToPoints(0.45)
    }

    foreach ($ws in $wb.Worksheets) {
        $ws.Activate() | Out-Null
        $excel.ActiveWindow.DisplayGridlines = $false
    }
    $wb.Worksheets.Item(1).Activate() | Out-Null
    $wb.SaveAs($OutPath, 51)
    $wb.Close($false)
}
finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Generated diagram book: $OutPath"

