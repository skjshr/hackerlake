$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
$DesignDir = Join-Path $Root "docs\design"
$UmlDir = Join-Path $Root "docs\uml"
$AssetDir = Join-Path $Root "docs\assets"
New-Item -ItemType Directory -Force -Path $DesignDir, $UmlDir, $AssetDir | Out-Null

$ProjectName = "HackerLake"
$Author = "ChatGPT"
$CreatedAt = Get-Date -Format "yyyy-MM-dd"

function New-Rows {
    param([object[]]$Rows)
    return ,$Rows
}

function SheetSpec {
    param(
        [string]$Name,
        [string]$Title,
        [string[]]$Headers,
        [object[]]$Rows
    )
    return [pscustomobject]@{
        Name = $Name
        Title = $Title
        Headers = $Headers
        Rows = $Rows
    }
}

function Write-Sheet {
    param(
        [object]$Sheet,
        [object]$Spec
    )

    $Sheet.Name = $Spec.Name
    $Sheet.Cells.Item(1, 1).Value2 = $Spec.Title
    $titleRange = $Sheet.Range("A1:H1")
    $titleRange.Merge() | Out-Null
    $titleRange.Font.Bold = $true
    $titleRange.Font.Size = 16
    $titleRange.Font.Color = 0xFFFFFF
    $titleRange.Interior.Color = 0x4F2E10
    $titleRange.RowHeight = 28

    for ($i = 0; $i -lt $Spec.Headers.Count; $i++) {
        $cell = $Sheet.Cells.Item(3, $i + 1)
        $cell.Value2 = $Spec.Headers[$i]
        $cell.Font.Bold = $true
        $cell.Font.Color = 0xFFFFFF
        $cell.Interior.Color = 0x806000
        $cell.WrapText = $true
    }

    $rowIndex = 4
    foreach ($row in $Spec.Rows) {
        for ($i = 0; $i -lt $Spec.Headers.Count; $i++) {
            $value = ""
            if ($i -lt $row.Count) { $value = [string]$row[$i] }
            $Sheet.Cells.Item($rowIndex, $i + 1).Value2 = $value
            $Sheet.Cells.Item($rowIndex, $i + 1).WrapText = $true
            $Sheet.Cells.Item($rowIndex, $i + 1).VerticalAlignment = -4160
        }
        $rowIndex++
    }

    $lastRow = [Math]::Max(4, $rowIndex - 1)
    $lastCol = [Math]::Max(1, $Spec.Headers.Count)
    $used = $Sheet.Range($Sheet.Cells.Item(3, 1), $Sheet.Cells.Item($lastRow, $lastCol))
    $used.Borders.LineStyle = 1
    $used.Borders.Color = 0xD9D9D9
    $Sheet.Rows.Item("3:$lastRow").RowHeight = 42
    $Sheet.Columns.Item("A:A").ColumnWidth = 16
    $Sheet.Columns.Item("B:B").ColumnWidth = 24
    $Sheet.Columns.Item("C:C").ColumnWidth = 34
    $Sheet.Columns.Item("D:D").ColumnWidth = 42
    $Sheet.Columns.Item("E:E").ColumnWidth = 42
    $Sheet.Columns.Item("F:F").ColumnWidth = 28
    $Sheet.Columns.Item("G:G").ColumnWidth = 28
    $Sheet.Columns.Item("H:H").ColumnWidth = 28
    $Sheet.Application.ActiveWindow.DisplayGridlines = $false
}

function Save-Workbook {
    param(
        [string]$FileName,
        [object[]]$Specs
    )

    $path = Join-Path $DesignDir $FileName
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force }
    $wb = $script:Excel.Workbooks.Add()
    while ($wb.Worksheets.Count -lt $Specs.Count) {
        $wb.Worksheets.Add([System.Type]::Missing, $wb.Worksheets.Item($wb.Worksheets.Count)) | Out-Null
    }
    while ($wb.Worksheets.Count -gt $Specs.Count) {
        $wb.Worksheets.Item($wb.Worksheets.Count).Delete()
    }
    for ($i = 0; $i -lt $Specs.Count; $i++) {
        Write-Sheet -Sheet $wb.Worksheets.Item($i + 1) -Spec $Specs[$i]
    }
    $wb.SaveAs($path, 51)
    $wb.Close($false)
    return $path
}

