import type { Edge, Node } from '@xyflow/react';

export type CategoryId = 'web' | 'network' | 'forensics' | 'crypto' | 'reverse' | 'pwn';

export type LearningNodeData = {
  title: string;
  category: CategoryId;
  level: number;
  summary: string;
  intent: string;
  observe: string[];
  signals: string[];
  details: string;
  next: string[];
  safety: string;
};

export type Category = {
  id: CategoryId;
  title: string;
  subtitle: string;
  rootNodeId: string;
  color: string;
};

export const categories: Category[] = [
  { id: 'web', title: 'Web', subtitle: '画面・通信・状態管理', rootNodeId: 'web-root', color: '#21d4a4' },
  { id: 'network', title: 'Network', subtitle: '到達性・プロトコル', rootNodeId: 'network-root', color: '#69a7ff' },
  { id: 'forensics', title: 'Forensics', subtitle: 'ファイル・ログ・痕跡', rootNodeId: 'forensics-root', color: '#ffcb5c' },
  { id: 'crypto', title: 'Crypto', subtitle: '形式・仮定・弱さ', rootNodeId: 'crypto-root', color: '#c084fc' },
  { id: 'reverse', title: 'Reverse', subtitle: 'バイナリ・挙動観察', rootNodeId: 'reverse-root', color: '#fb7185' },
  { id: 'pwn', title: 'Pwn', subtitle: 'メモリ・境界・制御', rootNodeId: 'pwn-root', color: '#f97316' },
];

const rootSummary = 'v1では入口ノード。選ぶと、この分野でまず何を観察するかを表示する。';

