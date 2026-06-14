import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Radar, TerminalSquare } from 'lucide-react';
import {
  attackPhases,
  categories,
  getCategory,
  getNode,
  learningNodes,
  type AttackPhase,
  type CategoryId,
  type LearningNodeData,
} from './data/knowledge';

type GateState = 'notice' | 'category' | 'workspace';
type NoticeCheckId = 'scope';

const noticeItems: Array<{ id: NoticeCheckId; text: string }> = [
  { id: 'scope', text: '学習、CTF、自分が管理する検証環境だけで使う' },
];

const phaseUi: Record<AttackPhase, { label: string; guide: string }> = {
  偵察: {
    label: '問題文を読む',
    guide: '対象を壊さず眺めて、何が入力で、何が出力で、どこまで見てよいかを決める',
  },
  列挙: {
    label: '観察する',
    guide: '見つけた入口を種類別に並べ、次に深く見る候補を選べる状態にする',
  },
  侵入: {
    label: '仮説を確認',
    guide: '突破手順ではなく、入口仮説が本当に成り立つかを許可範囲で小さく確認する',
  },
  権限昇格: {
    label: '差分を見る',
    guide: '権限、条件、影響範囲の差を読み、何ができる状態に変わるかを理解する',
  },
  '維持・痕跡消去': {
    label: '記録する',
    guide: '隠蔽手順ではなく、何が残り、どう記録し、どう防御・復習へ戻すかを見る',
  },
};

function stripStops(text: string) {
  return text.replace(/。/g, '');
}

function compactText(text: string) {
  return text.length <= 90 ? stripStops(text) : text;
}

function getCategoryKeywords(category: typeof categories[number]) {
  return category.subtitle.split('・').map((keyword) => keyword.replace(/を読む$/, '')).slice(0, 4);
}

type FlowRelation = 'same' | 'next' | 'previous';

function getConnectionKind(current: LearningNodeData, target: LearningNodeData) {
  if (target.level > current.level) return '次の段階';
  if (target.level < current.level) return '前提確認';
  return '同じ段階';
}

function getFlowRelation(current: LearningNodeData, target: LearningNodeData): FlowRelation {
  if (target.level > current.level) return 'next';
  if (target.level < current.level) return 'previous';
  return 'same';
}

function getConnectionLabel(current: LearningNodeData, target: LearningNodeData) {
  if (target.level < current.level) return phaseUi[target.phase].label;
  return target.title;
}

const defaultCategory = categories[0]!;
type KnowledgeNode = NonNullable<ReturnType<typeof getNode>>;
const nodeScreenAssets = import.meta.glob<string>('./assets/node-screens/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
});

function getNodeScreenSrc(nodeId: string) {
  return nodeScreenAssets[`./assets/node-screens/${nodeId}.webp`];
}

function getBeginnerGuide(node: LearningNodeData) {
  const first = node.observe[0];
  const second = node.observe[1];
  const third = node.observe[2];

  return {
    start: first
      ? `${node.title}では、最初に「${first.label}」だけを見る。ここで全部を理解しようとせず、画面・ログ・ファイル・値のどれを根拠にできるかを一つ決める。`
      : `${node.title}では、まず対象を一つ選び、見えた事実だけを短く書く。`,
    why: second
      ? `次に「${second.label}」を見る。これは最初に見た事実が偶然ではなく、別の場所からも説明できるかを確認するため。`
      : '次に、同じ観察を別の場所でもう一度確認する。ひとつの表示だけで判断しない。',
    compare: third
      ? `余裕があれば「${third.label}」まで見る。ここまでそろうと、次に進む理由と、まだ戻って確認すべき理由を分けやすい。`
      : '迷ったら、分かったことと分からないことを分ける。次に進む理由が言えないなら、この段階をもう一度見る。',
  };
}

function SummaryLabel({ children }: { children: string }) {
  return <span className="summary-label">{children}</span>;
}