$commonCoverRows = @(
    @("文書名", "HackerLake 設計書", "CTF/ハッキング学習向けグラフィカル知識マップ", "v1はゲスト利用・静的教材・Web深掘りを対象", "", "", "", ""),
    @("作成日", $CreatedAt, "作成者", $Author, "管理単位", "Git管理", "対象", "設計フェーズ"),
    @("前提", "実攻撃環境なし", "方針", "安全な教育コンテンツのみ", "主成果物", "xlsx分冊 + PlantUML", "実装", "後続")
)

$revisionRows = @(
    @("1.0", $CreatedAt, "初版", "要件整理、基本設計、詳細設計、UML正本を作成", $Author, "承認待ち", "", ""),
    @("1.1", "未定", "レビュー反映", "画面モック、教材粒度、認証方針のレビュー後に改訂", "未定", "予定", "", "")
)

$requirementsRows = @(
    @("REQ-001", "学習課題", "初心者がオープンな状態から何を見ればよいかわからない問題を解く", "対象を選ぶと観察候補がノードとして展開される", "Must", "FN-001", "TS-001", "v1"),
    @("REQ-002", "学習課題", "手順書をなぞるだけでなく、選択肢の意図を学べる", "各ノードに意図・見るもの・次の分岐を必須表示", "Must", "FN-003", "TS-002", "v1"),
    @("REQ-003", "UI", "飽きないスタイリッシュなグラフィックとアニメーション", "ズーム、フォーカス、関連強調、履歴タイムラインを実装設計", "Must", "UI-004", "TS-010", "v1"),
    @("REQ-004", "安全性", "実ハッキング環境なしで知識を学ぶ", "実在標的、危険コマンド、攻撃実行手順を教材本文から排除", "Must", "NF-SEC-001", "TS-030", "v1"),
    @("REQ-005", "範囲", "全カテゴリを見たい", "Web/Network/Forensics/Crypto/Reverse/Pwnの入口を用意", "Should", "FN-002", "TS-004", "v1"),
    @("REQ-006", "深さ", "まずWebを深掘りしたい", "Webサーバ周辺は3階層以上のノードを定義", "Must", "FN-004", "TS-005", "v1"),
    @("REQ-007", "認証", "設計学習として認証も知りたいが過剰にはしたくない", "v1未実装、将来拡張として認証認可設計を分冊化", "Should", "AUTH-000", "TS-040", "Future")
)

$functionRows = @(
    @("FN-001", "知識マップ閲覧", "カテゴリとノードをグラフ表示する", "初期表示で全カテゴリ入口が見える", "StaticNodeRepository", "未選択/カテゴリ選択/ノード選択", "REQ-001", "Must"),
    @("FN-002", "カテゴリ選択", "対象カテゴリを選ぶと該当領域にズームする", "Web, Network, Forensics, Crypto, Reverse, Pwn", "KnowledgeMap", "CategoryFocused", "REQ-005", "Must"),
    @("FN-003", "ノード詳細表示", "意図・観察点・シグナル・次ノード・技術詳細を表示", "ノード選択時に右ペイン更新", "NodeDetailPanel", "NodeFocused", "REQ-002", "Must"),
    @("FN-004", "Web深掘り", "Webサーバ配下の観察選択肢を展開する", "URL, HTTP, Header, Cookie, Resource, Auth, Input, Error", "KnowledgeMap", "NodeFocused", "REQ-006", "Must"),
    @("FN-005", "選択履歴", "辿ったノードを時系列に表示し戻れる", "下部タイムラインに記録", "LearningHistory", "HistoryReview", "REQ-002", "Should"),
    @("FN-006", "安全文言チェック", "教材文言から危険な実行手順を排除する", "リリース前テスト観点として検査", "SafetyCopyGuard", "N/A", "REQ-004", "Must")
)

$nonFunctionalRows = @(
    @("NF-UX-001", "操作感", "ノード選択から詳細表示まで300ms以内の体感応答", "静的データ、クライアント内状態で処理", "Performance", "TS-020", "Must", "v1"),
    @("NF-UX-002", "アニメーション", "刺激はあるが読解を邪魔しない", "ズーム600ms以下、詳細ペイン200ms以下、関連発光は1.2s以下", "Usability", "TS-010", "Must", "v1"),
    @("NF-A11Y-001", "アクセシビリティ", "キーボード操作とprefers-reduced-motionに対応", "ノード選択・戻る・リセットにフォーカス管理", "Accessibility", "TS-023", "Should", "v1"),
    @("NF-SEC-001", "安全性", "実攻撃に直結する危険手順を出さない", "教育用抽象化、CTF文脈、実在標的なし", "Security", "TS-030", "Must", "v1"),
    @("NF-MAINT-001", "保守性", "教材データをコードから分離しやすい構造", "LearningNode/KnowledgeEdgeの静的定義から開始", "Maintainability", "TS-024", "Should", "v1")
)