export const learningNodes: Node<LearningNodeData>[] = [
  {
    id: 'web-root',
    type: 'learning',
    position: { x: -720, y: 0 },
    data: {
      title: 'Web画面を表示',
      category: 'web',
      level: 0,
      summary: 'まず画面を出す。そこからURL、通信、状態、入力、エラーのどれを見るか選ぶ。',
      intent: '目の前の画面を「攻め方」ではなく「観察できる境界」に分解する。',
      observe: ['URLとパス', 'HTTPの往復', 'Cookie/Session', '読み込まれるリソース', 'フォームとエラー'],
      signals: ['画面変化と通信変化が一致しない', 'ログイン前後でCookieやAPIが変わる', 'エラー文が内部構造を示唆する'],
      details: 'Webは画面、ブラウザ、HTTP、サーバ、状態管理が重なっている。最初は一つずつ分離して、どこに情報が出ているかを探す。',
      next: ['web-url', 'web-http', 'web-header', 'web-resource', 'web-auth', 'web-input', 'web-error'],
      safety: '実在サービスでは試さない。CTF/自分の教材環境だけを前提にする。',
    },
  },
  {
    id: 'web-url',
    type: 'learning',
    position: { x: -270, y: -360 },
    data: {
      title: 'URLを見る',
      category: 'web',
      level: 1,
      summary: 'パス、クエリ、拡張子、IDらしき値から、アプリが何を入力として扱っているかを見る。',
      intent: 'アプリの入口とルーティングを把握し、次に観察する面を決める。',
      observe: ['パス階層', 'クエリ名', '数字やUUIDらしき値', '拡張子', 'リダイレクト先'],
      signals: ['IDらしき値が画面内容と対応する', 'クエリの有無で表示が変わる', '拡張子が処理方式を示す'],
      details: 'URLは最初に見える入力面。値を変える話ではなく、どの情報がサーバ側判断に使われていそうかを観察する。',
      next: ['web-route', 'web-param'],
      safety: '勝手に値を変えて実サービスを試す誘導はしない。',
    },
  },
  {
    id: 'web-http',
    type: 'learning',
    position: { x: -270, y: -240 },
    data: {
      title: 'HTTPを見る',
      category: 'web',
      level: 1,
      summary: 'GET/POST、ステータス、リダイレクト、リクエストとレスポンスの対応を見る。',
      intent: '画面ではなく通信の単位で、どの操作がどの反応を生むか理解する。',
      observe: ['HTTPメソッド', 'ステータスコード', 'リダイレクト', 'Content-Type', 'リクエスト順序'],
      signals: ['同じ画面でも複数APIが動く', '302が認証境界を示す', '4xx/5xxが入力境界を示す'],
      details: 'HTTPを見ると、UI上の一操作が複数の通信に分かれていることがわかる。選択肢を増やすには、画面単位から通信単位へ粒度を落とす。',
      next: ['web-header', 'web-error'],
      safety: '危険なリクエスト再送や攻撃文字列の例示は扱わない。',
    },
  },
  {
    id: 'web-header',
    type: 'learning',
    position: { x: -270, y: -120 },
    data: {
      title: 'Headerを見る',
      category: 'web',
      level: 1,
      summary: 'Server、Cache、Cookie、Security Header、Content-Typeなどのメタ情報を見る。',
      intent: '本文以外のメタ情報から、状態管理・防御方針・技術スタックのヒントを得る。',
      observe: ['Set-Cookie', 'Cache-Control', 'Content-Type', 'Location', 'Security Header'],
      signals: ['Cookie属性の差', 'キャッシュ制御の弱さ', 'リダイレクト先の規則性'],
      details: 'ヘッダーはサーバの判断結果が出る場所。本文に見えない状態変化や防御設定を読むための入口になる。',
      next: ['web-cookie', 'web-cache'],
      safety: 'ヘッダー観察は自分の教材環境か許可範囲に限定する。',
    },
  },
  {
    id: 'web-resource',
    type: 'learning',
    position: { x: -270, y: 0 },
    data: {
      title: 'Resourceを見る',
      category: 'web',
      level: 1,
      summary: 'DevToolsでJS/CSS/画像/API呼び出しを見て、フロントとバックエンドの境界を掴む。',
      intent: 'どの情報がブラウザに配られていて、どこからサーバ通信に切り替わるかを見る。',
      observe: ['JS bundle', 'API呼び出し', '静的ファイル名', 'Source mapの有無', '読み込み失敗'],
      signals: ['APIの命名が機能を示す', '静的ファイルに画面遷移のヒントがある', 'リソース失敗で別挙動になる'],
      details: 'Resource観察は、画面の裏にある構成を知るための地図作り。v1では危険な解析手順ではなく、境界を見る観点に絞る。',
      next: ['web-api', 'web-source'],
      safety: '機密探索や実サービスの解析に誘導しない。',
    },
  },
  {
    id: 'web-auth',
    type: 'learning',
    position: { x: -270, y: 120 },
    data: {
      title: '認証フローを見る',
      category: 'web',
      level: 1,
      summary: 'ログイン前後の画面、通信、Cookie、リダイレクトの変化を見る。',
      intent: '「何がログイン状態を表しているか」と「どこが境界か」を把握する。',
      observe: ['ログイン前後のCookie', '302/401/403', '画面表示差分', 'APIの認可失敗', 'ログアウト時の変化'],
      signals: ['Cookie追加で画面が変わる', '未ログイン時だけリダイレクトする', 'APIだけ権限エラーになる'],
      details: '認証は一つのボタンではなく、Cookie、セッション、API、画面制御の組み合わせ。どの層が境界を担当するかを見る。',
      next: ['web-cookie', 'web-error'],
      safety: '回避方法や改ざん手順は扱わない。',
    },
  },
  {
    id: 'web-input',
    type: 'learning',
    position: { x: -270, y: 240 },
    data: {
      title: 'Inputを見る',
      category: 'web',
      level: 1,
      summary: 'フォーム項目、入力制約、送信先、エラー文から、データ境界を把握する。',
      intent: 'どこでデータを受け取り、どこで拒否しているかを読む。',
      observe: ['入力項目名', '必須/文字数制約', '送信先', 'エラー文', '画面側バリデーション'],
      signals: ['画面側とサーバ側の制約が違う', 'エラーが項目単位で出る', '送信先が機能境界を示す'],
      details: 'Input観察は「何を入れるか」ではなく「何がデータ境界か」を知る作業。手札を増やすには拒否のされ方を見る。',
      next: ['web-error', 'web-http'],
      safety: '攻撃文字列例は載せない。',
    },
  },
  {
    id: 'web-error',
    type: 'learning',
    position: { x: -270, y: 360 },
    data: {
      title: 'Errorを見る',
      category: 'web',
      level: 1,
      summary: 'ステータス、文言、画面差分から、内部の分岐条件や検証箇所を読む。',
      intent: '失敗時の反応を観察し、次に見るべき違和感を見つける。',
      observe: ['エラー文', 'HTTP status', '表示位置', '成功時との差分', 'ログイン状態との差分'],
      signals: ['入力内容でエラー種類が変わる', '認証/認可/検証の失敗が違う', '内部名らしき表示がある'],
      details: 'エラーはアプリが境界を説明してくれる場所。まず分類し、どの層のエラーかを見る。',
      next: ['web-header', 'web-input'],
      safety: '実サービスで試す指示は禁止。',
    },
  },
  {
    id: 'web-cookie',
    type: 'learning',
    position: { x: 230, y: -250 },
    data: {
      title: 'Cookie / Session',
      category: 'web',
      level: 2,
      summary: '名前、属性、寿命、ログイン前後の差から状態管理の境界を読む。',
      intent: 'ブラウザ側に見える状態の印と、サーバ側セッションの存在を区別する。',
      observe: ['HttpOnly', 'Secure', 'SameSite', 'Expires/Max-Age', 'ログアウト時の削除'],
      signals: ['ログイン後だけ増えるCookie', '権限エラー時もCookieは残る', '属性が防御方針を示す'],
      details: 'Cookieは状態のヒントであって、認証そのものとは限らない。属性と画面変化をセットで見る。',
      next: [],
      safety: '改ざんや再利用の手順は扱わない。',
    },
  },
  {
    id: 'web-cache',
    type: 'learning',
    position: { x: 230, y: -130 },
    data: {
      title: 'Cacheを見る',
      category: 'web',
      level: 2,
      summary: 'Cache-ControlやETagから、情報がどこに残るかを見る。',
      intent: '表示された情報がブラウザ、プロキシ、サーバのどこで再利用されるかを理解する。',
      observe: ['Cache-Control', 'ETag', 'Last-Modified', '304', 'no-store/no-cache'],
      signals: ['個人情報画面に強いキャッシュがある', '更新しても古い情報が出る', '304が多い'],
      details: 'キャッシュは速度の仕組みだが、セキュリティ上は情報の残り方として観察できる。',
      next: [],
      safety: '他者情報の取得や再利用に繋がる説明はしない。',
    },
  },
  {
    id: 'web-api',
    type: 'learning',
    position: { x: 230, y: 10 },
    data: {
      title: 'API呼び出しを見る',
      category: 'web',
      level: 2,
      summary: 'フロントがどのAPIから何を取っているかを観察する。',
      intent: '画面表示の裏にあるデータ取得単位を掴む。',
      observe: ['エンドポイント名', 'レスポンス形式', '呼び出し順', '認証前後の差', '失敗時のstatus'],
      signals: ['画面名とAPI名が対応する', '権限がAPI側で判定される', '同じAPIを複数画面で使う'],
      details: 'API観察は機能境界の理解に役立つ。v1では読み方に限定し、攻撃的な試行は扱わない。',
      next: [],
      safety: '未許可API探索の具体手順にしない。',
    },
  },
  {
    id: 'web-source',
    type: 'learning',
    position: { x: 230, y: 130 },
    data: {
      title: 'フロント実装の痕跡',
      category: 'web',
      level: 2,
      summary: 'JS/CSSの命名、画面構造、読み込み失敗から実装のヒントを見る。',
      intent: '画面だけでは見えない機能構造を、配布済みリソースから把握する。',
      observe: ['chunk名', 'route名', 'フォーム名', 'feature flagらしき語', '表示されないUI'],
      signals: ['未表示機能名がある', 'ルート名が画面構造を示す', 'API名とUI名が対応する'],
      details: 'フロント実装の痕跡は地図作りの材料。機密探索ではなく、構造理解に使う。',
      next: [],
      safety: '実サービスの隠し機能探索を促さない。',
    },
  },
  {
    id: 'web-route',
    type: 'learning',
    position: { x: 230, y: -430 },
    data: {
      title: 'Routeを見る',
      category: 'web',
      level: 2,
      summary: 'URLパスと画面の対応から、機能単位を読む。',
      intent: '画面遷移を地図化し、どの単位で観察を深めるか決める。',
      observe: ['階層構造', '名詞/動詞', '管理系らしき語', 'ロケール', '末尾スラッシュ'],
      signals: ['同じ階層に似た機能が並ぶ', 'IDあり/なしで画面が違う', 'リダイレクトがある'],
      details: 'Routeはアプリの目次。まず名前と階層を読むだけでも選択肢が増える。',
      next: [],
      safety: '未公開パス総当たりの手順は扱わない。',
    },
  },
  {
    id: 'web-param',
    type: 'learning',
    position: { x: 230, y: -310 },
    data: {
      title: 'Parameterを見る',
      category: 'web',
      level: 2,
      summary: 'クエリやIDらしき値が、表示内容や検索条件にどう関わるかを見る。',
      intent: 'ユーザー入力として扱われる値を把握する。',
      observe: ['key名', '値の形式', '複数指定', 'ソート/検索条件', 'ページ番号'],
      signals: ['値が画面表示に反映される', '空値で挙動が変わる', '検索条件がURLに残る'],
      details: 'Parameterは観察対象。操作手順ではなく、画面と値の対応を読む。',
      next: [],
      safety: '攻撃的な値の例示はしない。',
    },
  },
  ...categories
    .filter((category) => category.id !== 'web')
    .map((category, index) => ({
      id: category.rootNodeId,
      type: 'learning',
      position: {
        x: -720,
        y: (index - 2) * 150,
      },
      data: {
        title: category.title,
        category: category.id,
        level: 0,
        summary: rootSummary,
        intent: `${category.title}領域で、最初に何を観察単位に分けるかを掴む。`,
        observe: ['対象の種類', '入力と出力', '形式', '失敗時の反応'],
        signals: ['形式が分かる', '境界が見える', '次に見るべき層が決まる'],
        details: 'v1では全体地図の入口として表示する。詳細ノードはWeb領域から優先実装する。',
        next: [],
        safety: '教育・CTF文脈の知識整理に限定する。',
      },
    })),
];

