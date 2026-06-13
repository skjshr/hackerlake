import type { Edge, Node } from '@xyflow/react';

export type CategoryId = 'web' | 'network' | 'forensics' | 'crypto' | 'reverse' | 'pwn';

export const attackPhases = ['偵察', '列挙', '侵入', '権限昇格', '維持・痕跡消去'] as const;
export type AttackPhase = (typeof attackPhases)[number];

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
  phase: AttackPhase;
  level: number;
  flowRelation?: '現在地' | '同じ段階' | '次の段階' | '前提確認';
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
  englishTitle: string;
  subtitle: string;
  rootNodeId: string;
  color: string;
  what: string;
  choose: string;
};

type NodeSeed = {
  id: string;
  title: string;
  summary: string;
  what: string;
  intent: string;
  details: string;
  observe: Observation[];
  safety: string;
};

type PhasePlan = {
  phase: AttackPhase;
  nodes: NodeSeed[];
};

type CategoryPlan = {
  id: CategoryId;
  title: string;
  englishTitle: string;
  subtitle: string;
  color: string;
  what: string;
  choose: string;
  phases: PhasePlan[];
};

const sharedSafety =
  '許可されたCTF、自分の教材環境、自分が管理する検証環境だけで扱う。実サービス、第三者環境、認証情報の再利用、隠蔽、回避、破壊に進まない。';