$screenRows = @(
    @("SCR-001", "メインマップ画面", "学習者", "カテゴリ選択、ノード選択、詳細閲覧、履歴確認", "初期表示", "AppLoading -> MapReady", "Must", "v1"),
    @("SCR-002", "ノード詳細ペイン", "学習者", "意図、観察点、次の分岐、技術詳細を読む", "ノード選択", "NodeFocused", "Must", "v1"),
    @("SCR-003", "学習履歴タイムライン", "学習者", "辿ったノードを戻る/比較する", "ノード選択後", "HistoryReview", "Should", "v1"),
    @("SCR-004", "将来ログイン画面", "学習者", "ログインする", "未実装", "Guest/AuthFuture", "Could", "Future"),
    @("SCR-005", "教材編集画面", "教材編集者", "ノード・エッジを編集する", "未実装", "EditorFuture", "Could", "Future")
)

$layoutRows = @(
    @("LY-001", "ヘッダー", "ブランド名HackerLake、最小ナビ、リセット/検索導線", "高さ56px想定、常時表示", "SCR-001", "全幅", "Must", ""),
    @("LY-002", "左レール", "カテゴリ一覧と現在位置", "デスクトップ240px、モバイルはタブ化", "SCR-001", "左", "Must", ""),
    @("LY-003", "中央マップ", "ズーム/パン可能なノードグラフ", "主表示領域、React Flow想定", "SCR-001", "中央", "Must", ""),
    @("LY-004", "右詳細ペイン", "ノード本文・判断基準・関連技術", "デスクトップ360px、モバイル下部", "SCR-002", "右", "Must", ""),
    @("LY-005", "下部履歴", "選択履歴、戻る、比較", "高さ96px想定、折りたたみ可", "SCR-003", "下", "Should", "")
)

$animationRows = @(
    @("ANM-001", "カテゴリズーム", "カテゴリ選択", "対象カテゴリ周辺へカメラ移動", "450-600ms", "easeOutCubic", "prefers-reduced-motion時は即時", "REQ-003"),
    @("ANM-002", "ノード展開", "親ノード選択", "子ノードをスケール/フェードで表示", "180-260ms", "easeOutBack弱め", "過剰な跳ね返り禁止", "REQ-003"),
    @("ANM-003", "関連強調", "ノード選択", "関連エッジと次候補をアンバー/グリーンで発光", "800-1200ms", "easeInOut", "点滅は禁止", "REQ-003"),
    @("ANM-004", "詳細ペイン切替", "ノード詳細更新", "旧内容を薄く退場、新内容をスライドイン", "160-220ms", "easeOut", "本文読解を邪魔しない", "REQ-003"),
    @("ANM-005", "履歴追加", "ノード選択確定", "タイムライン末尾に追加、軽くハイライト", "180ms", "easeOut", "連続選択時は最新のみ強調", "REQ-003")
)

$componentRows = @(
    @("CMP-001", "AppShell", "全体レイアウト、選択状態の保持", "MapViewState, LearningHistoryItem[]", "CategoryRail, KnowledgeMap, NodeDetailPanel, LearningHistory", "なし", "React component", "v1"),
    @("CMP-002", "KnowledgeMap", "ノード/エッジ描画、ズーム、選択イベント", "LearningNode[], KnowledgeEdge[], MapViewState", "StaticNodeRepository, MotionController", "onNodeSelect", "React Flow wrapper", "v1"),
    @("CMP-003", "NodeDetailPanel", "ノード本文表示", "LearningNode", "なし", "selectedNodeId", "React component", "v1"),
    @("CMP-004", "LearningHistory", "選択履歴表示と復元", "LearningHistoryItem[]", "AppShell", "onHistorySelect", "React component", "v1"),
    @("CMP-005", "StaticNodeRepository", "静的教材データ取得", "NodeDataset", "なし", "getNode/getEdges/getCategory", "TypeScript module", "v1"),
    @("CMP-006", "MotionController", "アニメーション計画を生成", "MapViewState, user motion preference", "KnowledgeMap", "focusNode/focusCategory", "TypeScript module", "v1")
)

