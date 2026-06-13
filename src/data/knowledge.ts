import type { Edge, Node } from '@xyflow/react';

export type CategoryId = 'web' | 'network' | 'forensics' | 'crypto' | 'reverse' | 'pwn';

export type Observation = {
  label: string;
  what: string;
  how: string;
};

export type Branch = {
  signal: string;
  targetId: string;
  action: string;
};

export type LearningNodeData = {
  title: string;
  category: CategoryId;
  level: number;
  summary: string;
  what: string;
  intent: string;
  observe: Observation[];
  branches: Branch[];
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

const categorySeeds: Record<Exclude<CategoryId, 'web'>, Omit<LearningNodeData, 'category' | 'title'>> = {
  network: {
    level: 0,
    summary: 'まず到達できる相手、話しているプロトコル、返ってくる反応を分けて見る。',
    what: 'Networkは、機器やサービス同士がどうつながり、どの約束事で通信しているかを見る分野。CTFではポート、プロトコル、応答の違いが入口になる。',
    intent: '画面がない対象でも、応答の有無とプロトコルの種類から次に見る場所を決めるため。',
    observe: [
      {
        label: '到達性',
        what: '相手に通信が届くかどうか。',
        how: 'CTF環境の説明、接続先、許可された疎通確認結果だけを見る。',
      },
      {
        label: '開いているサービス',
        what: 'HTTP、SSH、DNSのように、待ち受けている役割のこと。',
        how: '問題文や許可済みの列挙結果から、サービス名とポート番号を対応させる。',
      },
      {
        label: '応答の種類',
        what: '正常応答、拒否、タイムアウトなどの違い。',
        how: '返ってきた文言、status、バナー、タイムアウトの差をメモする。',
      },
    ],
    branches: [],
    details: '初心者は「ポート番号を覚える」より、到達性、サービス、応答差分の3つに分けると迷いにくい。実ネットワークではなく、CTFや自分の検証範囲だけで扱う。',
    next: [],
    safety: '許可のないネットワークへのスキャンや疎通確認は扱わない。',
  },
  forensics: {
    level: 0,
    summary: 'ファイル、ログ、時刻、メタデータから、何が起きたかを復元する。',
    what: 'Forensicsは、残された痕跡から状況を読む分野。ファイル形式、タイムスタンプ、ログ、削除痕跡などを手がかりにする。',
    intent: '問題ファイルをいきなり開くのではなく、種類と痕跡を分けて観察するため。',
    observe: [
      {
        label: 'ファイル形式',
        what: '拡張子ではなく、実際の中身の種類。',
        how: 'ファイル名、マジックバイト、ツールの識別結果を見る。',
      },
      {
        label: 'メタデータ',
        what: '作成者、時刻、撮影情報など、本体とは別に付く情報。',
        how: '問題文と矛盾する時刻や作者名がないかを見る。',
      },
      {
        label: 'ログの順序',
        what: '出来事が発生した時系列。',
        how: '時刻、ID、同じIPやユーザー名の連続を追う。',
      },
    ],
    branches: [],
    details: 'Forensicsは「答えっぽい文字列探し」だけだと詰まる。まずファイルの種類、時刻、痕跡の場所を決めると、調査が一本道になりにくい。',
    next: [],
    safety: '第三者の端末・ログ・個人情報を対象にしない。',
  },
  crypto: {
    level: 0,
    summary: '暗号そのものを破る前に、形式、前提、使い方の弱さを見る。',
    what: 'Cryptoは、暗号文、鍵、乱数、署名、ハッシュなどの性質を読む分野。CTFでは実装ミスや前提の崩れが題材になる。',
    intent: '式を丸暗記する前に、何が与えられていて何が秘密なのかを整理するため。',
    observe: [
      {
        label: '与えられた値',
        what: '暗号文、公開鍵、ハッシュ、ヒントなど問題で見えている材料。',
        how: '値の長さ、形式、繰り返し、同じ値の再利用を確認する。',
      },
      {
        label: '秘密の前提',
        what: '鍵、乱数、平文など、本来隠れているはずのもの。',
        how: '問題文が何を隠し、何を漏らしているかを表にする。',
      },
      {
        label: '方式の名前',
        what: 'RSA、AES、XOR、Hashなどのカテゴリ。',
        how: '形式や問題文の語から方式を推測し、典型的な弱点候補を絞る。',
      },
    ],
    branches: [],
    details: 'Cryptoは最初から計算に入ると迷子になりやすい。見えている値、秘密の値、方式の前提を分けるだけで、取れる選択肢がかなり絞れる。',
    next: [],
    safety: '実システムの暗号突破や秘密情報取得には使わない。',
  },
  reverse: {
    level: 0,
    summary: '実行結果、文字列、分岐、入力チェックから、プログラムの考え方を読む。',
    what: 'Reverseは、ソースがないプログラムの挙動を観察して、内部の条件や処理を推測する分野。',
    intent: 'バイナリを怖いものとして眺めるのではなく、入力と出力の関係に分解するため。',
    observe: [
      {
        label: '表示文字列',
        what: 'プログラム内に埋め込まれたメッセージやエラー。',
        how: '成功、失敗、使い方、隠れたコマンドらしき文字を見る。',
      },
      {
        label: '入力チェック',
        what: '入力された値を受け取り、条件で分ける処理。',
        how: 'どんな入力で表示が変わるか、問題文の範囲で観察する。',
      },
      {
        label: '分岐',
        what: '条件によって処理が分かれる場所。',
        how: '成功側と失敗側で出る文言や終了コードの差を見る。',
      },
    ],
    branches: [],
    details: 'Reverseはツール名よりも、入力、比較、分岐、出力の対応を読むのが先。CTFではその対応を少しずつ狭める。',
    next: [],
    safety: 'マルウェア解析や回避技術の実用支援には踏み込まない。',
  },
  pwn: {
    level: 0,
    summary: '入力サイズ、メモリ配置、保護機構、クラッシュの仕方を見る。',
    what: 'Pwnは、プログラムのメモリ扱いの弱さを理解する分野。CTFでは境界チェック、クラッシュ、保護機構が観察対象になる。',
    intent: 'いきなり制御を奪う話ではなく、まず何が境界を越えたのかを読むため。',
    observe: [
      {
        label: '入力サイズ',
        what: 'プログラムが受け取るデータの長さ。',
        how: '問題文、ソース断片、クラッシュ条件から長さの境界を見る。',
      },
      {
        label: 'クラッシュ',
        what: 'プログラムが異常終了すること。',
        how: 'どの入力範囲で落ちるか、落ち方が同じかだけを整理する。',
      },
      {
        label: '保護機構',
        what: 'ASLR、NX、Canaryなど、悪用を難しくする仕組み。',
        how: 'CTF環境の表示や問題文から有無を確認する。',
      },
    ],
    branches: [],
    details: 'Pwnは危険に見えやすいが、学習の入口は「どの境界を越えたか」を理解すること。実システムへの応用ではなく、CTF内の概念学習に限定する。',
    next: [],
    safety: '実サービスや他人のプログラムへの攻撃支援は扱わない。',
  },
};

export const learningNodes: Node<LearningNodeData>[] = [
  {
    id: 'web-root',
    type: 'learning',
    position: { x: -760, y: 0 },
    data: {
      title: 'Web画面を表示',
      category: 'web',
      level: 0,
      summary: '画面を起点に、URL、通信、ヘッダー、リソース、認証、入力、エラーへ分ける。',
      what: 'Web問題の入口。ブラウザに表示された画面は、HTMLだけではなく、URL、HTTP通信、Cookie、JavaScript、API、入力フォーム、エラー処理が重なった結果として見えている。',
      intent: '最初から「攻撃できそうな場所」を探すと視野が狭くなる。まず観察面を分けて、次にどこを見るべきかを選ぶ。',
      observe: [
        {
          label: '画面で何が変わるか',
          what: 'クリックや入力のあと、表示がどこだけ変わるか。',
          how: 'ページ全体、一覧、ボタン、エラー表示のどれが変わったかを見る。',
        },
        {
          label: '通信が起きるか',
          what: '画面操作の裏でブラウザがサーバとやり取りすること。',
          how: 'DevToolsのNetworkで、操作直後に増えた行だけを見る。',
        },
        {
          label: '状態が残るか',
          what: 'ログイン状態、選択状態、検索条件など、次の画面にも残る情報。',
          how: '戻る、更新、別ページ遷移のあとに何が残るかを見る。',
        },
        {
          label: '失敗時の反応',
          what: '入力ミスや権限不足のときに出る文言やstatus。',
          how: '成功時と失敗時の差だけを短くメモする。',
        },
      ],
      branches: [
        { signal: 'URLにIDや検索条件が見える', targetId: 'web-url', action: 'URLを見る' },
        { signal: '操作のたびに通信が増える', targetId: 'web-http', action: 'HTTPを見る' },
        { signal: 'ログイン前後で画面が変わる', targetId: 'web-auth', action: '認証フローを見る' },
      ],
      details: 'Webの偵察は「画面を使う」ではなく「画面を分解する」作業。URL、通信、状態、入力、エラーを分けると、次の観察が選びやすくなる。',
      next: ['web-url', 'web-http', 'web-header', 'web-resource', 'web-auth', 'web-input', 'web-error'],
      safety: '実在サービスでは試さない。CTF、自分の教材環境、自分が管理する検証環境だけを前提にする。',
    },
  },
  {
    id: 'web-url',
    type: 'learning',
    position: { x: -280, y: -360 },
    data: {
      title: 'URLを見る',
      category: 'web',
      level: 1,
      summary: 'パス、クエリ、IDらしき値から、アプリが何を入力として扱うか読む。',
      what: 'URLはブラウザ上に見えている入力面。どの画面を開くか、どんな検索条件か、どのデータを表示するかのヒントが入る。',
      intent: 'URLから画面の地図と値の役割を分ける。ここで分けると、Routeを見るかParameterを見るかを選べる。',
      observe: [
        {
          label: 'パス',
          what: '`/users/123` のように、画面や機能の場所を表す部分。',
          how: '名詞、階層、IDらしき値がどこにあるか見る。',
        },
        {
          label: 'クエリ',
          what: '`?page=2&q=test` のように、条件を渡す部分。',
          how: 'key名が検索、並び替え、ページングのどれに見えるか読む。',
        },
        {
          label: 'リダイレクト先',
          what: 'アクセス後に別URLへ移動すること。',
          how: 'ログイン前後、権限不足、末尾スラッシュ有無で移動先が変わるか見る。',
        },
      ],
      branches: [
        { signal: 'パス階層が機能名っぽい', targetId: 'web-route', action: 'Routeを見る' },
        { signal: 'クエリやIDが画面内容と対応する', targetId: 'web-param', action: 'Parameterを見る' },
        { signal: '移動先が認証状態で変わる', targetId: 'web-auth', action: '認証フローを見る' },
      ],
      details: 'URLは攻撃対象ではなく、アプリが外から受け取る情報の一覧として見る。値を変える前に、どの値が何の意味を持つかを読む。',
      next: ['web-route', 'web-param', 'web-auth'],
      safety: '許可のない対象で値を変えて試す誘導はしない。',
    },
  },
  {
    id: 'web-http',
    type: 'learning',
    position: { x: -280, y: -240 },
    data: {
      title: 'HTTPを見る',
      category: 'web',
      level: 1,
      summary: 'GET/POST、status、リダイレクト、リクエスト順序を見る。',
      what: 'HTTPはブラウザとサーバの会話。画面操作は、裏側ではリクエストとレスポンスの組み合わせとして動く。',
      intent: '画面単位ではなく通信単位で見ると、どの操作がどの判断を呼んだか分かる。',
      observe: [
        {
          label: 'メソッド',
          what: 'GET、POSTなど、通信の目的を表す種類。',
          how: '表示取得なのか、送信なのか、更新なのかをざっくり分ける。',
        },
        {
          label: 'ステータスコード',
          what: '200、302、401、403、500など、サーバの返答の分類。',
          how: '成功、移動、認証失敗、権限不足、サーバエラーを分ける。',
        },
        {
          label: '順序',
          what: '一つの操作で複数通信が起きるときの流れ。',
          how: '最初に呼ばれるAPI、最後に失敗するAPIだけ見る。',
        },
      ],
      branches: [
        { signal: '302やLocationが出る', targetId: 'web-header', action: 'Headerを見る' },
        { signal: '401/403/500が目立つ', targetId: 'web-error', action: 'Errorを見る' },
        { signal: 'フォーム送信と通信が対応する', targetId: 'web-input', action: 'Inputを見る' },
      ],
      details: 'HTTPを見る目的は、闇雲にリクエストを触ることではない。画面上の一操作を、通信の粒度へ分解して判断材料を増やすこと。',
      next: ['web-header', 'web-error', 'web-input'],
      safety: '危険なリクエスト再送や攻撃文字列の例示は扱わない。',
    },
  },
  {
    id: 'web-header',
    type: 'learning',
    position: { x: -280, y: -120 },
    data: {
      title: 'Headerを見る',
      category: 'web',
      level: 1,
      summary: 'Cookie、Location、Cache-Control、Content-Type、Security Headerを見る。',
      what: 'Headerは本文以外のメタ情報。サーバが「どう扱ってほしいか」「どこへ移動させるか」「状態をどう持つか」を伝える場所。',
      intent: '本文に出ない状態管理、防御設定、リダイレクト、キャッシュ方針を読む。',
      observe: [
        {
          label: 'Set-Cookie',
          what: 'ブラウザにCookieを保存させる指示。',
          how: 'ログイン前後で増えるか、HttpOnlyやSameSiteが付くかを見る。',
        },
        {
          label: 'Location',
          what: 'リダイレクト先を示すヘッダー。',
          how: '未ログイン、権限不足、完了後で移動先が違うか見る。',
        },
        {
          label: 'Cache-Control',
          what: 'レスポンスを保存してよいかの方針。',
          how: '個人情報画面に保存禁止の指定があるか見る。',
        },
      ],
      branches: [
        { signal: 'Cookie属性が状態を示す', targetId: 'web-cookie', action: 'Cookie / Sessionを見る' },
        { signal: '保存方針が気になる', targetId: 'web-cache', action: 'Cacheを見る' },
        { signal: 'Locationで画面が動く', targetId: 'web-url', action: 'URLを見る' },
      ],
      details: 'Headerは地味だが、認証、キャッシュ、リダイレクト、防御方針の手がかりがまとまっている。本文だけ見ていると見落としやすい。',
      next: ['web-cookie', 'web-cache', 'web-url'],
      safety: 'ヘッダー観察は自分の教材環境か許可範囲に限定する。',
    },
  },
  {
    id: 'web-resource',
    type: 'learning',
    position: { x: -280, y: 0 },
    data: {
      title: 'Resourceを見る',
      category: 'web',
      level: 1,
      summary: 'JS、CSS、画像、API呼び出しから、フロントとサーバの境界を見る。',
      what: 'Resourceは画面を作るためにブラウザへ配られるファイルや通信。JavaScript、CSS、画像、APIレスポンスなどが含まれる。',
      intent: '画面に見えるものが、どのファイルやAPIから来ているかを分けるため。',
      observe: [
        {
          label: 'JS bundle',
          what: '画面の動きを持つJavaScriptのまとまり。',
          how: 'ファイル名、読み込み順、失敗時の画面変化を見る。',
        },
        {
          label: 'API呼び出し',
          what: 'JavaScriptがサーバからデータを取る通信。',
          how: '画面名とAPI名が対応しているか見る。',
        },
        {
          label: 'Source map',
          what: '圧縮済みコードと元コードを対応させる補助ファイル。',
          how: '存在するかだけ確認し、CTF問題のヒントになるか見る。',
        },
      ],
      branches: [
        { signal: 'API名が機能名と対応する', targetId: 'web-api', action: 'API呼び出しを見る' },
        { signal: 'JS/CSSに画面構造のヒントがある', targetId: 'web-source', action: 'フロント実装の痕跡を見る' },
        { signal: '読み込み失敗で画面が崩れる', targetId: 'web-error', action: 'Errorを見る' },
      ],
      details: 'Resource観察は、画面の裏にある構成を知るための地図作り。危険な解析ではなく、どこがフロントでどこがサーバかを分ける。',
      next: ['web-api', 'web-source', 'web-error'],
      safety: '機密探索や実サービスの解析に誘導しない。',
    },
  },
  {
    id: 'web-auth',
    type: 'learning',
    position: { x: -280, y: 120 },
    data: {
      title: '認証フローを見る',
      category: 'web',
      level: 1,
      summary: 'ログイン前後の画面、通信、Cookie、リダイレクトの変化を見る。',
      what: '認証フローは、ユーザーが誰かを確認し、ログイン状態を維持し、権限が必要な機能を制御する一連の流れ。',
      intent: '「ログインしたら見える」だけで終わらせず、どの層が状態や権限を見ているか分ける。',
      observe: [
        {
          label: 'ログイン前後の差',
          what: '画面、メニュー、API、Cookieがどう変わるか。',
          how: '同じ操作をログイン前後で比べ、変わった場所だけ見る。',
        },
        {
          label: '401/403',
          what: '認証されていない、または権限がないことを示すstatus。',
          how: '未ログインと権限不足が同じ扱いか別扱いか見る。',
        },
        {
          label: 'ログアウト',
          what: 'ログイン状態を終わらせる処理。',
          how: 'Cookie削除、リダイレクト、API失敗の変化を見る。',
        },
      ],
      branches: [
        { signal: 'Cookieが増減する', targetId: 'web-cookie', action: 'Cookie / Sessionを見る' },
        { signal: '401/403の違いが出る', targetId: 'web-error', action: 'Errorを見る' },
        { signal: 'リダイレクトが状態で変わる', targetId: 'web-header', action: 'Headerを見る' },
      ],
      details: '認証は一つのボタンではなく、Cookie、セッション、API、画面制御の組み合わせ。どの層が境界を担当するかを見る。',
      next: ['web-cookie', 'web-error', 'web-header'],
      safety: '回避方法や改ざん手順は扱わない。',
    },
  },
  {
    id: 'web-input',
    type: 'learning',
    position: { x: -280, y: 240 },
    data: {
      title: 'Inputを見る',
      category: 'web',
      level: 1,
      summary: 'フォーム項目、入力制約、送信先、エラー文からデータ境界を読む。',
      what: 'Inputはユーザーがアプリへ渡すデータ。フォーム、検索欄、ボタン、ファイル選択、URLパラメータなどが入口になる。',
      intent: '何を入れるかではなく、どこで受け取り、どこで拒否し、どこへ送るかを理解する。',
      observe: [
        {
          label: '項目名',
          what: 'フォームやAPIで使われるデータの名前。',
          how: '画面ラベル、name属性、送信データのkeyを見比べる。',
        },
        {
          label: '制約',
          what: '必須、文字数、形式など入力にかかる条件。',
          how: '画面側の制約とサーバ側のエラーが一致するか見る。',
        },
        {
          label: '送信先',
          what: '入力データが送られるURLやAPI。',
          how: '送信ボタンを押した直後に増える通信を見る。',
        },
      ],
      branches: [
        { signal: 'エラー文が項目単位で出る', targetId: 'web-error', action: 'Errorを見る' },
        { signal: '送信通信が見える', targetId: 'web-http', action: 'HTTPを見る' },
        { signal: '入力値がURLに残る', targetId: 'web-param', action: 'Parameterを見る' },
      ],
      details: 'Input観察は、攻撃文字列を入れる作業ではない。アプリがどこでデータを受け取り、どの段階で拒否しているかを見る作業。',
      next: ['web-error', 'web-http', 'web-param'],
      safety: '攻撃文字列例は載せない。',
    },
  },
  {
    id: 'web-error',
    type: 'learning',
    position: { x: -280, y: 360 },
    data: {
      title: 'Errorを見る',
      category: 'web',
      level: 1,
      summary: 'status、文言、表示位置、成功時との差から、どの層で失敗したか読む。',
      what: 'Errorはアプリが拒否や失敗を返した結果。入力検証、認証、認可、内部処理、通信失敗など種類が分かれる。',
      intent: '失敗をただの失敗で終わらせず、どの境界に当たったのかを分類する。',
      observe: [
        {
          label: '文言',
          what: '画面やレスポンスに出るエラーメッセージ。',
          how: 'ユーザー向け文言か、内部名を含む文言か見る。',
        },
        {
          label: 'status',
          what: 'HTTPの失敗分類。',
          how: '400系、401、403、404、500系を分ける。',
        },
        {
          label: '表示位置',
          what: 'エラーが画面全体、フォーム横、トースト、APIだけのどこに出るか。',
          how: '画面とNetworkの両方で同じ失敗が見えるか見る。',
        },
      ],
      branches: [
        { signal: '401/403なら認証境界っぽい', targetId: 'web-auth', action: '認証フローを見る' },
        { signal: 'フォーム項目に紐づく', targetId: 'web-input', action: 'Inputを見る' },
        { signal: 'Headerやstatusだけに出る', targetId: 'web-http', action: 'HTTPを見る' },
      ],
      details: 'エラーはアプリが境界を説明してくれる場所。初心者は文言だけを読むより、status、表示位置、成功時との差を一緒に見ると判断しやすい。',
      next: ['web-auth', 'web-input', 'web-http'],
      safety: '実サービスで試す指示は禁止。',
    },
  },
  {
    id: 'web-cookie',
    type: 'learning',
    position: { x: 240, y: -250 },
    data: {
      title: 'Cookie / Session',
      category: 'web',
      level: 2,
      summary: 'Cookie名、属性、寿命、ログイン前後の差から状態管理の境界を読む。',
      what: 'Cookieはブラウザに保存され、リクエストに添えられる小さな情報。Sessionはサーバ側でログイン状態などを管理する仕組み。',
      intent: 'ブラウザに見える印と、サーバ側で管理される状態を混同しないため。',
      observe: [
        {
          label: 'HttpOnly',
          what: 'JavaScriptからCookieを読ませにくくする属性。',
          how: 'ログインCookieらしきものに付いているか見る。',
        },
        {
          label: 'SameSite',
          what: '別サイトからのリクエストにCookieを送る条件。',
          how: 'Strict、Lax、Noneのどれかを見る。',
        },
        {
          label: '寿命',
          what: 'Cookieがいつまで残るか。',
          how: 'Session Cookieか、Expires/Max-Ageがあるか見る。',
        },
      ],
      branches: [
        { signal: 'ログイン前後でCookieが変わる', targetId: 'web-auth', action: '認証フローへ戻る' },
        { signal: '保存期間が長い', targetId: 'web-cache', action: 'Cacheも見る' },
      ],
      details: 'Cookieは状態のヒントであって、認証そのものとは限らない。名前、属性、画面変化をセットで見ると、状態管理の役割が見えてくる。',
      next: ['web-auth', 'web-cache'],
      safety: '改ざんや再利用の手順は扱わない。',
    },
  },
  {
    id: 'web-cache',
    type: 'learning',
    position: { x: 240, y: -130 },
    data: {
      title: 'Cacheを見る',
      category: 'web',
      level: 2,
      summary: 'Cache-Control、ETag、304から、情報がどこに残るかを見る。',
      what: 'Cacheは、一度受け取ったレスポンスを再利用して速く表示する仕組み。セキュリティ学習では、情報の残り方として見る。',
      intent: '表示された情報がブラウザ、プロキシ、サーバのどこで再利用されるか理解するため。',
      observe: [
        {
          label: 'Cache-Control',
          what: '保存してよいか、再確認が必要かを示すヘッダー。',
          how: 'no-store、no-cache、private、publicの有無を見る。',
        },
        {
          label: 'ETag',
          what: '同じ内容かどうかを確認するための識別子。',
          how: '更新前後で変わるか、304とセットで見る。',
        },
        {
          label: '304',
          what: '前に保存した内容を使ってよいという応答。',
          how: '更新ボタンや再訪問で304が多いか見る。',
        },
      ],
      branches: [
        { signal: '個人情報っぽい画面で保存が強い', targetId: 'web-header', action: 'Headerへ戻る' },
        { signal: '更新しても古い情報が見える', targetId: 'web-http', action: 'HTTPの順序を見る' },
      ],
      details: 'キャッシュは速度のための仕組みだが、学習上は「情報が残る場所」として読むと理解しやすい。',
      next: ['web-header', 'web-http'],
      safety: '他者情報の取得や再利用に繋がる説明はしない。',
    },
  },
  {
    id: 'web-api',
    type: 'learning',
    position: { x: 240, y: 10 },
    data: {
      title: 'API呼び出しを見る',
      category: 'web',
      level: 2,
      summary: 'フロントがどのAPIから何を取って、どのstatusで失敗するかを見る。',
      what: 'APIは、画面がデータを取ったり送ったりするための通信口。画面の裏側でJSONなどをやり取りすることが多い。',
      intent: '画面表示の裏にあるデータ取得単位を掴み、機能境界を読むため。',
      observe: [
        {
          label: 'エンドポイント名',
          what: 'APIのURLやパス。',
          how: '画面名、機能名、一覧/詳細の区別が名前に出ているか見る。',
        },
        {
          label: 'レスポンス形式',
          what: 'JSON、HTML、画像など返ってくるデータの種類。',
          how: 'Content-TypeとPreviewを見て、画面のどこに使われるか対応させる。',
        },
        {
          label: '認証前後の差',
          what: 'ログイン状態でAPIの返答が変わること。',
          how: '同じAPIが未ログインで401/403になるか見る。',
        },
      ],
      branches: [
        { signal: 'API側で401/403になる', targetId: 'web-auth', action: '認証フローを見る' },
        { signal: '画面とAPI名が対応する', targetId: 'web-source', action: 'フロント痕跡を見る' },
        { signal: 'statusの違いが多い', targetId: 'web-error', action: 'Errorを見る' },
      ],
      details: 'API観察は「裏口探し」ではない。画面に出る情報が、どの通信で来ているかを知る作業。CTFではここが次の読み分けポイントになる。',
      next: ['web-auth', 'web-source', 'web-error'],
      safety: '未許可API探索の具体手順にしない。',
    },
  },
  {
    id: 'web-source',
    type: 'learning',
    position: { x: 240, y: 130 },
    data: {
      title: 'フロント実装の痕跡',
      category: 'web',
      level: 2,
      summary: 'JS/CSSの命名、画面構造、読み込み失敗から実装のヒントを見る。',
      what: 'フロント実装の痕跡は、ブラウザに配られたコードやファイル名に残る機能名、route名、コンポーネント名のこと。',
      intent: '画面だけでは見えない機能構造を、配布済みリソースから把握するため。',
      observe: [
        {
          label: 'chunk名',
          what: '分割されたJavaScriptファイルの名前。',
          how: 'login、admin、profileのような機能名が見えるか確認する。',
        },
        {
          label: 'route名',
          what: '画面遷移やページ構造を表す名前。',
          how: 'URLやAPI名と同じ語がないか見る。',
        },
        {
          label: '表示されないUI',
          what: '条件が満たされたときだけ出る画面要素。',
          how: '問題文の範囲で、画面状態とコード上の名前を対応させる。',
        },
      ],
      branches: [
        { signal: 'API名とUI名が対応する', targetId: 'web-api', action: 'API呼び出しを見る' },
        { signal: 'route名が見える', targetId: 'web-route', action: 'Routeを見る' },
      ],
      details: 'フロント実装の痕跡は地図作りの材料。機密探索ではなく、CTFの範囲で構造理解に使う。',
      next: ['web-api', 'web-route'],
      safety: '実サービスの隠し機能探索を促さない。',
    },
  },
  {
    id: 'web-route',
    type: 'learning',
    position: { x: 240, y: -430 },
    data: {
      title: 'Routeを見る',
      category: 'web',
      level: 2,
      summary: 'URLパスと画面の対応から、機能単位と階層を読む。',
      what: 'Routeは、URLのパスと画面や処理を対応させる仕組み。Webアプリの目次に近い。',
      intent: '画面遷移を地図化し、どの単位で観察を深めるか決めるため。',
      observe: [
        {
          label: '階層',
          what: '`/users/123/settings` のような親子関係。',
          how: '上位が機能、下位が詳細や設定になっているか見る。',
        },
        {
          label: '名詞と動詞',
          what: 'users、orders、search、loginのような意味のある語。',
          how: 'データ名なのか操作名なのか分ける。',
        },
        {
          label: 'リダイレクト',
          what: 'アクセス後に別routeへ移動すること。',
          how: '未ログイン、存在しないID、権限不足で移動先が変わるか見る。',
        },
      ],
      branches: [
        { signal: 'IDあり/なしで画面が違う', targetId: 'web-param', action: 'Parameterを見る' },
        { signal: '権限でrouteが変わる', targetId: 'web-auth', action: '認証フローを見る' },
      ],
      details: 'Routeはアプリの目次。名前と階層を読むだけでも、どの機能がどのデータを扱うか見えてくる。',
      next: ['web-param', 'web-auth'],
      safety: '未公開パス総当たりの手順は扱わない。',
    },
  },
  {
    id: 'web-param',
    type: 'learning',
    position: { x: 240, y: -310 },
    data: {
      title: 'Parameterを見る',
      category: 'web',
      level: 2,
      summary: 'クエリやIDらしき値が、表示内容や検索条件にどう関わるか読む。',
      what: 'Parameterは、URLや通信に含まれる値。検索語、ページ番号、ID、並び順など、画面の条件として使われる。',
      intent: 'ユーザー入力として扱われる値を把握し、画面との対応を見るため。',
      observe: [
        {
          label: 'key名',
          what: '`q`、`page`、`sort`、`id` のような値の名前。',
          how: '画面の検索欄や並び替えと対応するか見る。',
        },
        {
          label: '値の形式',
          what: '数字、UUID、日付、文字列などの形。',
          how: '同じ形式の値が他の画面にも出るか見る。',
        },
        {
          label: '画面反映',
          what: '値が表示内容、件数、選択状態に影響すること。',
          how: '値と画面表示の対応だけを読む。',
        },
      ],
      branches: [
        { signal: '検索条件がURLに残る', targetId: 'web-input', action: 'Inputを見る' },
        { signal: 'IDがrouteの一部になっている', targetId: 'web-route', action: 'Routeを見る' },
      ],
      details: 'Parameterは観察対象。操作手順ではなく、画面と値の対応を読む。初心者はkey名、形式、画面反映の3つに分けるとよい。',
      next: ['web-input', 'web-route'],
      safety: '攻撃的な値の例示はしない。',
    },
  },
  ...categories
    .filter((category): category is Category & { id: Exclude<CategoryId, 'web'> } => category.id !== 'web')
    .map((category, index) => ({
      id: category.rootNodeId,
      type: 'learning',
      position: {
        x: -760,
        y: (index - 2) * 150,
      },
      data: {
        ...categorySeeds[category.id],
        title: category.title,
        category: category.id,
      },
    })),
];

const edgePairs = [
  ['web-root', 'web-url', 'URL'],
  ['web-root', 'web-http', 'HTTP'],
  ['web-root', 'web-header', 'Header'],
  ['web-root', 'web-resource', 'Resource'],
  ['web-root', 'web-auth', 'Auth'],
  ['web-root', 'web-input', 'Input'],
  ['web-root', 'web-error', 'Error'],
  ['web-url', 'web-route', 'Route'],
  ['web-url', 'web-param', 'Parameter'],
  ['web-url', 'web-auth', 'Auth'],
  ['web-http', 'web-header', 'Header'],
  ['web-http', 'web-error', 'Error'],
  ['web-http', 'web-input', 'Input'],
  ['web-header', 'web-cookie', 'Cookie'],
  ['web-header', 'web-cache', 'Cache'],
  ['web-header', 'web-url', 'URL'],
  ['web-resource', 'web-api', 'API'],
  ['web-resource', 'web-source', 'Source'],
  ['web-resource', 'web-error', 'Error'],
  ['web-auth', 'web-cookie', 'Cookie'],
  ['web-auth', 'web-error', 'Error'],
  ['web-auth', 'web-header', 'Header'],
  ['web-input', 'web-error', 'Error'],
  ['web-input', 'web-http', 'HTTP'],
  ['web-input', 'web-param', 'Parameter'],
  ['web-error', 'web-auth', 'Auth'],
  ['web-error', 'web-input', 'Input'],
  ['web-error', 'web-http', 'HTTP'],
  ['web-cookie', 'web-auth', 'Auth'],
  ['web-cookie', 'web-cache', 'Cache'],
  ['web-cache', 'web-header', 'Header'],
  ['web-cache', 'web-http', 'HTTP'],
  ['web-api', 'web-auth', 'Auth'],
  ['web-api', 'web-source', 'Source'],
  ['web-api', 'web-error', 'Error'],
  ['web-source', 'web-api', 'API'],
  ['web-source', 'web-route', 'Route'],
  ['web-route', 'web-param', 'Parameter'],
  ['web-route', 'web-auth', 'Auth'],
  ['web-param', 'web-input', 'Input'],
  ['web-param', 'web-route', 'Route'],
] as const;

export const learningEdges: Edge[] = edgePairs.map(([source, target, label]) => ({
  id: `${source}-${target}`,
  source,
  target,
  label,
  animated: false,
  type: 'smoothstep',
}));

export function getNode(id: string) {
  return learningNodes.find((node) => node.id === id);
}

export function getCategory(id: CategoryId) {
  return categories.find((category) => category.id === id)!;
}