function ScreenshotMock({ node, nodeId }: { node: LearningNodeData; nodeId: string }) {
  const category = getCategory(node.category);
  const focusItems = node.observe.slice(0, 3);
  const primary = focusItems[0];
  const secondary = focusItems[1];
  const generatedScreen = getNodeScreenSrc(nodeId);

  return (
    <figure
      aria-label={`${node.title}の画面例`}
      className={`screen-mock topic-screen topic-screen-${node.category}`}
      style={{ '--node-color': category.color } as React.CSSProperties}
    >
      {generatedScreen ? (
        <img
          alt={`${node.title}の生成画面例`}
          className="generated-screen-img"
          decoding="async"
          loading="lazy"
          src={generatedScreen}
        />
      ) : (
        <>
          <div className="screen-toolbar">
            <i />
            <i />
            <i />
            <span>{category.title} / {phaseUi[node.phase].label} / {node.title}</span>
          </div>
          <div className="topic-screen-body">
            <section className="topic-focus-card">
              <small>FOCUS</small>
              <strong>{primary?.label ?? node.title}</strong>
              <p>{primary ? compactText(primary.what) : compactText(node.summary)}</p>
            </section>
            <div className="topic-side-stack">
              <div>
                <small>LOOK</small>
                <span>{primary ? compactText(primary.how) : compactText(node.intent)}</span>
              </div>
              <div>
                <small>CHECK</small>
                <span>{secondary ? compactText(secondary.label) : '次の根拠'}</span>
              </div>
            </div>
            <div className="topic-evidence-list">
              {focusItems.map((item, index) => (
                <span className={index === 0 ? 'active' : ''} key={item.label}>
                  {item.label}
                </span>
              ))}
            </div>
            <div className="topic-decision">
              <small>NEXT</small>
              <span>{node.branches[0]?.signal ?? node.branches[0]?.action ?? '説明できたら次の段階へ進む'}</span>
            </div>
          </div>
        </>
      )}
      <figcaption>
        <strong>見る点</strong>
        <span>{primary?.label ?? node.title}</span>
      </figcaption>
    </figure>
  );
}