$stateRows = @(
    @("STATE-001", "AppLoading", "教材データ検証中", "起動", "MapReady/FatalError", "ローディング表示", "TS-011", "v1"),
    @("STATE-002", "MapReady", "全体カテゴリ表示", "データ読込成功", "CategoryFocused", "カテゴリ入口を表示", "TS-012", "v1"),
    @("STATE-003", "CategoryFocused", "カテゴリ領域へズーム済み", "カテゴリ選択", "NodeFocused/MapReady", "カテゴリ配下ノードを表示", "TS-013", "v1"),
    @("STATE-004", "NodeFocused", "ノード詳細表示中", "ノード選択", "NodeFocused/HistoryReview/CategoryFocused", "関連ノードを強調", "TS-014", "v1"),
    @("STATE-005", "HistoryReview", "履歴から過去ノード参照中", "履歴選択", "NodeFocused", "過去選択を復元", "TS-015", "v1"),
    @("STATE-006", "ReducedMotionMode", "アニメーション抑制", "OS設定検出", "MapReady", "即時/低刺激表示", "TS-016", "v1"),
    @("STATE-007", "FatalError", "教材データ不正", "バリデーション失敗", "AppLoading", "エラー表示と再試行", "TS-017", "v1")
)

$logicRows = @(
    @("LOGIC-001", "selectCategory(categoryId)", "カテゴリ選択", "categoryId", "rootNodeIdを取得し、expandedNodeIdsをカテゴリ直下に更新", "不明IDはMapReady維持+通知", "TS-101", "v1"),
    @("LOGIC-002", "selectNode(nodeId)", "ノード選択", "nodeId", "selectedNodeId更新、関連エッジ抽出、履歴追加、詳細表示", "不明IDはFatalErrorではなくユーザー通知", "TS-102", "v1"),
    @("LOGIC-003", "expandRelatedNodes(nodeId)", "関連ノード展開", "nodeId", "nextNodeIdsをexpandedNodeIdsに追加", "循環参照は既存表示を再利用", "TS-103", "v1"),
    @("LOGIC-004", "restoreHistory(index)", "履歴復元", "history index", "該当nodeIdを再選択し履歴位置を強調", "範囲外indexは無視", "TS-104", "v1"),
    @("LOGIC-005", "validateDataset(dataset)", "教材データ検証", "NodeDataset", "id重複、参照切れ、安全メモ未入力を検出", "ビルド/テストで失敗扱い", "TS-105", "v1")
)

$dataRows = @(
    @("DATA-001", "Category", "カテゴリ", "id,title,description,rootNodeId,displayOrder", "Web/Network等の入口", "静的TS/JSON", "将来categoriesテーブル", "v1"),
    @("DATA-002", "LearningNode", "知識ノード", "id,categoryId,title,summary,intent,whatToObserve,signals,nextNodeIds,technicalDetails,safetyNote", "学習の最小単位", "静的TS/JSON", "将来nodesテーブル", "v1"),
    @("DATA-003", "KnowledgeEdge", "ノード間関係", "id,fromNodeId,toNodeId,label,reason", "次に見るべき選択肢を表す", "静的TS/JSON", "将来edgesテーブル", "v1"),
    @("DATA-004", "MapViewState", "画面状態", "selectedCategoryId,selectedNodeId,zoomLevel,expandedNodeIds,highlightedEdgeIds", "UI状態", "React state", "保存しない", "v1"),
    @("DATA-005", "LearningHistoryItem", "選択履歴", "nodeId,selectedAt,reasonLabel", "学習者の辿った道", "ブラウザ内状態", "将来historiesテーブル", "v1"),
    @("DATA-006", "User", "利用者", "id,email,displayName,role,status", "将来認証用", "未使用", "usersテーブル", "Future")
)

