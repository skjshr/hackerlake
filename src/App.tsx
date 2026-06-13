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
import { motion } from 'framer-motion';
import { Check, Radar, TerminalSquare } from 'lucide-react';
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

const phaseUi: Record<AttackPhase, { label: string; guide: string }> = {
  偵察: {
    label: '問題文を読む',
    guide: '対象を壊さず眺めて、何が入力で、何が出力で、どこまで見てよいかを決める。',
  },
  列挙: {
    label: '観察する',
    guide: '見つけた入口を種類別に並べ、次に深く見る候補を選べる状態にする。',
  },
  侵入: {
    label: '仮説を確認',
    guide: '突破手順ではなく、入口仮説が本当に成り立つかを許可範囲で小さく確認する。',
  },
  権限昇格: {
    label: '差分を見る',
    guide: '権限、条件、影響範囲の差を読み、何ができる状態に変わるかを理解する。',
  },
  '維持・痕跡消去': {
    label: '記録する',
    guide: '隠蔽手順ではなく、何が残り、どう記録し、どう防御・復習へ戻すかを見る。',
  },
};

function getConnectionKind(current: LearningNodeData, target: LearningNodeData) {
  if (target.level > current.level) return '次の段階';
  if (target.level < current.level) return '前提確認';
  return '同じ段階';
}

function getMiniExample(node: LearningNodeData) {
  const [first, second] = node.observe;
  if (!first) return `${node.title}では、まず対象を一つだけ選び、見えた事実を短く記録する。`;
  const next = second ? `次に「${second.label}」も見て、同じ説明でつながるか確認する。` : '次に、同じ観察をもう一度別の対象で確認する。';
  return `例: 「${first.label}」を見るときは、${first.how} 見えた内容を「${first.what}」としてメモする。${next}`;
}