export function App() {
  const [gateState, setGateState] = useState<GateState>('notice');
  const [noticeChecks, setNoticeChecks] = useState<Record<NoticeCheckId, boolean>>({
    scope: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(defaultCategory.id);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultCategory.rootNodeId);
  const [detailDominant, setDetailDominant] = useState(false);

  const agreed = noticeItems.every((item) => noticeChecks[item.id]);

  useEffect(() => {
    if (gateState !== 'notice') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && agreed) {
        setGateState('category');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [agreed, gateState]);

  const setNoticeCheck = useCallback((id: NoticeCheckId, value: boolean) => {
    setNoticeChecks((current) => ({ ...current, [id]: value }));
  }, []);

  const selectedNode = getNode(selectedNodeId) ?? getNode(defaultCategory.rootNodeId)!;
  const selectedCategoryData = getCategory(selectedCategory);
  const activePhase = selectedNode.data.phase;
  const selectedRootId = selectedCategoryData.rootNodeId;
  const categoryNodes = useMemo(
    () => learningNodes.filter((node) => node.data.category === selectedNode.data.category),
    [selectedNode.data.category],
  );

  const connectionChoices = useMemo(
    () => {
      const choices = new Map<string, KnowledgeNode>();
      const addChoice = (node: KnowledgeNode | undefined) => {
        if (!node || node.id === selectedNode.id) return;
        choices.set(node.id, node);
      };

      const previousLevelNode = categoryNodes.find(
        (node) => node.data.level === selectedNode.data.level - 1,
      );

      categoryNodes
        .filter((node) => node.data.level === selectedNode.data.level)
        .forEach(addChoice);

      selectedNode.data.next
        .map((id) => getNode(id))
        .filter((node): node is KnowledgeNode => node !== undefined && node.data.level > selectedNode.data.level)
        .forEach(addChoice);

      addChoice(previousLevelNode);

      return Array.from(choices.values()).sort((left, right) => {
        const relationOrder: Record<FlowRelation, number> = { same: 0, next: 1, previous: 2 };
        const leftRelation = getFlowRelation(selectedNode.data, left.data);
        const rightRelation = getFlowRelation(selectedNode.data, right.data);
        return relationOrder[leftRelation] - relationOrder[rightRelation] || left.data.level - right.data.level;
      });
    },
    [categoryNodes, selectedNode],
  );
  const connectionItems = useMemo(
    () =>
      connectionChoices.map((node) => ({
        node,
        kind: getConnectionKind(selectedNode.data, node.data),
      })),
    [connectionChoices, selectedNode.data],
  );
  const connectionGroups = useMemo(
    () => ({
      same: connectionItems.filter(({ node }) => getFlowRelation(selectedNode.data, node.data) === 'same'),
      next: connectionItems.filter(({ node }) => getFlowRelation(selectedNode.data, node.data) === 'next'),
      previous: connectionItems.filter(({ node }) => getFlowRelation(selectedNode.data, node.data) === 'previous'),
    }),
    [connectionItems, selectedNode.data],
  );
  const firstSteps = selectedNode.data.observe.slice(0, 3);
  const beginnerGuide = getBeginnerGuide(selectedNode.data);

  const focusNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;
      setSelectedNodeId(nodeId);
      setSelectedCategory(node.data.category);
      setDetailDominant(true);
    },
    [],
  );

  const chooseCategory = useCallback((categoryId: CategoryId) => {
    const category = getCategory(categoryId);
    setSelectedCategory(categoryId);
    setSelectedNodeId(category.rootNodeId);
    setDetailDominant(false);
    setGateState('workspace');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    if (gateState !== 'workspace') return;
    window.requestAnimationFrame(() => {
      document.querySelector('.detail-panel')?.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth <= 1100) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [gateState, selectedNodeId]);

  return (
    <div className="shell-root">
      <div className="ambient-grid" />
      <div className="signal-field" />
      <AnimatePresence mode="wait">
        {gateState === 'notice' && (
          <motion.div
            className="screen-state"
            key="notice"
            initial={{ opacity: 0, y: 10, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
            transition={{ duration: 0.34, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <NoticeGate
              agreed={agreed}
              checks={noticeChecks}
              onCheckChange={setNoticeCheck}
              onEnter={() => agreed && setGateState('category')}
            />
            <BootScreen overlay />
          </motion.div>
        )}
        {gateState === 'category' && <CategoryGate key="category" onSelect={chooseCategory} />}
        {gateState === 'workspace' && (
          <motion.div
            key="workspace"
            className={`app-shell ${selectedNodeId !== selectedRootId ? 'has-selected-focus' : ''} ${
              detailDominant ? 'detail-dominant' : ''
            }`}
            style={{ '--theme-color': selectedCategoryData.color } as React.CSSProperties}
            initial={{ opacity: 0, y: 12, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
            transition={{ duration: 0.42, ease: [0.2, 0.9, 0.2, 1] }}
          >
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Radar size={20} />
          </span>
          <div>
            <strong>HackerLake</strong>
          </div>
        </div>
        <div className="phase-track" aria-label="hacking phases">
          {attackPhases.map((phase) => (
            <span key={phase} className={phase === activePhase ? 'active' : ''}>
              {phaseUi[phase].label}
            </span>
          ))}
        </div>
        <button className="genre-button" onClick={() => setGateState('category')} type="button">
          ジャンル
        </button>
      </header>

      <main className="map-stage">
        <div className="stage-header">
          <div>
            <span>{selectedCategoryData.title} / {phaseUi[activePhase].label}</span>
            <h1>{selectedNode.data.title}</h1>
          </div>
        </div>
        <section className="node-corridor" aria-label="node connections">
          <div className="corridor-section corridor-current-section">
            <span className="corridor-label sr-only">現在地</span>
            <div className="corridor-card corridor-card-current">
              <span className="sr-only">{phaseUi[selectedNode.data.phase].label}</span>
              <strong>{selectedNode.data.title}</strong>
            </div>
          </div>

          {connectionGroups.same.length > 0 && (
            <div className="corridor-section corridor-same-section">
              <span className="corridor-label sr-only">同じ段階で見る</span>
              <div className="corridor-choice-grid">
                {connectionGroups.same.map(({ node }) => (
                  <button
                    aria-label={`同じ段階で見る: ${node.data.title}`}
                    className="corridor-card corridor-card-button relation-same"
                    key={node.id}
                    onClick={() => focusNode(node.id)}
                    type="button"
                  >
                    <span className="sr-only">同じ段階</span>
                    <strong>{node.data.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {connectionGroups.next.length > 0 && (
            <div className="corridor-section corridor-next-section">
              <span className="corridor-label sr-only">次の段階へ進む</span>
              <div className="corridor-choice-grid">
                {connectionGroups.next.map(({ node }) => (
                  <button
                    aria-label={`次の段階へ進む: ${node.data.title}`}
                    className="corridor-card corridor-card-button relation-next"
                    key={node.id}
                    onClick={() => focusNode(node.id)}
                    type="button"
                  >
                    <span className="sr-only">次の段階</span>
                    <strong>{node.data.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {connectionGroups.previous.length > 0 && (
            <div className="corridor-section corridor-previous-section">
              <span className="corridor-label sr-only">前提へ戻る</span>
              <div className="corridor-choice-grid">
                {connectionGroups.previous.map(({ node }) => (
                  <button
                    aria-label={`前の階層へ戻る: ${getConnectionLabel(selectedNode.data, node.data)}`}
                    className="corridor-card corridor-card-button relation-previous"
                    key={node.id}
                    onClick={() => focusNode(node.id)}
                    type="button"
                  >
                    <span className="sr-only">前提確認</span>
                    <strong>{getConnectionLabel(selectedNode.data, node.data)}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {connectionItems.length === 0 && (
            <p className="corridor-empty">この観察を記録して、別のジャンルか前の段階を見直す。</p>
          )}
        </section>
      </main>

      <aside className="detail-panel">
          <motion.section
            key={selectedNodeId}
            initial={{ opacity: 0, x: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.46, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <div className="detail-heading">
              <span>{selectedCategoryData.title} / {phaseUi[activePhase].label}</span>
              <h2>{selectedNode.data.title}</h2>
              <p className="lead">{compactText(selectedNode.data.summary)}</p>
            </div>

            <ScreenshotMock node={selectedNode.data} nodeId={selectedNode.id} />

            <section className="beginner-guide" aria-label="beginner guide">
              <h3>読み方</h3>
              <div>
                <p>{beginnerGuide.start}</p>
                <p>{beginnerGuide.why}</p>
                <p>{beginnerGuide.compare}</p>
              </div>
            </section>

            <section className="learning-brief">
              <h3>最初に見ること</h3>
              <p>{selectedNode.data.intent}</p>
              <ol>
                {firstSteps.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.how}</span>
                    <em>{item.what}</em>
                  </li>
                ))}
              </ol>
            </section>

            {connectionItems.length > 0 && (
              <section className="detail-next-strip" aria-label="next learning nodes">
                <span>次に見る</span>
                <div>
                  {connectionItems.map(({ node, kind }) => (
                    <button
                      className={`relation-${getFlowRelation(selectedNode.data, node.data)}`}
                      key={node.id}
                      onClick={() => focusNode(node.id)}
                      type="button"
                    >
                      <em aria-hidden="true" />
                      <span className="sr-only">{kind}</span>
                      <strong>{getConnectionLabel(selectedNode.data, node.data)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {selectedNode.data.branches.length > 0 && (
              <details className="detail-block">
                <summary><SummaryLabel>条件が見えたら</SummaryLabel></summary>
                <div className="branch-cards">
                  {selectedNode.data.branches.map((branch) => {
                    const targetNode = getNode(branch.targetId);
                    return (
                      <button
                        key={`${branch.signal}-${branch.targetId}`}
                        disabled={!targetNode}
                        onClick={() => targetNode && focusNode(targetNode.id)}
                        type="button"
                      >
                        <span>見えた条件</span>
                        <strong>{branch.signal}</strong>
                        <em>{compactText(targetNode ? branch.action : '観察メモに残す')}</em>
                      </button>
                    );
                  })}
                </div>
              </details>
            )}

            <details className="detail-block">
              <summary><SummaryLabel>補足</SummaryLabel></summary>
              <p>{selectedNode.data.what}</p>
              <p>{selectedNode.data.details}</p>
              <p>
                初心者はツール名や脆弱性名に飛びつきやすいが、このノードではまず「見えた事実」「それを見た場所」「次に確認する理由」を分ける。三つを一文で説明できると、次のノードへ進む判断が安定する。
              </p>
              <p className="safety-note">{selectedNode.data.safety}</p>
            </details>
          </motion.section>
      </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type CategoryGateProps = {
  onSelect: (categoryId: CategoryId) => void;
};

function CategoryGate({ onSelect }: CategoryGateProps) {
  return (
    <motion.section
      className="category-gate"
      initial={{ opacity: 0, y: 10, filter: 'blur(14px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(14px)' }}
      transition={{ duration: 0.34, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <div className="category-shell">
        <div className="category-heading">
          <h1>ジャンルを選ぶ</h1>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <article
              className="category-card"
              key={category.id}
              style={{ '--node-color': category.color } as React.CSSProperties}
            >
              <button
                className="category-main"
                onClick={() => onSelect(category.id)}
                type="button"
              >
                <small>{category.englishTitle}</small>
                <strong>{category.title}</strong>
                <span className="category-keywords">
                  {getCategoryKeywords(category).slice(0, 3).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </span>
                <em>はじめる</em>
              </button>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

type BootScreenProps = {
  overlay?: boolean;
};

function BootScreen({ overlay = false }: BootScreenProps) {
  return (
    <motion.section
      aria-hidden={overlay}
      className={`boot-screen ${overlay ? 'boot-screen-overlay' : ''}`}
      initial={false}
      animate={overlay ? undefined : { opacity: 1 }}
      exit={overlay ? undefined : { opacity: 0, y: -18, filter: 'blur(14px)' }}
      transition={overlay ? undefined : { duration: 0.42 }}
    >
      <div className="boot-frame">
        <div className="boot-noise" />
        <div className="boot-reticle">
          <span />
          <span />
          <span />
          <span />
        </div>
        <motion.h1
          initial={false}
          animate={{ opacity: 1, letterSpacing: '0.05em', y: 0 }}
          transition={{ duration: 0.65, ease: [0.2, 0.9, 0.2, 1] }}
        >
          HACK YOURSELF
        </motion.h1>
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
        >
          by skjshr
        </motion.p>
        <div className="boot-loader" aria-label="loading">
          <span />
        </div>
      </div>
    </motion.section>
  );
}

type NoticeGateProps = {
  agreed: boolean;
  checks: Record<NoticeCheckId, boolean>;
  onCheckChange: (id: NoticeCheckId, value: boolean) => void;
  onEnter: () => void;
};

function NoticeGate({ agreed, checks, onCheckChange, onEnter }: NoticeGateProps) {
  return (
    <motion.section
      className="notice-gate"
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -18, filter: 'blur(12px)' }}
      transition={{ duration: 0.38 }}
    >
      <div className="notice-shell">
        <h1>CAUTION</h1>
        <h2>許可のない対象には触れない</h2>
        <p>
          HackerLakeは攻撃手順を配るサイトではありません CTFと自分の検証環境で、状況を読み、次の一手を選ぶための訓練用UIです
        </p>
        <details className="notice-detail">
          <summary><SummaryLabel>利用範囲</SummaryLabel></summary>
          <p>許可されていない対象は、スキャンだけでも法律や規約に抵触する可能性があります。不正アクセスや実サービスへの試行を推奨しません。</p>
        </details>
        <div className="notice-list">
          {noticeItems.map((item) => (
            <label className={`notice-check ${checks[item.id] ? 'checked' : ''}`} key={item.id}>
              <input
                checked={checks[item.id]}
                onChange={(event) => onCheckChange(item.id, event.target.checked)}
                type="checkbox"
              />
              <span className="box">{checks[item.id] && <Check size={15} />}</span>
              <span>{item.text}</span>
            </label>
          ))}
        </div>
        <button className="enter-button" disabled={!agreed} onClick={onEnter} type="button">
          <span>ENTER</span>
          <TerminalSquare size={18} />
        </button>
      </div>
    </motion.section>
  );
}