const categoryPlans: CategoryPlan[] = [
  {
    id: 'web',
    title: 'ウェブ',
    englishTitle: 'Web',
    subtitle: '画面・HTTP・状態管理を読む',
    color: '#78a05f',
    what:
      'ブラウザに見える画面、URL、HTTP通信、Cookie、API、入力、エラーを分解して読むジャンル。最初に学ぶと、CTF全体の「入口の見つけ方」が身につく。',
    choose: '画面、ログイン、フォーム、API、CookieのようなWebアプリの挙動を読みたいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'surface-map',
            title: '画面と機能の全体像',
            summary: 'ページ、フォーム、検索、ログイン、アップロード、管理系リンクを地図にする。',
            what:
              'Web問題の最初の観察。画面は単なる見た目ではなく、URL、HTTP、Cookie、JavaScript、API、入力フォーム、エラー処理が重なった結果として出ている。',
            intent: '攻撃できそうな場所ではなく、アプリの役割、入力、出力、状態変化を先に分けるため。',
            details:
              '初心者が詰まりやすいのは、見えたフォームやボタンにすぐ飛びつくこと。まずページごとに「何を表示するか」「何を送るか」「ログイン前後で何が変わるか」を短くメモする。これだけで次にURLを見るのか、HTTPを見るのか、認証を見るのかが選べる。',
            observe: [
              { label: '入口', what: 'ユーザーが操作できる場所。', how: 'リンク、フォーム、ボタン、検索欄、ファイル選択を画面単位で見る。' },
              { label: '入力', what: 'アプリへ渡す値。', how: 'URL、フォーム項目、チェックボックス、選択肢の名前を読む。' },
              { label: '状態変化', what: '操作前後で残る情報。', how: 'ログイン前後、保存前後、更新後に画面と通信がどう変わるか見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'public-clues',
            title: '公開情報と構成の把握',
            summary: 'ヘッダー、エラー、静的ファイル、Cookie属性から技術構成の仮説を作る。',
            what:
              '画面本文以外に出る情報。Serverらしき表示、Cookie属性、静的ファイル名、エラー文、リダイレクト先などが含まれる。',
            intent: '脆弱性名に飛びつく前に、どの層を観察すべきか絞るため。',
            details:
              '構成把握は断定ではなく仮説作り。たとえばCookieが増えるなら状態管理、Locationが出るなら遷移、エラー文が詳しいなら入力や内部処理を見る。見えた語を「根拠」として残すと、手順書なぞりから脱出しやすい。',
            observe: [
              { label: '技術ヒント', what: 'フレームワークや実装方式を示す痕跡。', how: 'レスポンス、HTML、静的ファイル名、エラー画面の語を見る。' },
              { label: 'Cookie', what: '認証やセッションに関係する保存値。', how: '発行タイミング、HttpOnly、SameSite、Secureの有無を見る。' },
              { label: 'エラー', what: '失敗時に出る画面やHTTP status。', how: '通常操作の範囲で、文言とstatusの差を読む。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'input-inventory',
            title: '入力面の分類',
            summary: '検索、コメント、プロフィール、URLパラメータ、アップロード欄を役割別に分ける。',
            what: 'ユーザーが値を渡せる面。フォームだけでなく、URL、Cookie、API payload、ファイル名も入力になる。',
            intent: '検証対象を増やす前に、どの入力がどの処理へ渡るか理解するため。',
            details:
              '列挙は数を増やす作業ではなく分類。入力が一時表示なのか、保存されるのか、検索条件になるのか、別の画面へ渡るのかを見る。入力から出力までの経路を言語化できると、次の観察が自分で選べる。',
            observe: [
              { label: '反映位置', what: '入力がどこに表示されるか。', how: '無害な短い識別語で、画面・URL・レスポンスのどこに出るか見る。' },
              { label: '保存有無', what: '一時表示か永続保存か。', how: '再読み込み、別画面、ログインし直しで残るか確認する。' },
              { label: '制限', what: '長さ、形式、必須条件。', how: 'UI表示とサーバ側エラーの差を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'auth-diff',
            title: '認証後の機能差分',
            summary: '未ログイン、一般ユーザー、別ロールで見える機能と応答を比べる。',
            what: '認証状態やロールによって変わる画面、API、ボタン、リダイレクト、エラー。',
            intent: '認証と認可の境界を混同せず、どこでチェックされるか見るため。',
            details:
              'ログインしたら見える、という理解で止めない。画面に出るか、APIが返すか、操作だけ拒否されるかを分ける。UIで隠れているだけなのか、サーバが拒否しているのかが重要。',
            observe: [
              { label: '表示差分', what: 'メニューやボタンの違い。', how: '状態ごとに同じページを見比べる。' },
              { label: '応答差分', what: '許可、拒否、リダイレクトの違い。', how: '同じ操作でstatusやLocationが変わるか見る。' },
              { label: '資源ID', what: '投稿、注文、プロフィールなどの識別子。', how: 'URLやAPI応答に出るIDと画面内容を対応させる。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'auth-boundary',
            title: '認証境界の確認',
            summary: 'ログイン状態の成立、失効、保護ページの扱いを見る。',
            what: 'ログインにより発行されるCookie、セッション、リダイレクト、401/403応答。',
            intent: '認証済みかどうかを画面ではなくサーバ応答で判断するため。',
            details:
              '侵入フェーズといっても、ここでは突破手順ではなく境界理解を扱う。ログイン前後、ログアウト後、期限切れ、保護ページの応答を比べると、アプリが何を信頼しているか見えてくる。',
            observe: [
              { label: '発行', what: 'ログイン時に増える状態。', how: 'Cookie、画面、API応答がログイン前後でどう変わるか見る。' },
              { label: '失効', what: 'ログアウト後に消える状態。', how: 'ログアウト後の更新、戻る、同じURL再訪問の反応を見る。' },
              { label: '保護', what: '未認証アクセスの扱い。', how: '未ログイン時のstatus、リダイレクト、表示差分を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'input-inconsistency',
            title: '入力処理の不整合',
            summary: '入力の検証、保存、表示でルールが一貫しているか見る。',
            what: 'ブラウザ側制限、サーバ側検証、保存時処理、表示時処理のズレ。',
            intent: '脆弱性カテゴリの入口になる「処理のズレ」を安全に理解するため。',
            details:
              '脆弱性名を覚える前に、入力、処理、出力のどこで差が出たかを見る。画面では拒否されるのにサーバでは受ける、保存時と表示時で扱いが変わる、成功時と失敗時で文脈が違う、という観察が手札になる。',
            observe: [
              { label: '検証位置', what: 'ブラウザだけかサーバも見るか。', how: '通常操作で出るエラーの場所と通信結果を比べる。' },
              { label: '正規化', what: '空白、大小文字、形式の扱い。', how: '無害な表記ゆれで、同じ値として扱われるか見る。' },
              { label: '出力変換', what: '表示時に文字がどう変わるか。', how: '記号を含む無害な文字列で、表示文脈だけ確認する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'owner-boundary',
            title: '所有者境界',
            summary: '自分の資源と他者の資源をサーバが区別しているか見る。',
            what: '投稿、プロフィール、注文、メモ、添付ファイルなど、所有者があるデータの境界。',
            intent: '認証済みであることと、その資源を操作できることは別だと理解するため。',
            details:
              '重要なのはIDの形ではなく、アクセス時に所有者確認があるか。画面に見えない資源でも、APIやURLではIDが出ることがある。CTFでは配布された範囲内で、所有者と操作権限の対応を読む。',
            observe: [
              { label: '識別子', what: '資源を指すIDや名前。', how: 'URL、API応答、画面表示のIDを対応させる。' },
              { label: '操作権限', what: '閲覧、編集、削除の違い。', how: '自分の資源で許可される操作を整理する。' },
              { label: '拒否方法', what: '権限不足時の応答。', how: '許可された比較アカウントやロールでstatusと文言を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'role-admin',
            title: 'ロールと管理機能',
            summary: '管理者向け機能がどの条件で見え、どの条件で実行できるか見る。',
            what: '管理画面、承認、設定変更、ユーザー管理など、通常ユーザーより強い権限を持つ機能。',
            intent: '権限の粒度とチェック位置を理解するため。',
            details:
              '管理機能は、入口が見えるか、内容が読めるか、操作が実行できるかを分ける。表示だけ隠す設計と、サーバで実行を拒否する設計は違う。監査履歴があるなら、次の痕跡フェーズにつながる。',
            observe: [
              { label: '入口', what: '管理機能への導線。', how: 'メニュー、URL構造、リダイレクトの差を見る。' },
              { label: '実行可否', what: '表示と操作の差。', how: '許可ロールごとの応答を比べる。' },
              { label: '監査情報', what: '変更者や時刻の記録。', how: '操作後の履歴やログ表示を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'state-persistence',
            title: '状態の持続点',
            summary: 'アプリがどこに状態を残すかを防御・学習目的で把握する。',
            what: 'セッション、Remember設定、APIトークン、保存済み設定など、時間をまたいで残る情報。',
            intent: '永続化の仕組みと、状態が残ることによるリスクを理解するため。',
            details:
              'ここでは永続化する方法ではなく、どこに状態が残り得るかを読む。ブラウザ、サーバ、DB、ログ、キャッシュのどこに残るかを区別できると、守る側の視点も作れる。',
            observe: [
              { label: '保存場所', what: 'ブラウザ、サーバ、DBのどこか。', how: 'ログイン維持、設定反映、再訪問時の状態を見る。' },
              { label: '期限', what: '状態がいつ消えるか。', how: 'ログアウト、期限表示、Cookie寿命を見る。' },
              { label: '取消', what: '無効化や削除の方法。', how: '設定画面、ログアウト、履歴で状態が消えるか見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'audit-log',
            title: 'ログと変更履歴',
            summary: '操作がどう記録され、検知・復旧にどう使えるか見る。',
            what: 'アクセスログ、監査ログ、更新履歴、エラー記録。',
            intent: '痕跡消去ではなく、痕跡の意味と守り方を学ぶため。',
            details:
              'このフェーズは攻撃者視点の隠蔽ではなく、防御・フォレンジック視点で扱う。誰が、いつ、何を、どう変えたかを時系列にできると、問題解決だけでなくレポート力にもつながる。',
            observe: [
              { label: '記録対象', what: 'ログイン、閲覧、変更、失敗。', how: '許可された管理画面、問題ログ、CTFヒントを見る。' },
              { label: '記録内容', what: '時刻、ユーザー、操作、結果。', how: '履歴項目の粒度と欠けている情報を確認する。' },
              { label: '復旧材料', what: '元に戻すための情報。', how: '変更前後の差分、バックアップ、監査証跡を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
  {
    id: 'network',
    title: 'ネットワーク',
    englishTitle: 'Network',
    subtitle: '到達性・サービス・境界を読む',
    color: '#4f93a5',
    what:
      'ホスト、サービス、名前解決、応答差分、内部外部の境界を読むジャンル。画面がない対象でも、何が返るかから状況を組み立てる。',
    choose: 'ポート、プロトコル、名前解決、到達性、内部ネットワークっぽい問題を整理したいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'scope',
            title: '対象範囲の確認',
            summary: '何を見てよいかを先に固定し、対象外を見ない判断を作る。',
            what: 'IP範囲、ホスト名、CTFルール、禁止事項、flag条件。',
            intent: '観察対象を絞り、誤爆と認知負荷を減らすため。',
            details:
              'Networkの最初はスキャンではなく範囲確認。対象ホストが1つか、複数セグメントか、名前解決があるか、CTFルールで禁止されている行為がないかを読む。範囲外を見ない判断もスキル。',
            observe: [
              { label: '範囲', what: '許可されたCIDR、ホスト、ドメイン。', how: '問題文、配布資料、接続情報を読む。' },
              { label: '制約', what: '禁止行為や想定ツール。', how: 'ルール欄、注意文、環境説明を確認する。' },
              { label: 'ゴール', what: 'flag条件や到達条件。', how: '何を証明すればよい問題かを先に言語化する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'topology',
            title: 'ネットワーク構造の把握',
            summary: '通信の入口、名前、経路、外部/内部の境界を読む。',
            what: 'ホスト名、FQDN、到達性、ルーティング、内部向け表現。',
            intent: '次にサービス列挙をするのか、名前解決を見るのか、境界を見るのか決めるため。',
            details:
              'ネットワーク問題は「見えているホスト」だけではなく「見えていない境界」が重要。名前、応答、内部語、管理系っぽい表現から、問題の地形を作る。',
            observe: [
              { label: '名前', what: 'ホスト名やFQDN。', how: '問題文、DNS設定、配布ファイル内の名前を見る。' },
              { label: '到達性', what: '応答の有無。', how: '許可された範囲の確認結果だけを見る。' },
              { label: '境界', what: '外部、内部、管理系の分離。', how: '図、ルーティング情報、ヒント、命名を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'services',
            title: 'サービス面の整理',
            summary: '開いている入口を、番号ではなく役割で分類する。',
            what: 'Web、SSH、FTP、SMB、DNS、メール系、管理系などのサービス。',
            intent: 'サービスごとに観察ポイントが違うため、次の選択肢を分ける。',
            details:
              '列挙は量より整理。サービス名、役割、露出理由、違和感をメモする。古い表記、test、dev、backupのような語は、攻撃ではなく仮説の材料として扱う。',
            observe: [
              { label: '役割', what: 'そのサービスが何を提供するか。', how: 'バナー、画面、プロトコル名、問題文を対応させる。' },
              { label: '露出', what: '外向き、内向き、管理用の違い。', how: 'ポート番号と応答内容を照合する。' },
              { label: '違和感', what: '古い表記、テスト名、debug語。', how: '応答文、エラー文、共有名を読む。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'info-leak',
            title: '情報漏れの観察',
            summary: '公開情報から、構成や認証面の仮説を作る。',
            what: 'バージョン、設定名、ユーザー名、共有名、エラー、内部名。',
            intent: '既知リスク名に飛ぶ前に、見えた情報の役割を説明できるようにするため。',
            details:
              '情報漏れは「何か出た」で終わらせない。ユーザー名なのか、ホスト名なのか、設定名なのか、共有名なのかを分類する。役割が分かると、侵入フェーズで何を確認すべきか決まる。',
            observe: [
              { label: '識別子', what: 'ユーザー名、ホスト名、部署名。', how: 'ページ、共有、応答文、証明書表示を読む。' },
              { label: '構成', what: 'OS、ミドルウェア、認証方式。', how: '表示情報と問題文を照合する。' },
              { label: '漏れ語', what: 'backup、old、test、dev。', how: '許可範囲の表示や一覧から探す。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'entry-hypothesis',
            title: '入口仮説の検証',
            summary: '列挙結果から、CTF上の想定入口を根拠つきで見極める。',
            what: '認証、公開ファイル、設定ミス、入力面、内部到達性。',
            intent: '試す前に、何が成功条件で何が不足情報かを言語化するため。',
            details:
              '入口仮説は「ここが怪しい」では足りない。なぜ怪しいのか、何があれば進めるのか、どの情報が足りないのかを書く。これにより無関係なサービスを触り続ける時間を減らせる。',
            observe: [
              { label: '入口', what: 'ログイン、共有、API、管理画面。', how: '画面や応答の機能を分類する。' },
              { label: '根拠', what: 'なぜそこを見るのか。', how: '列挙メモ、問題文、エラーを照合する。' },
              { label: '条件', what: '必要なユーザー、鍵、内部到達性。', how: '不足情報を一覧化する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'network-auth-boundary',
            title: '認証と権限境界',
            summary: '入れた/入れないではなく、誰として何が見えるかを見る。',
            what: '認証成功、権限、アクセス可能範囲、拒否される操作。',
            intent: '侵入後の観察範囲を限定し、権限昇格の材料を分けるため。',
            details:
              'ネットワーク系では、接続できたことと権限があることは別。主体、見える範囲、拒否される範囲を分けることで、次にローカル状態を見るのか、信頼関係を見るのか判断できる。',
            observe: [
              { label: '主体', what: '現在のユーザーやロール。', how: '画面表示、プロンプト、設定表示を見る。' },
              { label: '範囲', what: '読める場所、操作できる機能。', how: '許可された範囲で一覧を見る。' },
              { label: '制限', what: '拒否される操作。', how: 'エラーや権限表示を読む。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'local-state',
            title: 'ローカル状態の棚卸し',
            summary: '現在の権限で見える設定、サービス、ファイル権限を整理する。',
            what: 'ユーザー、グループ、サービス、設定、読める/書ける/実行できる場所。',
            intent: '強い権限の処理に弱い権限が影響できるかを読むため。',
            details:
              '権限昇格は魔法ではなく、権限の境界を見る問題。どの処理が強い権限で動き、どの設定やファイルに弱い権限で触れるかを見る。実環境ではなくCTF内の理解に限定する。',
            observe: [
              { label: '身分', what: '現在のユーザーと所属。', how: 'CTF環境内の表示や設定を見る。' },
              { label: '実行物', what: '動いているサービスやタスク。', how: '許可された管理情報を見る。' },
              { label: '権限', what: '読める、書ける、実行できる場所。', how: 'ファイル属性や設定表示を確認する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'trust',
            title: '信頼関係の確認',
            summary: 'ネットワーク内で誰が誰を信頼しているか見る。',
            what: '鍵、トークン、共有、内部API、サービス間通信。',
            intent: '権限や到達範囲が広がる理由を理解するため。',
            details:
              'Networkの権限昇格では、OS権限だけでなくサービス間の信頼が重要。設定に出る宛先、資格情報の用途、内部専用の名前を読み、どの主体がどこへ行けるのか整理する。',
            observe: [
              { label: '資格情報', what: '鍵、設定値、トークンの存在。', how: '許可されたファイルや環境情報を見る。' },
              { label: '宛先', what: '接続先ホストやサービス。', how: '設定内のURLやホスト名を見る。' },
              { label: '権限', what: 'その資格情報が何を許すか。', how: '問題文とサービス挙動を照合する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'persistence-concept',
            title: '維持の概念理解',
            summary: '永続化手順ではなく、維持が検知される理由を学ぶ。',
            what: 'セッション、再接続条件、自動実行、変更点。',
            intent: '防御側の観点で、不自然な継続性と検知点を理解するため。',
            details:
              'このノードは「どう残るか」を攻撃手順として扱わない。CTFで示される状態、プロセス、設定変更、接続条件を読み、何が痕跡になり得るかを知る。',
            observe: [
              { label: '状態', what: 'ログイン中、プロセス、接続。', how: 'CTF環境の管理表示や問題ログを見る。' },
              { label: '変更', what: '作成・更新された設定やファイル。', how: 'タイムスタンプと差分を見る。' },
              { label: '依存', what: '維持に必要な権限や経路。', how: '前フェーズのメモと照合する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'network-trace',
            title: '痕跡の読み方',
            summary: '消すのではなく、何が痕跡になるかを理解する。',
            what: 'ログ、認証記録、ファイル更新、ネットワーク接続。',
            intent: '検知、復旧、説明に必要な情報を読むため。',
            details:
              '痕跡は時系列、主体、対象、結果で整理する。未知の接続先、不自然な時刻、重要ファイル変更などを見つけたら、列挙や構造把握に戻って意味を確認する。',
            observe: [
              { label: '認証', what: '誰がいつ入ったか。', how: 'CTF提供ログや監査画面を見る。' },
              { label: '操作', what: '作成、変更、実行されたもの。', how: '履歴や差分を見る。' },
              { label: '通信', what: 'どこへ接続したか。', how: '許可されたログやパケット資料を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
  {
    id: 'forensics',
    title: 'フォレンジック',
    englishTitle: 'Forensics',
    subtitle: 'ファイル・ログ・時系列を復元する',
    color: '#b88645',
    what:
      '残されたファイル、ログ、メタデータ、通信記録から「何が起きたか」を組み立てるジャンル。攻撃ではなく調査と説明力が中心。',
    choose: 'pcap、ログ、画像、zip、メモリ、時刻、改ざん痕跡の問題を読みたいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'artifact-scope',
            title: '証拠物の棚卸し',
            summary: '渡されたファイル、ログ、画像、pcapの種類と関係を確認する。',
            what: '問題で配布された証拠物の一覧と種類。',
            intent: 'いきなり中身を読む前に、どの順番で調べるか決めるため。',
            details:
              'Forensicsは最初の棚卸しが弱いと迷子になる。ファイル名、サイズ、拡張子、実形式、作成時刻、問題文のゴールをまとめ、調査対象を地図化する。',
            observe: [
              { label: '種類', what: '画像、ログ、pcap、圧縮、メモリなど。', how: '拡張子と実形式の両方を見る。' },
              { label: '関係', what: '複数ファイルのつながり。', how: '名前、時刻、ID、問題文の語を対応させる。' },
              { label: 'ゴール', what: 'flag条件や復元対象。', how: '何を証明すればよいか一文にする。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'metadata-first',
            title: 'メタデータを見る',
            summary: '本文の前に、時刻、作成者、形式、ツール痕跡を読む。',
            what: 'ファイル本体とは別に付く属性情報。',
            intent: '直接中身を読まなくても分かる手がかりを拾うため。',
            details:
              'メタデータは、作成時刻、編集時刻、撮影情報、生成ツール、圧縮情報などを含む。中身を開く前に見ることで、時系列や改ざんの仮説が立つ。',
            observe: [
              { label: '時刻', what: '作成・更新・アクセスの時間。', how: '問題文の時刻と矛盾しないか見る。' },
              { label: '作成元', what: '作者、端末、ツール名。', how: 'メタデータの語とファイル内容を照合する。' },
              { label: '形式', what: '実際のファイル形式。', how: '拡張子ではなく識別結果を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'timeline',
            title: '時系列の組み立て',
            summary: 'ログやメタデータを時間順に並べ、出来事の流れを作る。',
            what: '誰が、いつ、何を、どこで、どうしたかの並び。',
            intent: '単発の怪しい行ではなく、前後関係で判断するため。',
            details:
              '時系列はForensicsの骨格。ログ行、ファイル時刻、通信時刻を同じ基準で並べる。タイムゾーンや秒単位のズレも、問題によっては重要な手がかりになる。',
            observe: [
              { label: '基準時刻', what: 'タイムゾーンと形式。', how: 'JST/UTC、秒/ミリ秒、日付形式を確認する。' },
              { label: '主体', what: 'ユーザー、IP、プロセス、端末。', how: '同じ識別子で行をまとめる。' },
              { label: '前後', what: '発生順と因果関係。', how: 'ログイン、操作、エラー、通信を並べる。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'hidden-data',
            title: '隠れたデータの候補',
            summary: '削除済み、埋め込み、圧縮、別形式の可能性を見る。',
            what: '見た目には出ないが、ファイル内部や構造上に残る情報。',
            intent: '文字列検索だけで終わらず、形式ごとの読み方へ進むため。',
            details:
              '隠れたデータは「秘密を暴く」ではなく、CTFで用意された構造を読む練習。画像ならメタデータや末尾、zipなら中身とコメント、pcapならストリームなど、形式ごとに観察面が違う。',
            observe: [
              { label: '構造', what: 'ヘッダー、末尾、内部ディレクトリ。', how: '形式に合ったビューで見る。' },
              { label: '圧縮', what: 'zip、gzip、tarなどの入れ物。', how: '中身、コメント、階層を見る。' },
              { label: '埋め込み', what: '別ファイルや文字列の混入。', how: 'サイズ、マジックバイト、違和感を確認する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'incident-entry',
            title: '侵入点の推定',
            summary: 'ログや通信から、最初に何が起きたかを推定する。',
            what: '最初の失敗、成功ログイン、怪しい通信、ファイル作成。',
            intent: '被害の始まりを見つけ、後続の動きを説明するため。',
            details:
              'Forensicsでの侵入は、実際に入ることではなく「どこから始まったか」を読むこと。最初の異常な時刻、初回の成功、直前の失敗、初めて現れたIPやユーザーを探す。',
            observe: [
              { label: '初出', what: '最初に現れた識別子。', how: 'IP、ユーザー、ファイル名の初回時刻を見る。' },
              { label: '成功', what: '認証成功やアクセス成功。', how: '失敗の連続後の成功を確認する。' },
              { label: '直後', what: '侵入後に続く操作。', how: 'ファイル取得、実行、設定変更を時系列で見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'evidence-link',
            title: '証拠のつながり',
            summary: 'ログ、ファイル、通信の同じ出来事を結びつける。',
            what: '同じ時刻、同じID、同じIP、同じファイル名でつながる証拠。',
            intent: 'ひとつの証拠だけで断定せず、複数根拠で説明するため。',
            details:
              '良い調査は「このログがあるから」ではなく、複数の証拠が同じ出来事を指す。通信ログ、ファイル時刻、アプリログを接続できると、解答だけでなく説明が強くなる。',
            observe: [
              { label: '共通キー', what: 'IP、ユーザー、セッション、ファイル名。', how: '複数ファイルで同じ値を探す。' },
              { label: '時刻差', what: '出来事同士の間隔。', how: '秒単位、分単位で前後を見る。' },
              { label: '矛盾', what: '証拠同士が合わない点。', how: '時刻、形式、主体のズレを残す。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'privilege-evidence',
            title: '権限変化の痕跡',
            summary: '誰の権限で何が実行されたかを見る。',
            what: 'ユーザー切替、管理者操作、権限付きファイル、サービス実行。',
            intent: '被害がどの権限まで進んだか説明するため。',
            details:
              'Forensicsの権限昇格は、昇格方法を再現することではなく、権限が変わった証拠を読むこと。実行主体、作成ファイルの所有者、ログのユーザー名をつなぐ。',
            observe: [
              { label: '主体変化', what: 'ユーザーやプロセスの変化。', how: 'ログ上の実行者や所有者を見る。' },
              { label: '高権限操作', what: '管理者権限が必要な変更。', how: '設定変更、サービス変更、権限変更を探す。' },
              { label: '影響範囲', what: 'どこまで読めた/変えたか。', how: 'ファイル、ログ、通信の範囲を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'scope-impact',
            title: '影響範囲の整理',
            summary: 'どのデータ、ユーザー、システムが影響を受けたか分ける。',
            what: '閲覧、変更、削除、外部送信の可能性。',
            intent: 'flagだけでなく、調査レポートとして説明するため。',
            details:
              '影響範囲は「何か起きた」ではなく、対象、操作、結果で書く。CTFではflagにつながるだけでなく、現実のインシデント対応に近い考え方を練習できる。',
            observe: [
              { label: '対象', what: 'ファイル、アカウント、データ。', how: 'アクセスされた名前やIDを見る。' },
              { label: '操作', what: '閲覧、変更、削除、送信。', how: 'ログの動詞やstatusを読む。' },
              { label: '根拠', what: '影響を示す証拠。', how: '時刻、主体、対象をセットにする。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'persistence-artifacts',
            title: '持続化痕跡の読み方',
            summary: '自動実行、設定変更、定期実行の痕跡を防御視点で読む。',
            what: 'サービス登録、起動設定、タスク、設定ファイル変更。',
            intent: '持続化手順ではなく、持続化が残す証拠を理解するため。',
            details:
              'ここでは「残す方法」ではなく「残る場所」を扱う。起動時実行、定期実行、設定変更、ファイル作成時刻などを見て、何が不自然かを説明する。',
            observe: [
              { label: '自動実行', what: '起動時や定期的に動くもの。', how: 'CTF提供ログや設定表示を見る。' },
              { label: '変更時刻', what: '設定が変わった時間。', how: '侵入時刻との近さを見る。' },
              { label: '実行主体', what: '誰の権限で動くか。', how: '所有者、サービス名、ログ主体を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'trace-integrity',
            title: 'ログ欠損と改ざん兆候',
            summary: '消された手順ではなく、欠けたログや不自然な時系列を見る。',
            what: 'ログの空白、時刻の飛び、連番欠落、形式の違い。',
            intent: '痕跡消去の具体手順ではなく、検知の観点を持つため。',
            details:
              'ログがないことも情報になる。急な空白、連番の飛び、同じ形式でない行、時刻の逆転を見つけたら、隠蔽方法ではなく「なぜ不自然か」を説明する。',
            observe: [
              { label: '空白', what: '記録が途切れている時間。', how: '通常周期と比べる。' },
              { label: '連番', what: 'IDや行番号の欠落。', how: '前後の番号を確認する。' },
              { label: '形式差', what: '一部だけ書式が違う行。', how: '同じログ種別の他行と比べる。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
];

const extraCategoryPlans: CategoryPlan[] = [
  {
    id: 'crypto',
    title: 'クリプト',
    englishTitle: 'Crypto',
    subtitle: '形式・前提・弱い使い方を読む',
    color: '#8a72b0',
    what:
      '暗号文、鍵、乱数、署名、ハッシュ、エンコードの形式と前提を読むジャンル。計算に入る前の整理が勝ち筋になる。',
    choose: 'RSA、XOR、ハッシュ、エンコード、乱数、署名など、値と方式の関係を読みたいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'given-values',
            title: '与えられた値の整理',
            summary: '暗号文、公開鍵、ハッシュ、ヒント、形式を表にする。',
            what: '問題で見えている値と、まだ隠れている値の切り分け。',
            intent: '何を計算すべきかの前に、何が材料かを確定するため。',
            details: 'Cryptoは式に飛びつくと迷子になる。値の長さ、形式、繰り返し、同じ値の再利用、問題文の語を並べるだけで方式候補が絞れる。',
            observe: [
              { label: '長さ', what: '値の文字数やbit感。', how: '暗号文、鍵、ハッシュの長さを比べる。' },
              { label: '文字種', what: 'hex、base64、数字列など。', how: '使われている文字と区切りを見る。' },
              { label: '繰り返し', what: '同じ値や同じブロック。', how: '複数の値を横に並べて差分を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'assumption-map',
            title: '秘密と前提の地図',
            summary: '鍵、乱数、平文、方式、公開情報を分ける。',
            what: '暗号が安全であるために隠れているべきものと、公開されてよいもの。',
            intent: 'どの前提が崩れているかを見つけるため。',
            details: '秘密鍵がない、乱数が弱い、同じ鍵が再利用される、平文の一部が分かるなど、Crypto問題は前提の崩れが入口になりやすい。',
            observe: [
              { label: '秘密', what: '鍵、乱数、平文。', how: '問題文で隠されている値を列挙する。' },
              { label: '公開', what: '公開鍵、暗号文、ハッシュ。', how: '見えてよい値と見えている値を分ける。' },
              { label: '方式', what: 'RSA、AES、XOR、Hashなど。', how: '問題文の語と値の形から候補を絞る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'encoding-layers',
            title: 'エンコード層の切り分け',
            summary: '暗号とエンコード、圧縮、表記変換を混同しない。',
            what: 'base64、hex、URL encode、文字コード、圧縮など。',
            intent: '暗号を解く前に、ただの表記変換を外すため。',
            details: '初心者は読めない文字列を全部暗号だと思いがち。文字種、末尾記号、長さ、デコード後の形式を見て、暗号処理と表記変換を分ける。',
            observe: [
              { label: '文字種', what: '使われる文字の範囲。', how: 'hexっぽいかbase64っぽいか見る。' },
              { label: '層', what: '何回変換されていそうか。', how: '変換後の先頭やマジックバイトを見る。' },
              { label: '意味', what: '変換後が文、ファイル、別の値か。', how: '読める形になったか確認する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'weak-patterns',
            title: '弱い使い方の候補',
            summary: '方式そのものではなく、使い方の弱さを探す。',
            what: '鍵再利用、乱数再利用、短い秘密、既知平文、同じ入力の同じ出力。',
            intent: '典型問題を「名前」ではなく条件で見分けるため。',
            details: 'Cryptoの列挙は、方式名の暗記より条件の確認。複数暗号文、同じprefix、同じnonceらしき値、短い鍵候補など、問題がくれる構造を読む。',
            observe: [
              { label: '再利用', what: '鍵、nonce、乱数の使い回し。', how: '複数データで同じ部分がないか見る。' },
              { label: '短さ', what: '秘密値の探索空間が小さいこと。', how: '問題文の制約や値の長さを見る。' },
              { label: '既知部分', what: '平文の一部が推測できること。', how: 'flag形式や定型文との関係を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'solve-path',
            title: '解法仮説の選択',
            summary: '条件に合う解法カテゴリを選ぶ。',
            what: '変換、復号、鍵推定、構造利用、衝突、署名検証のどれか。',
            intent: '手順書の丸写しではなく、条件から次手を選ぶため。',
            details: 'この段階では、具体的な攻撃コードではなく「なぜその方向か」を説明できることが重要。値が短いから探索、同じnonceだから再利用、公開鍵だから数論、のように根拠を持つ。',
            observe: [
              { label: '条件一致', what: '典型問題の前提に合うか。', how: '列挙した弱さと解法カテゴリを対応させる。' },
              { label: '必要材料', what: '追加で必要な値。', how: '鍵、平文、複数サンプルの有無を見る。' },
              { label: '確認点', what: '解けたかどうかの判定。', how: 'flag形式や可読性で確認する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'verification',
            title: '復元結果の検証',
            summary: '出た文字列をそのまま信じず、形式と整合性を確認する。',
            what: '復号結果、平文候補、flag候補、ファイル復元結果。',
            intent: '偶然読める断片や誤変換を避けるため。',
            details: 'Cryptoでは途中結果がそれっぽく見えることがある。文字コード、flag形式、チェックサム、ファイル形式、問題文との対応を見て、解答として成立するか判断する。',
            observe: [
              { label: '可読性', what: '自然な文字列か。', how: '文字化けや余計なバイトがないか見る。' },
              { label: '形式', what: 'flagやファイル形式に合うか。', how: 'prefix、マジックバイト、構文を見る。' },
              { label: '再現性', what: '同じ手順で再度出せるか。', how: '入力と出力の対応をメモする。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'forgery-risk',
            title: '署名と信頼境界',
            summary: '誰が作った値として信頼されるかを見る。',
            what: '署名、MAC、JWT風トークン、検証鍵、検証される範囲。',
            intent: '暗号値が認可や権限とつながる場面を理解するため。',
            details: '暗号問題の権限昇格は、署名やトークンが「誰として扱うか」に関係する場合。ここでは偽造手順ではなく、何が検証対象で何が信頼境界かを見る。',
            observe: [
              { label: '主体', what: '値が表すユーザーや権限。', how: 'payloadや説明文のrole、userを見る。' },
              { label: '検証範囲', what: '署名で守られる部分。', how: '値の構造と区切りを見る。' },
              { label: '鍵関係', what: '公開鍵、秘密鍵、共有鍵の違い。', how: '問題文で与えられた鍵の役割を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'oracle-boundary',
            title: '判定口の扱い',
            summary: '正誤やエラーを返す仕組みが何を漏らすか見る。',
            what: '復号成否、padding成否、署名検証成否、比較結果。',
            intent: '結果だけでなく、判定の反応差が情報になることを理解するため。',
            details: '判定口は便利だが危険にもなる。CTFでは反応差を読む題材になるが、実システムへ試行を投げる発想には進まない。',
            observe: [
              { label: '反応差', what: '成功、失敗、エラーの違い。', how: 'CTF内の表示や与えられたログを見る。' },
              { label: '粒度', what: 'どこまで理由を教えるか。', how: 'エラー文が詳細すぎないか見る。' },
              { label: '回数', what: '大量試行が必要か。', how: '問題として許可された範囲か確認する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'secret-lifecycle',
            title: '秘密情報のライフサイクル',
            summary: '鍵やトークンがどこで作られ、保存され、失効するか見る。',
            what: '鍵生成、保存場所、ローテーション、失効、再発行。',
            intent: '暗号を防御設計として理解するため。',
            details: '秘密情報は作る、保存する、使う、失効する、交換するという流れを持つ。CTFでもこの流れを読むと、なぜその値が重要なのか説明できる。',
            observe: [
              { label: '生成', what: 'いつ作られるか。', how: '問題文やログの生成時刻を見る。' },
              { label: '保存', what: 'どこに残るか。', how: '設定、環境変数、ファイル名のヒントを見る。' },
              { label: '失効', what: '使えなくする条件。', how: '期限や再発行の説明を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'crypto-audit',
            title: '暗号利用の監査観点',
            summary: '安全でない使い方をレポートできる形に整理する。',
            what: '再利用、短すぎる鍵、詳細すぎるエラー、検証漏れ。',
            intent: '解いて終わりではなく、何が設計上の問題か説明するため。',
            details: '暗号CTFの学びは、防御側の設計レビューに転用できる。どの前提が崩れ、何が漏れ、どんな影響があるかを言葉にする。',
            observe: [
              { label: '問題点', what: '崩れた前提。', how: '解法に使った条件を逆に書く。' },
              { label: '影響', what: '何が読める/偽れるか。', how: '復元結果や権限との関係を見る。' },
              { label: '対策観点', what: 'どう設計すべきか。', how: '再利用防止、失効、エラー抑制を整理する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
];

const remainingCategoryPlans: CategoryPlan[] = [
  {
    id: 'reverse',
    title: 'リバース',
    englishTitle: 'Reverse',
    subtitle: '実行結果・文字列・分岐を読む',
    color: '#b05b59',
    what:
      'ソースがないプログラムの入力、出力、文字列、分岐、形式を観察し、内部の条件を推測するジャンル。マルウェア運用や回避ではなくCTFの読解に限定する。',
    choose: 'バイナリ、apk、wasm、難読化されたスクリプト、入力チェック問題を読みたいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'file-profile',
            title: 'ファイルの素性',
            summary: '実行形式、アーキテクチャ、依存関係、実行環境を確認する。',
            what: 'ELF、PE、Mach-O、apk、wasm、scriptなどの形式と実行条件。',
            intent: 'どの見方と道具立てが必要かを決めるため。',
            details: 'Reverseは最初に形式を間違えると全部ずれる。拡張子ではなく実形式、bit数、OS、依存ライブラリ、問題文の実行条件を確認する。',
            observe: [
              { label: '形式', what: '実ファイルの種類。', how: '拡張子ではなく識別結果を見る。' },
              { label: '環境', what: 'OS、bit数、VM、引数。', how: '問題文とファイル情報を照合する。' },
              { label: '依存', what: '必要なライブラリやデータ。', how: '同梱ファイルとエラーを読む。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'visible-behavior',
            title: '見える挙動',
            summary: '起動時表示、入力要求、エラー、終了状態を読む。',
            what: 'プログラムを動かしたときに見えるメッセージや反応。',
            intent: '内部解析前に、入力と出力の対応を掴むため。',
            details: 'いきなり逆アセンブルに行く前に、表示文字列、使い方、成功/失敗メッセージ、引数の有無を見る。表面挙動だけでも分岐の仮説が立つ。',
            observe: [
              { label: '表示', what: '起動時や失敗時の文字列。', how: '成功、失敗、usage、hintを分ける。' },
              { label: '入力', what: '引数、標準入力、ファイル。', how: '何を求めているか見る。' },
              { label: '終了', what: '成功/失敗の終わり方。', how: '終了コードや文言の差を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'strings-symbols',
            title: '文字列とシンボル',
            summary: '埋め込まれた文字列、関数名、エラー文から機能を読む。',
            what: 'プログラム内に残る可読文字列や名前。',
            intent: '内部の処理名、成功条件、失敗条件の手がかりを得るため。',
            details: '文字列は最短の地図。flagそのものを探すだけでなく、check、verify、password、error、usageのような語から処理の流れを推測する。',
            observe: [
              { label: '成功語', what: '正解時に出そうな文言。', how: 'congratulations、successなどを見る。' },
              { label: '失敗語', what: '拒否やエラー。', how: 'invalid、try againなどを見る。' },
              { label: '関数名', what: '残っている処理名。', how: 'check、parse、decryptなどの語を拾う。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'control-flow',
            title: '分岐の場所',
            summary: '入力チェック、比較、成功/失敗分岐を探す。',
            what: '条件によって処理が変わる場所。',
            intent: 'どの条件を満たせば成功側へ進むかを読むため。',
            details: 'Reverseの核心は、入力がどこで比較され、どこで成功/失敗に分かれるか。命令の細部より、入力、変換、比較、分岐、出力の流れを掴む。',
            observe: [
              { label: '比較', what: '入力と何かを比べる処理。', how: '文字列比較、数値比較、長さ比較を見る。' },
              { label: '変換', what: '入力を加工する処理。', how: 'xor、hash、並び替え、計算の有無を見る。' },
              { label: '分岐先', what: '成功側と失敗側。', how: 'どの文言へ向かうか見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'input-model',
            title: '入力モデルの復元',
            summary: '正しい入力の形、長さ、文字種、構造を推測する。',
            what: 'プログラムが受け付ける入力の仕様。',
            intent: '闇雲に試すのではなく、条件を絞るため。',
            details: '入力モデルは、長さ、prefix、区切り、数値範囲、文字種などで作る。実際の答えを当てる前に、どんな形なら検証に進むかを読む。',
            observe: [
              { label: '長さ', what: '必要な文字数やデータ長。', how: '長さ比較やエラー文を見る。' },
              { label: '文字種', what: '数字、英字、hexなど。', how: 'チェック関数や変換処理を見る。' },
              { label: '構造', what: '区切り、prefix、複数フィールド。', how: 'parse処理やsplit処理を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'logic-reconstruction',
            title: '検証ロジックの復元',
            summary: '入力がどう変換され、何と比較されるかを追う。',
            what: 'check関数、変換、比較、テーブル参照。',
            intent: '答えを推測ではなく、処理の意味から導くため。',
            details: 'ロジック復元は、命令を全部読むことではない。入力が入る場所から、変換され、比較され、成功分岐へ進むまでの最短経路を読む。',
            observe: [
              { label: '入口', what: '入力がメモリに入る場所。', how: '引数、stdin、ファイル読み込みを見る。' },
              { label: '加工', what: '入力への処理。', how: 'ループ、xor、加算、並び替えを見る。' },
              { label: '比較対象', what: '正解側の値。', how: '定数、配列、生成値を確認する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'hidden-feature',
            title: '隠れ機能とモード',
            summary: '通常ルート以外のモードやデバッグ機能を読む。',
            what: '引数、環境変数、設定、隠れコマンド。',
            intent: 'プログラム内の権限や機能差を理解するため。',
            details: 'Reverseでの権限昇格は、実OS権限ではなく、プログラム内の強い機能や隠れモードを見つける形で出ることがある。条件と影響範囲を読む。',
            observe: [
              { label: 'モード', what: 'debug、admin、testなど。', how: '文字列と分岐条件を見る。' },
              { label: '条件', what: 'そのモードに入る条件。', how: '引数、設定、比較を読む。' },
              { label: '影響', what: '何が変わるか。', how: '出力、処理、読めるデータの差を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'trust-inside-binary',
            title: 'プログラム内の信頼境界',
            summary: 'どの入力やファイルを信頼して処理しているか見る。',
            what: '設定ファイル、外部データ、署名、チェックサム、パス。',
            intent: '内部で信頼される値がどこにあるか理解するため。',
            details: 'プログラムは、設定や外部ファイルを信頼して動くことがある。どこまで検証しているか、何を前提にしているかを見ると、問題の狙いが分かる。',
            observe: [
              { label: '信頼入力', what: 'そのまま使われる値。', how: '読み込み後の検証有無を見る。' },
              { label: '保護', what: '署名やチェックサム。', how: '検証処理の範囲を見る。' },
              { label: '失敗時', what: '検証失敗の扱い。', how: 'エラー、fallback、終了を確認する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'runtime-traces',
            title: '実行痕跡',
            summary: '実行時に作られるファイル、ログ、一時データを見る。',
            what: '一時ファイル、ログ、キャッシュ、設定変更。',
            intent: 'プログラムの副作用と調査材料を理解するため。',
            details: 'Reverseでは、実行中に作られる一時ファイルやログがヒントになることがある。削除や隠蔽ではなく、どこに痕跡が残るかを防御視点で読む。',
            observe: [
              { label: '出力物', what: '実行後に増えるファイル。', how: 'CTF環境内の差分を見る。' },
              { label: 'ログ', what: '処理結果やエラー記録。', how: '出力先と内容を確認する。' },
              { label: '一時領域', what: '途中データ。', how: '問題文で許可された範囲だけ見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'reporting',
            title: '解析メモの整理',
            summary: '入力、変換、比較、結果を再現できる形で記録する。',
            what: '解析手順、根拠、確認結果、未確定点。',
            intent: '偶然解けた状態から、説明できる状態へ移るため。',
            details: 'CTFではflag提出で終わりがちだが、実力になるのは説明。どの入力がどこで変換され、何と比較され、なぜ答えになるかを書けるようにする。',
            observe: [
              { label: '経路', what: '入力から出力まで。', how: '関数や処理単位で短く書く。' },
              { label: '根拠', what: '判断に使った証拠。', how: '文字列、分岐、比較値を引用する。' },
              { label: '再現', what: '同じ結果を出す条件。', how: '環境と入力条件を残す。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
  {
    id: 'pwn',
    title: 'バイナリ',
    englishTitle: 'Pwn',
    subtitle: 'メモリ境界・クラッシュ・保護機構を読む',
    color: '#b56f3d',
    what:
      'プログラムの入力サイズ、メモリ扱い、クラッシュ、保護機構、権限境界を読むジャンル。具体的な悪用ではなく、なぜ危険かを理解する。',
    choose: 'バッファ、クラッシュ、checksec、stack/heap、権限付き実行の概念を学びたいとき。',
    phases: [
      {
        phase: '偵察',
        nodes: [
          {
            id: 'binary-surface',
            title: 'バイナリの入口',
            summary: '入力方法、実行条件、保護機構、クラッシュ有無を確認する。',
            what: 'stdin、引数、ファイル、ネットワーク入力、保護機構。',
            intent: 'どこからデータが入り、どこで境界を越えそうか見るため。',
            details: 'Pwnの入口は、まず入力面と保護機構。何bytes入るのか、どこで止まるのか、どんな保護があるのかを見る。攻撃ペイロードではなく境界理解に留める。',
            observe: [
              { label: '入力', what: 'データの入口。', how: 'stdin、引数、ファイル、socketを問題文で確認する。' },
              { label: '保護', what: 'NX、Canary、PIE、RELROなど。', how: 'CTF環境の表示や配布情報を見る。' },
              { label: '落ち方', what: '異常終了の有無。', how: '許可された範囲でクラッシュ条件の概要を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'memory-model',
            title: 'メモリの見取り図',
            summary: 'stack、heap、global、codeの役割を分ける。',
            what: 'データが置かれる場所と寿命の違い。',
            intent: 'クラッシュや破壊がどの領域に関係するか理解するため。',
            details: 'Pwn初心者は、まずメモリ領域の違いを覚える。stackは関数呼び出し、heapは動的確保、globalは静的データ、codeは命令。どこに入力が置かれるかが観察点になる。',
            observe: [
              { label: 'stack', what: '関数内の一時領域。', how: 'ローカル変数や戻りの概念と結びつける。' },
              { label: 'heap', what: '動的に確保される領域。', how: 'malloc/newやリスト構造を見る。' },
              { label: 'global', what: '長く残る静的データ。', how: 'グローバル変数や固定バッファを見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '列挙',
        nodes: [
          {
            id: 'input-boundary',
            title: '入力サイズ境界',
            summary: 'どの長さで受け付け、どの長さで壊れるかを見る。',
            what: 'バッファ長、読み込み長、終端、改行、最大値。',
            intent: '境界チェックの有無を理解するため。',
            details: 'サイズ境界はPwnの基本。どの関数が何bytes読むのか、終端をどう扱うのか、エラーになるのかクラッシュするのかを分類する。',
            observe: [
              { label: '長さ', what: '入力可能なサイズ。', how: '問題文やソース断片の数値を見る。' },
              { label: '終端', what: 'null、改行、区切り。', how: '読み込み関数や処理の止まり方を見る。' },
              { label: '反応', what: '拒否、切り捨て、クラッシュ。', how: '結果を分類する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'crash-triage',
            title: 'クラッシュの分類',
            summary: '落ちた理由を、入力、アドレス、権限、保護機構に分ける。',
            what: 'Segmentation fault、abort、保護機構検知、異常終了。',
            intent: 'ただ落ちたではなく、何が壊れたかを読むため。',
            details: 'クラッシュはゴールではなく情報。どの入力で再現するか、毎回同じか、保護機構のメッセージがあるかを見る。詳細な悪用には進まず、原因分類を学ぶ。',
            observe: [
              { label: '再現性', what: '同じ条件で同じ落ち方か。', how: '入力条件と結果を対応させる。' },
              { label: '種類', what: 'abort、segfault、assertなど。', how: '表示されるエラー名を見る。' },
              { label: '保護反応', what: 'Canary検知など。', how: 'メッセージと保護機構を照合する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '侵入',
        nodes: [
          {
            id: 'control-influence',
            title: '制御に影響する値',
            summary: '入力が分岐、長さ、ポインタ、関数選択に影響するか見る。',
            what: '制御フローやメモリアクセスに関係する値。',
            intent: 'どのデータが危険な判断に使われるか理解するため。',
            details: 'Pwnで大事なのは、入力が単なるデータとして扱われるか、制御に影響するか。分岐条件、インデックス、サイズ、ポインタ、関数選択に入力が入ると重要度が上がる。',
            observe: [
              { label: '分岐', what: 'ifやswitchの条件。', how: '入力が条件に入るか見る。' },
              { label: 'サイズ', what: 'コピーや確保の長さ。', how: '入力由来の長さが使われるか見る。' },
              { label: '参照', what: '配列indexやポインタ。', how: '範囲確認があるか見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'mitigation-meaning',
            title: '保護機構の意味',
            summary: 'NX、Canary、PIE、RELROが何を防ぐか理解する。',
            what: '悪用を難しくする仕組み。',
            intent: '解法選択ではなく、防御の意味を理解するため。',
            details: '保護機構は暗記ではなく役割で見る。NXは実行、Canaryはstack破壊検知、PIE/ASLRは位置、RELROは書き換え耐性に関係する。CTFでは有無が観察の方向を決める。',
            observe: [
              { label: 'NX', what: 'データ領域の実行を防ぐ。', how: '有効/無効をCTF表示で見る。' },
              { label: 'Canary', what: 'stack破壊を検知する。', how: '検知メッセージや設定を見る。' },
              { label: 'PIE/ASLR', what: 'アドレスの固定性を下げる。', how: '実行ごとの位置変化の概念を理解する。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '権限昇格',
        nodes: [
          {
            id: 'privileged-execution',
            title: '権限付き実行の境界',
            summary: 'プログラムが誰の権限で動くか見る。',
            what: 'setuid風の設定、サービス権限、コンテナ内権限。',
            intent: 'クラッシュがなぜ重大になるかを理解するため。',
            details: '同じバグでも、どの権限で動くかで影響が変わる。CTFでは権限付き実行やサービス実行者がヒントになる。実環境への昇格試行には進まない。',
            observe: [
              { label: '実行者', what: '誰の権限で動くか。', how: '問題文、ファイル属性、サービス表示を見る。' },
              { label: 'アクセス先', what: 'その権限で読めるもの。', how: 'flag条件やファイル所有者を見る。' },
              { label: '制限', what: 'コンテナやsandboxの範囲。', how: '問題環境の説明を見る。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'impact-model',
            title: '影響モデル',
            summary: '読める、書ける、実行できる、制御できるを分ける。',
            what: '脆弱性が与える影響の種類。',
            intent: '危険度を雑に語らず、何が可能になるかを整理するため。',
            details: 'Pwnの影響は一つではない。クラッシュだけ、情報漏えい、任意書き込み、制御フロー影響などを分ける。防御レビューにも使える視点。',
            observe: [
              { label: '読み', what: '情報が漏れる可能性。', how: '出力やエラーに内部値が出るか見る。' },
              { label: '書き', what: 'データが変わる可能性。', how: '入力が保存先やメモリに影響するか見る。' },
              { label: '制御', what: '処理の流れが変わる可能性。', how: '分岐や関数選択への影響を見る。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
      {
        phase: '維持・痕跡消去',
        nodes: [
          {
            id: 'runtime-footprint',
            title: '実行時の痕跡',
            summary: 'クラッシュログ、コア、プロセス、ファイル差分を見る。',
            what: '異常終了や実行が残す調査材料。',
            intent: '隠す方法ではなく、検知と調査の材料を知るため。',
            details: 'Pwnの学習では、クラッシュがログやコア、監視にどう残るかも重要。攻撃側の隠蔽ではなく、防御側が何を見ればよいかを学ぶ。',
            observe: [
              { label: 'ログ', what: '異常終了やサービス再起動。', how: 'CTF提供ログや画面表示を見る。' },
              { label: '差分', what: '実行後に変わったファイル。', how: '許可された範囲で時刻やサイズを見る。' },
              { label: 'プロセス', what: '動作中/終了した状態。', how: '問題環境の表示を確認する。' },
            ],
            safety: sharedSafety,
          },
          {
            id: 'pwn-report',
            title: '再現メモと対策観点',
            summary: '原因、条件、影響、保護機構、対策を整理する。',
            what: '解答後に残すべき技術メモ。',
            intent: 'CTFの点を実務の説明力へ変えるため。',
            details: 'Pwnは解けた後の整理が大事。入力条件、境界不備、どの保護が効いたか/効かなかったか、どう防ぐべきかを書くと、ただの手順暗記から抜けられる。',
            observe: [
              { label: '原因', what: 'どの境界が弱かったか。', how: '入力サイズ、検証漏れ、危険な関数を整理する。' },
              { label: '条件', what: '再現に必要な状態。', how: '環境、保護機構、入力条件を書く。' },
              { label: '対策', what: 'どう防ぐか。', how: '境界チェック、保護機構、権限分離に分ける。' },
            ],
            safety: sharedSafety,
          },
        ],
      },
    ],
  },
];

const allPlans = [...categoryPlans, ...extraCategoryPlans, ...remainingCategoryPlans];

export const categories: Category[] = allPlans.map((plan) => ({
  id: plan.id,
  title: plan.title,
  englishTitle: plan.englishTitle,
  subtitle: plan.subtitle,
  rootNodeId: `${plan.id}-${plan.phases[0].nodes[0].id}`,
  color: plan.color,
  what: plan.what,
  choose: plan.choose,
}));

function nodeId(categoryId: CategoryId, seedId: string) {
  return `${categoryId}-${seedId}`;
}

function buildBranches(plan: CategoryPlan, phaseIndex: number, nodeIndex: number): Branch[] {
  const currentPhase = plan.phases[phaseIndex];
  const currentNodes = currentPhase.nodes;
  const samePhaseNext = currentNodes[(nodeIndex + 1) % currentNodes.length];
  const nextPhase = plan.phases[phaseIndex + 1];
  const previousPhase = plan.phases[phaseIndex - 1];
  const branches: Branch[] = [];

  if (samePhaseNext.id !== currentNodes[nodeIndex].id) {
    branches.push({
      signal: `${currentPhase.phase}で別の観察点も残っている`,
      targetId: nodeId(plan.id, samePhaseNext.id),
      action: `${samePhaseNext.title}を見る`,
    });
  }

  if (nextPhase) {
    branches.push({
      signal: '次に見る理由が説明できる',
      targetId: nodeId(plan.id, nextPhase.nodes[0].id),
      action: `${nextPhase.phase}へ進む`,
    });
  }

  if (previousPhase) {
    branches.push({
      signal: '根拠が弱い、または前提が曖昧',
      targetId: nodeId(plan.id, previousPhase.nodes[0].id),
      action: `${previousPhase.phase}へ戻る`,
    });
  }

  return branches;
}

function buildNext(plan: CategoryPlan, phaseIndex: number, nodeIndex: number): string[] {
  const currentPhase = plan.phases[phaseIndex];
  const ids = currentPhase.nodes
    .filter((_, index) => index !== nodeIndex)
    .map((seed) => nodeId(plan.id, seed.id));
  const nextPhase = plan.phases[phaseIndex + 1];
  const previousPhase = plan.phases[phaseIndex - 1];

  if (nextPhase) ids.push(nodeId(plan.id, nextPhase.nodes[0].id));
  if (previousPhase) ids.push(nodeId(plan.id, previousPhase.nodes[0].id));

  return Array.from(new Set(ids));
}

export const learningNodes: Node<LearningNodeData>[] = allPlans.flatMap((plan) =>
  plan.phases.flatMap((phasePlan, phaseIndex) =>
    phasePlan.nodes.map((seed, nodeIndex) => ({
      id: nodeId(plan.id, seed.id),
      type: 'learning',
      position: {
        x: -860 + phaseIndex * 420,
        y: (nodeIndex - (phasePlan.nodes.length - 1) / 2) * 180,
      },
      data: {
        title: seed.title,
        category: plan.id,
        phase: phasePlan.phase,
        level: phaseIndex,
        summary: seed.summary,
        what: seed.what,
        intent: seed.intent,
        observe: seed.observe,
        branches: buildBranches(plan, phaseIndex, nodeIndex),
        details: seed.details,
        next: buildNext(plan, phaseIndex, nodeIndex),
        safety: seed.safety,
      },
    })),
  ),
);

const edgePairs = allPlans.flatMap((plan) => {
  const pairs: Array<[string, string, string]> = [];

  plan.phases.forEach((phasePlan, phaseIndex) => {
    const phaseNodeIds = phasePlan.nodes.map((seed) => nodeId(plan.id, seed.id));
    if (phaseNodeIds.length > 1) {
      pairs.push([phaseNodeIds[0], phaseNodeIds[1], phasePlan.phase]);
      pairs.push([phaseNodeIds[1], phaseNodeIds[0], phasePlan.phase]);
    }

    const nextPhase = plan.phases[phaseIndex + 1];
    if (nextPhase) {
      pairs.push([phaseNodeIds[0], nodeId(plan.id, nextPhase.nodes[0].id), nextPhase.phase]);
      pairs.push([phaseNodeIds[1] ?? phaseNodeIds[0], nodeId(plan.id, nextPhase.nodes[0].id), nextPhase.phase]);
    }
  });

  return pairs;
});

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