$nodeRows = @(
    @("WEB-ROOT", "Webサーバ", "Web", "まず入口としてURL、通信、リソース、認証、入力、エラーを見る", "全体の違和感を分解する", "WEB-URL,WEB-HTTP,WEB-HEADER,WEB-RESOURCE,WEB-AUTH,WEB-INPUT,WEB-ERROR", "実在サイトを対象にしない", "v1"),
    @("WEB-URL", "URLを見る", "Web", "パス、クエリ、拡張子、IDらしき値を見る", "アプリのルーティングと入力面を把握する", "WEB-ROUTE,WEB-PARAM", "危険な改変指示は書かない", "v1"),
    @("WEB-HEADER", "レスポンスヘッダーを見る", "Web", "server, content-type, cache, security headersの有無を見る", "技術スタックや防御方針のヒントを得る", "WEB-COOKIE,WEB-CACHE", "実環境攻撃へ誘導しない", "v1"),
    @("WEB-COOKIE", "Cookie/Sessionを見る", "Web", "属性、名前、寿命、SameSite/Secure/HttpOnlyを見る", "状態管理と認証境界を推測する", "WEB-AUTH", "改ざん手順は扱わない", "v1"),
    @("WEB-RESOURCE", "開発者ツールでリソースを見る", "Web", "JS/CSS/画像/API呼び出しの構造を見る", "フロントとバックエンドの境界を掴む", "WEB-API,WEB-SOURCE", "機密探索の具体手順にしない", "v1"),
    @("WEB-AUTH", "認証フローを見る", "Web", "ログイン前後の画面/通信/状態変化を見る", "何が認証境界か判断する", "WEB-COOKIE,WEB-ERROR", "回避手順は扱わない", "v1"),
    @("WEB-INPUT", "フォーム入力を見る", "Web", "入力種類、制約、エラー文、送信先を見る", "どこがデータ境界か知る", "WEB-ERROR,WEB-HTTP", "攻撃文字列例は載せない", "v1"),
    @("WEB-ERROR", "エラー表示を見る", "Web", "ステータス、文言、画面差分を見る", "内部構造のヒントと分岐条件を読む", "WEB-HEADER,WEB-INPUT", "実サービスで試す指示は禁止", "v1")
)

$apiRows = @(
    @("API-000", "v1方針", "なし", "静的データをバンドルし、外部APIは持たない", "N/A", "N/A", "v1", "実装単純化"),
    @("API-101", "GET /api/categories", "GET", "将来カテゴリ一覧取得", "なし", "Category[]", "Future", "静的データから移行可能"),
    @("API-102", "GET /api/nodes", "GET", "将来ノード一覧取得", "categoryId?", "LearningNode[]", "Future", "検索/フィルタ追加余地"),
    @("API-103", "GET /api/nodes/{id}", "GET", "将来ノード詳細取得", "id", "LearningNode", "Future", "404定義あり"),
    @("API-201", "POST /api/history", "POST", "将来学習履歴保存", "nodeId,selectedAt,reasonLabel", "HistoryItem", "Future", "認証後のみ")
)

$authRows = @(
    @("AUTH-000", "v1認証方針", "未実装", "ゲスト利用のみ。ログインなしで学習マップを使える", "N/A", "N/A", "v1", "過剰実装を避ける"),
    @("AUTH-001", "Guest", "未認証利用者", "マップ閲覧、ノード詳細閲覧、ローカル履歴", "教材編集、クラウド履歴保存不可", "低", "Future-ready", ""),
    @("AUTH-002", "Learner", "将来ログイン学習者", "クラウド履歴保存、お気に入り", "教材編集不可", "中", "Future", ""),
    @("AUTH-003", "Editor", "将来教材編集者", "ノード/エッジ編集、下書き保存", "ユーザー管理不可", "高", "Future", ""),
    @("AUTH-004", "Admin", "将来管理者", "公開管理、権限管理", "なし", "最高", "Future", "")
)

$testRows = @(
    @("TS-001", "要件", "全体マップから対象カテゴリを選べる", "初期表示後にWebカテゴリを選択", "Web領域へズームし直下ノードが表示される", "REQ-001", "画面", "Must"),
    @("TS-002", "要件", "各ノードに意図と判断基準がある", "任意のWeb深掘りノードを選択", "意図/観察点/シグナル/次分岐が空でない", "REQ-002", "単体", "Must"),
    @("TS-010", "アニメーション", "ズームと詳細切替が過剰でない", "ノード選択を連続実行", "読解を妨げず、reduced motionで抑制される", "REQ-003", "画面", "Must"),
    @("TS-014", "状態遷移", "NodeFocusedから履歴復元できる", "複数ノード選択後に履歴を押下", "該当ノードが再フォーカスされる", "STATE-004", "結合", "Should"),
    @("TS-024", "データ", "参照切れノードがない", "dataset validationを実行", "nextNodeIds/edge参照が全て存在", "DATA-002", "単体", "Must"),
    @("TS-030", "安全性", "危険文言を含まない", "教材本文を検索", "実在標的、攻撃実行コマンド、回避手順がない", "REQ-004", "安全性", "Must"),
    @("TS-040", "認証", "v1でログイン必須になっていない", "初期表示", "ログインなしでマップ閲覧可能", "AUTH-000", "画面", "Must")
)