const edgePairs = [
  ['web-root', 'web-url', '入口'],
  ['web-root', 'web-http', '通信'],
  ['web-root', 'web-header', 'メタ情報'],
  ['web-root', 'web-resource', 'リソース'],
  ['web-root', 'web-auth', '状態境界'],
  ['web-root', 'web-input', '入力境界'],
  ['web-root', 'web-error', '失敗の反応'],
  ['web-url', 'web-route', '画面地図'],
  ['web-url', 'web-param', '値の対応'],
  ['web-http', 'web-header', 'レスポンス観察'],
  ['web-http', 'web-error', 'status差分'],
  ['web-header', 'web-cookie', '状態'],
  ['web-header', 'web-cache', '残り方'],
  ['web-resource', 'web-api', '通信境界'],
  ['web-resource', 'web-source', '実装痕跡'],
  ['web-auth', 'web-cookie', 'session'],
  ['web-auth', 'web-error', '401/403'],
  ['web-input', 'web-error', '検証結果'],
  ['web-input', 'web-http', '送信'],
] as const;

export const learningEdges: Edge[] = edgePairs.map(([source, target, label]) => ({
  id: `${source}-${target}`,
  source,
  target,
  label,
  animated: true,
  type: 'smoothstep',
}));

export function getNode(id: string) {
  return learningNodes.find((node) => node.id === id);
}

export function getCategory(id: CategoryId) {
  return categories.find((category) => category.id === id)!;
}
