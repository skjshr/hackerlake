import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Radar, TerminalSquare } from 'lucide-react';
import cryptoScreen from './assets/screens/crypto.webp';
import forensicsScreen from './assets/screens/forensics.webp';
import networkScreen from './assets/screens/network.webp';
import pwnScreen from './assets/screens/pwn.webp';
import reverseScreen from './assets/screens/reverse.webp';
import webScreen from './assets/screens/web.webp';
import {
  attackPhases,
  categories,
  getCategory,
  getNode,
  learningEdges,
  learningNodes,
  type AttackPhase,
  type CategoryId,
  type LearningNodeData,
} from './data/knowledge';

type GateState = 'notice' | 'category' | 'workspace';
type NoticeCheckId = 'scope' | 'law' | 'nonCrime';

const noticeItems: Array<{ id: NoticeCheckId; text: string }> = [
  { id: 'scope', text: '学習、CTF、自分が管理する検証環境だけで使う' },
  { id: 'law', text: '許可されていない対象は、スキャンだけでも法律や規約に抵触する可能性がある' },
  { id: 'nonCrime', text: '犯罪行為、不正アクセス、実サービスへの試行を推奨しない' },
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

function getConnectionKind(current: LearningNodeData, target: LearningNodeData) {
  if (target.level > current.level) return '次の段階';
  if (target.level < current.level) return '前提確認';
  return '同じ段階';
}

function getMiniExample(node: LearningNodeData) {
  const [first, second] = node.observe;
  if (!first) return `${node.title}では、まず対象を一つだけ選び、見えた事実を短く記録する`;
  const next = second ? `次に「${second.label}」も見て、同じ説明でつながるか確認する` : '次に、同じ観察をもう一度別の対象で確認する';
  return stripStops(`例: 「${first.label}」を見るときは、${first.how} 見えた内容を「${first.what}」としてメモする ${next}`);
}

function getDecisionText(node: LearningNodeData) {
  const labels = node.observe.slice(0, 3).map((item) => `「${item.label}」`).join('、');
  return `${labels || '観察項目'}を自分の言葉で説明できたら次へ進む 説明できない項目があるなら、前のノードへ戻って問題文、画面、ログ、配布物のどれを見落としたか確認する`;
}

function LearningNode({ data }: NodeProps<Node<LearningNodeData>>) {
  const category = getCategory(data.category);

  return (
    <div
      className={`learning-node level-${data.level}`}
      style={{ '--node-color': category.color } as React.CSSProperties}
    >
      <Handle className="node-handle node-handle-target" position={Position.Left} type="target" />
      <Handle className="node-handle node-handle-source" position={Position.Right} type="source" />
      <span>{phaseUi[data.phase].label}</span>
      <strong>{data.title}</strong>
    </div>
  );
}

const nodeTypes = { learning: LearningNode };
const defaultCategory = categories[0]!;

const screenshotAssets: Record<CategoryId, { alt: string; src: string }> = {
  web: { alt: 'Web CTFのブラウザと通信確認画面', src: webScreen },
  network: { alt: 'ネットワークCTFの許可ラボ観察画面', src: networkScreen },
  forensics: { alt: 'フォレンジックCTFの証拠ビューア画面', src: forensicsScreen },
  crypto: { alt: '暗号CTFの問題文と比較メモ画面', src: cryptoScreen },
  reverse: { alt: 'リバースCTFの解析ビュー画面', src: reverseScreen },
  pwn: { alt: 'Pwn CTFのローカルデバッグ画面', src: pwnScreen },
};

function SummaryLabel({ children }: { children: string }) {
  return <span className="summary-label">{children}</span>;
}

function getTakeaways(node: LearningNodeData) {
  const first = node.observe[0]?.label ?? '見る対象';
  const second = node.observe[1]?.label ?? '根拠';
  return [
    `${first}を入口として説明できる`,
    `${second}を根拠としてメモできる`,
    `次に進むか戻るかを自分で選べる`,
  ];
}

function getExampleItems(node: LearningNodeData) {
  const first = node.observe[0];
  const second = node.observe[1];
  return [
    first ? `例: ${first.label}を見るなら「${compactText(first.how)}」まで確認する` : `例: ${node.title}を一つ選び、見えた事実だけを書く`,
    second ? `次: ${second.label}も同じ説明でつながるか見る` : '次: 同じ観察を別の場所でもう一度確認する',
    `メモ: ${compactText(node.intent)}`,
  ];
}

function getRiskText(node: LearningNodeData) {
  return `${node.title}を飛ばすと、脆弱性名やツール名だけを追って、なぜその選択をしたのか説明できなくなる`;
}

function getObserveExample(item: LearningNodeData['observe'][number]) {
  return `見える例: ${compactText(item.what)} / 確認: ${compactText(item.how)}`;
}

function getObserveNextHint(item: LearningNodeData['observe'][number], node: LearningNodeData) {
  return `${item.label}が説明できたら、${node.branches[0]?.signal ?? '次の候補'}を探す 説明できなければ前の画面や問題文へ戻る`;
}

function getLogExample(node: LearningNodeData) {
  const first = node.observe[0];
  return {
    seen: first ? `${node.title} / ${first.label}` : node.title,
    learned: first ? compactText(first.what) : compactText(node.summary),
    unknown: node.observe[1]?.label ?? 'まだ根拠が薄い点',
    next: node.branches[0]?.action ?? '次のノードで同じ根拠が通るか確認する',
  };
}

function ScreenshotMock({ node }: { node: LearningNodeData }) {
  const asset = screenshotAssets[node.category];
  const first = node.observe[0];

  return (
    <figure className="screen-mock">
      <img alt={asset.alt} decoding="async" loading="lazy" src={asset.src} />
      <figcaption>
        <strong>見る点</strong>
        <span>{first?.label ?? node.title}</span>
      </figcaption>
    </figure>
  );
}

function getFlowWindowIds(nodeId: string, categoryId: CategoryId, previousId?: string) {
  const rootId = getCategory(categoryId).rootNodeId;
  const rootNode = getNode(rootId);
  const currentNode = getNode(nodeId);

  if (nodeId === rootId) {
    return Array.from(new Set([rootId, ...(rootNode?.data.next ?? [])]));
  }

  const previousIsConnected = previousId
    ? learningEdges.some((edge) => edge.source === previousId && edge.target === nodeId)
    : false;
  const pathSource = previousIsConnected && previousId ? previousId : rootId;

  return Array.from(
    new Set([
      rootId,
      pathSource,
      nodeId,
      ...(currentNode?.data.next ?? []),
    ]),
  );
}

export function App() {
  const [gateState, setGateState] = useState<GateState>('notice');
  const [noticeChecks, setNoticeChecks] = useState<Record<NoticeCheckId, boolean>>({
    scope: false,
    law: false,
    nonCrime: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(defaultCategory.id);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultCategory.rootNodeId);
  const [history, setHistory] = useState<string[]>([defaultCategory.rootNodeId]);
  const [flow, setFlow] = useState<ReactFlowInstance<Node<LearningNodeData>, Edge> | null>(null);
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
  const previousNodeId = history.length >= 2 ? history[history.length - 2] : undefined;
  const selectedRootId = selectedCategoryData.rootNodeId;
  const fallbackNextIds = useMemo(
    () => Array.from(new Set([previousNodeId, selectedRootId].filter(Boolean))) as string[],
    [previousNodeId, selectedRootId],
  );
  const displayedNextIds = selectedNode.data.next.length > 0 ? selectedNode.data.next : fallbackNextIds;
  const nextChoiceIds = useMemo(() => new Set(selectedNode.data.next), [selectedNode.data.next]);
  const activeIds = useMemo(() => {
    return new Set(getFlowWindowIds(selectedNodeId, selectedCategory, previousNodeId));
  }, [previousNodeId, selectedCategory, selectedNodeId]);

  const nodes = useMemo(
    () =>
      learningNodes
        .filter((node) => activeIds.has(node.id))
        .map((node) => ({
          ...node,
          selected: false,
          data: node.data,
          className:
            node.id === selectedNodeId
              ? 'is-focus-node'
              : selectedNodeId === selectedRootId || nextChoiceIds.has(node.id)
                ? 'is-choice-node'
                : 'is-context-node',
        })),
    [activeIds, nextChoiceIds, selectedCategory, selectedNodeId, selectedRootId],
  );

  const edges = useMemo(
    () =>
      learningEdges
        .filter((edge) => activeIds.has(edge.source) && activeIds.has(edge.target))
        .map((edge) => ({
          ...edge,
          className:
            edge.source === selectedNodeId || edge.target === selectedNodeId
              ? 'edge-hot'
              : 'edge-calm',
      })),
    [activeIds, selectedNodeId],
  );

  const connectionChoices = useMemo(
    () =>
      displayedNextIds
        .map((id) => getNode(id))
        .filter((node): node is Node<LearningNodeData> => Boolean(node)),
    [displayedNextIds],
  );
  const connectionItems = useMemo(
    () =>
      connectionChoices.map((node) => ({
        node,
        kind: getConnectionKind(selectedNode.data, node.data),
      })),
    [connectionChoices, selectedNode.data],
  );
  const firstSteps = selectedNode.data.observe.slice(0, 3);
  const logExample = getLogExample(selectedNode.data);

  const focusNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;
      setSelectedNodeId(nodeId);
      setSelectedCategory(node.data.category);
      setDetailDominant(true);
      setHistory((current) => {
        if (current[current.length - 1] === nodeId) return current;
        return [...current.slice(-7), nodeId];
      });
      requestAnimationFrame(() => {
        const corridor = getFlowWindowIds(nodeId, node.data.category, selectedNodeId).map((id) => ({
          id,
        }));
        flow?.fitView({ nodes: corridor, duration: 1120, padding: 0.2 });
      });
    },
    [flow, selectedNodeId],
  );

  const chooseCategory = useCallback((categoryId: CategoryId) => {
    const category = getCategory(categoryId);
    setSelectedCategory(categoryId);
    setSelectedNodeId(category.rootNodeId);
    setHistory([category.rootNodeId]);
    setDetailDominant(false);
    setGateState('workspace');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const timer = window.setTimeout(() => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory).map((id) => ({ id }));
      flow.fitView({ nodes: corridor, duration: 900, padding: 0.18 });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [flow, gateState, selectedCategory, selectedNodeId]);

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const onResize = () => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory, previousNodeId).map((id) => ({
        id,
      }));
      flow.fitView({ nodes: corridor, duration: 420, padding: 0.24 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [flow, gateState, previousNodeId, selectedCategory, selectedNodeId]);

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const timer = window.setTimeout(() => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory, previousNodeId).map((id) => ({
        id,
      }));
      flow.fitView({ nodes: corridor, duration: 620, padding: detailDominant ? 0.28 : 0.18 });
    }, 360);
    return () => window.clearTimeout(timer);
  }, [detailDominant, flow, gateState, previousNodeId, selectedCategory, selectedNodeId]);

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
        <div className="connection-rail" aria-label="node connections">
          <div className="connection-current">
            <span>今見ている</span>
            <strong>{selectedNode.data.title}</strong>
          </div>
          <div className="connection-next">
            <span>次に進める</span>
            <div>
              {connectionItems.map(({ node, kind }) => (
                <button key={node.id} onClick={() => focusNode(node.id)} type="button">
                  <em>{kind}</em>
                  {node.data.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={setFlow}
          onNodeClick={(_, node) => focusNode(node.id)}
          fitView
          elementsSelectable={false}
          nodesConnectable={false}
          nodesDraggable={false}
          multiSelectionKeyCode={null}
          selectionKeyCode={null}
          selectNodesOnDrag={false}
          minZoom={0.45}
          maxZoom={1.6}
        >
          <Background color="#1b2a31" gap={34} size={0.6} />
        </ReactFlow>
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

            <section className="learning-brief">
              <h3>ゴール</h3>
              <p>{phaseUi[activePhase].guide}</p>
              <div className="takeaway-list" aria-label="このノードで増える手札">
                {getTakeaways(selectedNode.data).map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <details className="brief-more">
                <summary><SummaryLabel>最初の3手</SummaryLabel></summary>
                <p>{compactText(selectedNode.data.intent)}</p>
                <ol>
                  {firstSteps.map((item) => (
                    <li key={item.label}>{compactText(item.how)}</li>
                  ))}
                </ol>
              </details>
            </section>

            <details className="screenshot-block">
              <summary><SummaryLabel>画面例を見る</SummaryLabel></summary>
              <ScreenshotMock node={selectedNode.data} />
            </details>

            <details className="detail-block">
              <summary><SummaryLabel>何それ？</SummaryLabel></summary>
              <div className="doc-split">
                <div>
                  <strong>定義</strong>
                  <p>{selectedNode.data.what}</p>
                </div>
                <div>
                  <strong>例</strong>
                  <ul>
                    {getExampleItems(selectedNode.data).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>よくある勘違い</strong>
                  <p>見えている単語やツール名だけで判断しない。何を見て、何が根拠で、次にどこへ進むかを分ける</p>
                </div>
              </div>
            </details>

            <details className="detail-block">
              <summary><SummaryLabel>なぜ見るか</SummaryLabel></summary>
              <p>{compactText(selectedNode.data.intent)}</p>
              <p className="risk-note">{getRiskText(selectedNode.data)}</p>
            </details>

            <details className="detail-block">
              <summary><SummaryLabel>どう見るか</SummaryLabel></summary>
              <ol className="observe-list">
                {selectedNode.data.observe.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{compactText(item.how)}</p>
                    <details className="inline-help">
                      <summary><SummaryLabel>何それ？</SummaryLabel></summary>
                      <p>{compactText(item.what)}</p>
                      <p>{getObserveExample(item)}</p>
                      <p>{getObserveNextHint(item, selectedNode.data)}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </details>

            <section className="detail-explain-grid">
              <details>
                <summary><SummaryLabel>ミニ例</SummaryLabel></summary>
                <p>{getMiniExample(selectedNode.data)}</p>
              </details>
              <details>
                <summary><SummaryLabel>判断基準</SummaryLabel></summary>
                <p>{getDecisionText(selectedNode.data)}</p>
                <ul className="decision-list">
                  <li>進む: 見たもの、分かったこと、次に見る理由を一文で言える</li>
                  <li>戻る: どの画面、通信、ファイル、ログを根拠にしたか説明できない</li>
                  <li>分岐: 条件が見えたら、下の「条件が見えたら」から近いノードへ進む</li>
                </ul>
              </details>
            </section>

            <details className="detail-block">
              <summary><SummaryLabel>どうなっていたら選択肢が増えるか</SummaryLabel></summary>
              <ul>
                {selectedNode.data.branches.length > 0 ? (
                  selectedNode.data.branches.map((branch) => (
                    <li key={`${branch.signal}-choice`}>
                      <strong>{branch.signal}</strong>
                      <span>{branch.action}</span>
                    </li>
                  ))
                ) : (
                  <li>同じ観察を別の場所でも説明できたら、次の段階へ進む</li>
                )}
              </ul>
            </details>

            <section className="detail-next-strip" aria-label="next learning nodes">
              <span>おすすめの次</span>
              <div>
                {connectionItems.map(({ node, kind }) => (
                  <button key={node.id} onClick={() => focusNode(node.id)} type="button">
                    <em>{kind}</em>
                    <strong>{node.data.title}</strong>
                  </button>
                ))}
              </div>
            </section>

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
              <summary><SummaryLabel>詳しく読む</SummaryLabel></summary>
              <p>{selectedNode.data.details}</p>
              <p className="safety-note">{selectedNode.data.safety}</p>
            </details>

            <details className="note-template">
              <summary><SummaryLabel>観察ログ</SummaryLabel></summary>
              <p>見たもの: {logExample.seen}</p>
              <p>分かったこと: {logExample.learned}</p>
              <p>まだ不明なこと: {logExample.unknown}</p>
              <p>次に確認すること: {logExample.next}</p>
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
  const [openHelpId, setOpenHelpId] = useState<CategoryId | null>(null);

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
        <div className={`category-grid ${openHelpId ? 'has-help-focus' : ''}`}>
          {categories.map((category) => (
            <article
              className={`category-card ${
                openHelpId === category.id ? 'is-help-open' : openHelpId ? 'is-help-dimmed' : ''
              }`}
              key={category.id}
              style={{ '--node-color': category.color } as React.CSSProperties}
            >
              <button className="category-main" onClick={() => onSelect(category.id)} type="button">
                <small>{category.englishTitle}</small>
                <strong>{category.title}</strong>
                <span className="category-keywords">
                  {getCategoryKeywords(category).map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </span>
              </button>
              <details
                onToggle={(event) => {
                  const isOpen = event.currentTarget.open;
                  if (isOpen) {
                    setOpenHelpId(category.id);
                    return;
                  }
                  setOpenHelpId((current) => (current === category.id ? null : current));
                }}
                open={openHelpId === category.id}
              >
                <summary><SummaryLabel>何それ？</SummaryLabel></summary>
                <p>{category.what}</p>
              </details>
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