$traceRows = @(
    @("REQ-001", "FN-001,FN-002", "SCR-001", "STATE-002,STATE-003", "DATA-001,DATA-002", "TS-001", "usecase.puml,state.puml", "v1"),
    @("REQ-002", "FN-003,FN-005", "SCR-002,SCR-003", "STATE-004,STATE-005", "DATA-002,DATA-005", "TS-002,TS-014", "sequence_node_select.puml", "v1"),
    @("REQ-003", "FN-002,FN-003", "SCR-001,SCR-002", "STATE-003,STATE-004,STATE-006", "DATA-004", "TS-010", "activity_learning_flow.puml", "v1"),
    @("REQ-004", "FN-006", "全画面", "N/A", "DATA-002", "TS-030", "component.puml", "v1"),
    @("REQ-007", "AUTH-000", "SCR-004", "Guest/AuthFuture", "DATA-006", "TS-040", "auth_future_state.puml", "Future")
)

$Excel = New-Object -ComObject Excel.Application
$Excel.Visible = $false
$Excel.DisplayAlerts = $false

try {
    Save-Workbook "01_基本設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "01 基本設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "改訂履歴" "改訂履歴" @("版","日付","区分","変更内容","作成者","状態","備考1","備考2") $revisionRows),
        (SheetSpec "要件一覧" "要件一覧" @("要件ID","分類","要件","設計方針","優先度","対応機能ID","対応テストID","スコープ") $requirementsRows),
        (SheetSpec "機能一覧" "機能一覧" @("機能ID","機能名","概要","受入条件","主コンポーネント","状態","要件ID","優先度") $functionRows),
        (SheetSpec "非機能要件" "非機能要件" @("ID","分類","要件","設計方針","観点","テストID","優先度","スコープ") $nonFunctionalRows),
        (SheetSpec "トレーサビリティ" "要件トレーサビリティ" @("要件ID","機能ID","画面ID","状態ID","データID","テストID","UML","スコープ") $traceRows)
    ) | Out-Null

    Save-Workbook "02_画面設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "02 画面設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "画面一覧" "画面一覧" @("画面ID","画面名","利用者","目的","起動条件","関連状態","優先度","スコープ") $screenRows),
        (SheetSpec "レイアウト" "メイン画面レイアウト" @("ID","領域","役割","仕様","画面ID","配置","優先度","備考") $layoutRows),
        (SheetSpec "アニメーション仕様" "アニメーション仕様" @("ID","名称","発火条件","表現","時間","イージング","抑制条件","要件ID") $animationRows),
        (SheetSpec "状態遷移" "画面状態遷移" @("状態ID","状態名","説明","入口","出口","表示仕様","テストID","スコープ") $stateRows),
        (SheetSpec "アクセシビリティ" "アクセシビリティ/レスポンシブ" @("ID","対象","要件","設計方針","確認方法","画面ID","優先度","備考") @(
            @("A11Y-001","キーボード","カテゴリ/ノード/履歴をTabとEnterで操作可能","フォーカスリングを明示","手動+E2E","SCR-001","Should",""),
            @("A11Y-002","Motion","prefers-reduced-motion対応","ズーム/発光を即時または低刺激へ変換","手動+CSS確認","SCR-001","Must",""),
            @("RSP-001","Mobile","左右ペインを下部タブへ変換","中央マップを優先表示","375px幅確認","SCR-001","Should",""),
            @("RSP-002","Desktop","マップ中心の作業画面","左240/右360/下96pxを基準","1440px幅確認","SCR-001","Must","")
        ))
    ) | Out-Null

    Save-Workbook "03_詳細設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "03 詳細設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "コンポーネント設計" "コンポーネント設計" @("ID","名称","責務","入力","依存","イベント","実装種別","スコープ") $componentRows),
        (SheetSpec "状態管理" "状態管理詳細" @("状態ID","状態名","説明","入口","出口","表示仕様","テストID","スコープ") $stateRows),
        (SheetSpec "ロジック設計" "ロジック設計" @("ID","関数/処理","目的","入力","処理概要","例外/境界","テストID","スコープ") $logicRows),
        (SheetSpec "安全設計" "安全設計" @("ID","対象","禁止事項","許可事項","検査方法","関連ID","優先度","備考") @(
            @("SAFE-001","教材本文","実在標的への攻撃手順","CTF/教育用の抽象化された観察観点","文言grep+レビュー","REQ-004","Must",""),
            @("SAFE-002","技術詳細","危険コマンドのコピペ可能な提示","原理、見るべき信号、判断基準","レビュー","REQ-004","Must",""),
            @("SAFE-003","UI","攻撃達成を煽る表現","探索、観察、仮説、検証の学習表現","UXレビュー","REQ-004","Must","")
        ))
    ) | Out-Null

    Save-Workbook "04_データ設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "04 データ設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "データモデル一覧" "データモデル一覧" @("データID","名称","分類","主要項目","用途","v1保持方式","将来物理名","スコープ") $dataRows),
        (SheetSpec "Webノード初期定義" "Webノード初期定義" @("ノードID","名称","カテゴリ","概要","意図","次ノード","安全メモ","スコープ") $nodeRows),
        (SheetSpec "エッジ定義" "エッジ定義" @("エッジID","From","To","ラベル","理由","表示条件","スコープ","備考") @(
            @("EDGE-001","WEB-ROOT","WEB-URL","URLを見る","入口と入力面を把握するため","Webカテゴリ選択後","v1",""),
            @("EDGE-002","WEB-ROOT","WEB-HEADER","Headerを見る","通信のメタ情報を読むため","Webカテゴリ選択後","v1",""),
            @("EDGE-003","WEB-HEADER","WEB-COOKIE","Cookieを見る","状態管理の境界を読むため","Header選択後","v1",""),
            @("EDGE-004","WEB-ROOT","WEB-RESOURCE","Resourceを見る","フロント/バックエンド境界を掴むため","Webカテゴリ選択後","v1",""),
            @("EDGE-005","WEB-ROOT","WEB-AUTH","Authを見る","認証境界を理解するため","Webカテゴリ選択後","v1",""),
            @("EDGE-006","WEB-ROOT","WEB-INPUT","Inputを見る","データ境界を理解するため","Webカテゴリ選択後","v1",""),
            @("EDGE-007","WEB-INPUT","WEB-ERROR","Errorを見る","入力に対する分岐を読むため","Input選択後","v1","")
        )),
        (SheetSpec "将来物理設計" "将来DB物理設計案" @("テーブル","主キー","主要カラム","用途","作成タイミング","認証要否","備考","スコープ") @(
            @("categories","id","title,description,root_node_id,display_order","カテゴリ管理","API化時","不要","公開データ","Future"),
            @("nodes","id","category_id,title,summary,intent,technical_details,safety_note","ノード管理","API化時","編集時のみ必要","公開データ","Future"),
            @("edges","id","from_node_id,to_node_id,label,reason","関係管理","API化時","編集時のみ必要","公開データ","Future"),
            @("users","id","email,display_name,role,status","利用者管理","認証導入時","必要","個人情報扱い","Future"),
            @("learning_histories","id","user_id,node_id,selected_at,reason_label","履歴保存","認証導入時","必要","削除要求対応","Future")
        ))
    ) | Out-Null

    Save-Workbook "05_API設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "05 API設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "API方針" "API方針" @("ID","分類","方針","理由","v1扱い","将来扱い","関連設計","備考") @(
            @("APIPOL-001","v1","外部APIなし","学習価値はクライアント内マップで成立するため","静的データ","API化可能","DATA-001..003",""),
            @("APIPOL-002","将来","読み取りAPIは公開可能","教材データは公開情報扱い","未実装","GET API","API-101..103",""),
            @("APIPOL-003","将来","書き込みAPIは認証必須","教材改変/履歴保存を保護するため","未実装","POST/PUT API","AUTH-002..004","")
        )),
        (SheetSpec "エンドポイント一覧" "将来エンドポイント一覧" @("API ID","パス","メソッド","目的","入力","出力","スコープ","備考") $apiRows),
        (SheetSpec "エラーコード" "APIエラーコード案" @("コード","HTTP","名称","発生条件","ユーザー表示","ログ","スコープ","備考") @(
            @("E-400-001","400","InvalidRequest","入力パラメータ不正","指定内容を確認してください","warn","Future",""),
            @("E-401-001","401","Unauthorized","未ログイン","ログインが必要です","info","Future",""),
            @("E-403-001","403","Forbidden","権限不足","この操作は許可されていません","warn","Future",""),
            @("E-404-001","404","NotFound","ノード/カテゴリなし","対象が見つかりません","info","Future",""),
            @("E-500-001","500","InternalError","予期せぬエラー","時間をおいて再試行してください","error","Future","")
        ))
    ) | Out-Null

    Save-Workbook "06_認証認可設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "06 認証認可設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "認証方針" "認証方針" @("ID","名称","状態","内容","許可","禁止","スコープ","理由") $authRows),
        (SheetSpec "権限マトリクス" "権限マトリクス" @("機能","Guest","Learner","Editor","Admin","v1扱い","将来扱い","備考") @(
            @("マップ閲覧","可","可","可","可","Guestで実装","維持",""),
            @("ローカル履歴","可","可","可","可","Guestで実装","維持","ブラウザ内のみ"),
            @("クラウド履歴保存","不可","可","可","可","未実装","認証後",""),
            @("教材編集","不可","不可","可","可","未実装","認証+ロール",""),
            @("公開管理","不可","不可","不可","可","未実装","管理者のみ","")
        )),
        (SheetSpec "将来状態遷移" "将来認証状態遷移" @("状態","説明","入口","出口","画面/処理","リスク","UML","スコープ") @(
            @("Guest","未認証","初期表示","Authenticated/AuthFailed","ログイン導線","低","auth_future_state.puml","Future"),
            @("Authenticated","認証済み","ログイン成功","SessionRefreshing/Guest/Forbidden","通常利用","中","auth_future_state.puml","Future"),
            @("SessionRefreshing","更新中","期限接近","Authenticated/Guest","トークン更新","中","auth_future_state.puml","Future"),
            @("Forbidden","権限不足","権限外機能アクセス","Authenticated","エラー表示","中","auth_future_state.puml","Future")
        ))
    ) | Out-Null

    Save-Workbook "07_テスト設計書_HackerLake.xlsx" @(
        (SheetSpec "表紙" "07 テスト設計書 - 表紙" @("項目","値","項目2","値2","項目3","値3","項目4","値4") $commonCoverRows),
        (SheetSpec "テスト方針" "テスト方針" @("ID","分類","方針","対象","完了条件","関連設計","優先度","備考") @(
            @("TP-001","単体","データ/ロジックを優先検査","StaticNodeRepository, validation","参照切れなし","03,04","Must",""),
            @("TP-002","結合","ノード選択から詳細/履歴まで確認","AppShell一式","状態遷移が設計通り","02,03","Must",""),
            @("TP-003","画面","デスクトップ/モバイル確認","SCR-001..003","崩れなし","02","Must",""),
            @("TP-004","安全性","教材文言を検査","LearningNode本文","危険文言なし","03,04","Must","")
        )),
        (SheetSpec "テストケース" "テストケース一覧" @("テストID","分類","観点","手順","期待結果","関連ID","種別","優先度") $testRows),
        (SheetSpec "受入基準" "受入基準" @("ID","基準","確認方法","合格条件","関連要件","優先度","備考","スコープ") @(
            @("AC-001","全体マップが主役である","画面レビュー","初期表示でマップが最大領域","REQ-001","Must","","v1"),
            @("AC-002","Webは3階層以上辿れる","データ確認","WEB-ROOTから複数分岐し孫ノード相当まで到達","REQ-006","Must","","v1"),
            @("AC-003","手順書でなく判断基準を学べる","本文レビュー","各ノードにintent/signalsがある","REQ-002","Must","","v1"),
            @("AC-004","刺激的だが読みやすい","画面レビュー","アニメーション仕様が実装され、読解を邪魔しない","REQ-003","Must","","v1"),
            @("AC-005","安全性を守る","文言検査","危険な実行手順なし","REQ-004","Must","","v1")
        ))
    ) | Out-Null
}
finally {
    $Excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($Excel) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Write-Host "Generated design workbooks in $DesignDir"