function getDecisionText(node: LearningNodeData) {
  const labels = node.observe.slice(0, 3).map((item) => `「${item.label}」`).join('、');
  return `${labels || '観察項目'}を自分の言葉で説明できたら次へ進む。説明できない項目があるなら、前のノードへ戻って問題文、画面、ログ、配布物のどれを見落としたか確認する。`;
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

function ScreenshotMock({ node }: { node: LearningNodeData }) {
  const first = node.observe[0];
  const second = node.observe[1];
  const third = node.observe[2];

  if (node.category === 'web') {
    return (
      <div className="screen-mock screen-web" aria-label="Web画面例">
        <div className="screen-toolbar">
          <i />
          <i />
          <i />
          <span>https://ctf-lab.local/app</span>
        </div>
        <div className="web-layout">
          <nav>
            <strong>検証ポータル</strong>
            <span>ホーム</span>
            <span>ログイン</span>
            <span>アップロード</span>
          </nav>
          <main>
            <section>
              <h4>{node.title}</h4>
              <p>{node.summary}</p>
              <label>検索</label>
              <div className="fake-input">user=guest</div>
            </section>
            <aside>
              <span>Cookie: session=...</span>
              <span>状態: 200</span>
              <span>方式: GET</span>
            </aside>
          </main>
        </div>
      </div>
    );
  }

  if (node.category === 'network') {
    return (
      <div className="screen-mock screen-terminal" aria-label="ネットワーク画面例">
        <div className="screen-toolbar">
          <i />
          <i />
          <i />
          <span>ラボ端末</span>
        </div>
        <div className="terminal-lines">
          <p>$ observe lab-network --scope allowed</p>
          <p>host-a.lab  10.10.0.12  http  open</p>
          <p>host-b.lab  10.10.0.21  ssh   filtered</p>
          <p>観察: {first?.label ?? node.title}</p>
        </div>
      </div>
    );
  }

  if (node.category === 'forensics') {
    return (
      <div className="screen-mock screen-forensics" aria-label="フォレンジック画面例">
        <div className="screen-toolbar">
          <i />
          <i />
          <i />
          <span>case.zip / 証拠ビューア</span>
        </div>
        <div className="evidence-grid">
          <div>
            <span>image001.png</span>
            <span>access.log</span>
            <span>capture.pcap</span>
          </div>
          <pre>0000  89 50 4e 47 0d 0a 1a 0a{"\n"}0010  49 48 44 52 00 00 03 20{"\n"}0020  {node.title.slice(0, 18)}</pre>
        </div>
      </div>
    );
  }

  if (node.category === 'crypto') {
    return (
      <div className="screen-mock screen-crypto" aria-label="暗号画面例">
        <div className="screen-toolbar">
          <i />
          <i />
          <i />
          <span>problem.txt / 問題文</span>
        </div>
        <div className="crypto-paper">
          <p>ciphertext_1 = 6f 2a 90 c1 ...</p>
          <p>ciphertext_2 = 6f 2a 91 54 ...</p>
          <p>hint = same prefix, same length</p>
          <strong>{first?.label ?? node.title}</strong>
        </div>
      </div>
    );
  }

  if (node.category === 'reverse') {
    return (
      <div className="screen-mock screen-reverse" aria-label="リバース画面例">
        <div className="screen-toolbar">
          <i />
          <i />
          <i />
          <span>文字列一覧 / sample.bin</span>
        </div>
        <div className="reverse-columns">
          <pre>00401210  check_input{"\n"}00401248  verify_user{"\n"}00401302  success</pre>
          <div>
            <span>{first?.label ?? node.title}</span>
            <span>{second?.label ?? '入力の流れ'}</span>
            <span>{third?.label ?? '分岐の位置'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-mock screen-pwn" aria-label="Pwn画面例">
      <div className="screen-toolbar">
        <i />
        <i />
        <i />
        <span>デバッガ / ローカルラボ</span>
      </div>
      <div className="pwn-debug">
        <p>入力サイズ: 64 bytes</p>
        <p>結果: ローカルラボ内で再現</p>
        <p>見る点: {first?.label ?? node.title}</p>
        <p>許可された環境の外では試さない</p>
      </div>
    </div>
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
  const [agreed, setAgreed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(defaultCategory.id);
  const [selectedNodeId, setSelectedNodeId] = useState(defaultCategory.rootNodeId);
  const [history, setHistory] = useState<string[]>([defaultCategory.rootNodeId]);
  const [flow, setFlow] = useState<ReactFlowInstance<Node<LearningNodeData>, Edge> | null>(null);

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

  const focusNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (!node) return;
      setSelectedNodeId(nodeId);
      setSelectedCategory(node.data.category);
      setHistory((current) => {
        if (current[current.length - 1] === nodeId) return current;
        return [...current.slice(-7), nodeId];
      });
      requestAnimationFrame(() => {
        const corridor = getFlowWindowIds(nodeId, node.data.category, selectedNodeId).map((id) => ({
          id,
        }));
        flow?.fitView({ nodes: corridor, duration: 720, padding: 0.2 });
      });
    },
    [flow, selectedNodeId],
  );

  const chooseCategory = useCallback((categoryId: CategoryId) => {
    const category = getCategory(categoryId);
    setSelectedCategory(categoryId);
    setSelectedNodeId(category.rootNodeId);
    setHistory([category.rootNodeId]);
    setGateState('workspace');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  }, []);

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const timer = window.setTimeout(() => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory).map((id) => ({ id }));
      flow.fitView({ nodes: corridor, duration: 700, padding: 0.18 });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [flow, gateState, selectedCategory, selectedNodeId]);

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const onResize = () => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory, previousNodeId).map((id) => ({
        id,
      }));
      flow.fitView({ nodes: corridor, duration: 260, padding: 0.24 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [flow, gateState, previousNodeId, selectedCategory, selectedNodeId]);

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
        {gateState === 'notice' && (
          <>
            <NoticeGate
              agreed={agreed}
              onAgreedChange={setAgreed}
              onEnter={() => agreed && setGateState('category')}
            />
            <BootScreen overlay />
          </>
        )}
        {gateState === 'category' && <CategoryGate onSelect={chooseCategory} />}
        {gateState === 'workspace' && (
          <motion.div
            className={`app-shell ${selectedNodeId !== selectedRootId ? 'has-selected-focus' : ''}`}
            initial={false}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
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
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <div className="detail-heading">
              <span>{selectedCategoryData.title} / {phaseUi[activePhase].label}</span>
              <h2>{selectedNode.data.title}</h2>
              <p className="lead">{selectedNode.data.summary}</p>
            </div>

            <section className="learning-brief">
              <h3>ゴール</h3>
              <p>{phaseUi[activePhase].guide}</p>
              <details className="brief-more">
                <summary>最初の3手</summary>
                <p>{selectedNode.data.intent}</p>
                <ol>
                  {firstSteps.map((item) => (
                    <li key={item.label}>{item.how}</li>
                  ))}
                </ol>
              </details>
            </section>

            <details className="screenshot-block">
              <summary>画面例を見る</summary>
              <ScreenshotMock node={selectedNode.data} />
            </details>

            <details className="detail-block">
              <summary>何それ？</summary>
              <p>{selectedNode.data.what}</p>
            </details>

            <details className="detail-block">
              <summary>なぜ見るか</summary>
              <p>{selectedNode.data.intent}</p>
            </details>

            <details className="detail-block">
              <summary>どう見るか</summary>
              <ol className="observe-list">
                {selectedNode.data.observe.slice(0, 4).map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong>
                    <p>{item.how}</p>
                    <details className="inline-help">
                      <summary>何それ？</summary>
                      <p>{item.what}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </details>

            <section className="detail-explain-grid">
              <details>
                <summary>ミニ例</summary>
                <p>{getMiniExample(selectedNode.data)}</p>
              </details>
              <details>
                <summary>判断基準</summary>
                <p>{getDecisionText(selectedNode.data)}</p>
              </details>
            </section>

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
                <summary>条件が見えたら</summary>
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
                        <em>{targetNode ? branch.action : '観察メモに残す'}</em>
                      </button>
                    );
                  })}
                </div>
              </details>
            )}

            <details className="detail-block">
              <summary>詳しく読む</summary>
              <p>{selectedNode.data.details}</p>
              <p className="safety-note">{selectedNode.data.safety}</p>
            </details>

            <details className="note-template">
              <summary>観察ログ</summary>
              <p>見たもの: ______</p>
              <p>分かったこと: ______</p>
              <p>まだ不明なこと: ______</p>
              <p>次に確認すること: ______</p>
            </details>
          </motion.section>
      </aside>
          </motion.div>
        )}
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
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.32, ease: [0.2, 0.9, 0.2, 1] }}
    >
      <div className="category-shell">
        <div className="category-heading">
          <h1>ジャンルを選ぶ</h1>
          <p>今から見る対象をひとつ選ぶ。各ジャンルに偵察から記録整理までの流れを入れてある。</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <article
              className="category-card"
              key={category.id}
              style={{ '--node-color': category.color } as React.CSSProperties}
            >
              <button className="category-main" onClick={() => onSelect(category.id)} type="button">
                <strong>{category.title}</strong>
                <span>{category.subtitle}</span>
                <em>{category.choose}</em>
              </button>
              <details>
                <summary>何それ？</summary>
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
  onAgreedChange: (value: boolean) => void;
  onEnter: () => void;
};

function NoticeGate({ agreed, onAgreedChange, onEnter }: NoticeGateProps) {
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
          HackerLakeは、攻撃手順を配るサイトではありません。CTFと自分の検証環境で、状況を読み、次の一手を選ぶための訓練用UIです。
        </p>
        <div className="notice-list">
          <span>許可されていない対象については、スキャンだけでも法律や規約に抵触する可能性があります。</span>
          <span>不正アクセス、侵入、実サービスへの試行を推奨するものではありません。</span>
          <span>学習、CTF、自分が管理する検証環境だけを前提に進めてください。</span>
        </div>
        <label className={`consent-line ${agreed ? 'checked' : ''}`}>
          <input
            checked={agreed}
            onChange={(event) => onAgreedChange(event.target.checked)}
            type="checkbox"
          />
          <span className="box">{agreed && <Check size={15} />}</span>
          <span>上記を理解し、許可された学習範囲でのみ使用する</span>
        </label>
        <button className="enter-button" disabled={!agreed} onClick={onEnter} type="button">
          <span>ENTER</span>
          <TerminalSquare size={18} />
        </button>
      </div>
    </motion.section>
  );
}
