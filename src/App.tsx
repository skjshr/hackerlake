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
  type CategoryId,
  type LearningNodeData,
} from './data/knowledge';

type GateState = 'notice' | 'category' | 'workspace';

function LearningNode({ data, selected }: NodeProps<Node<LearningNodeData>>) {
  const category = getCategory(data.category);

  return (
    <div
      className={`learning-node level-${data.level} ${selected ? 'selected' : ''}`}
      style={{ '--node-color': category.color } as React.CSSProperties}
    >
      <Handle className="node-handle node-handle-target" position={Position.Left} type="target" />
      <Handle className="node-handle node-handle-source" position={Position.Right} type="source" />
      <strong>{data.title}</strong>
    </div>
  );
}

const nodeTypes = { learning: LearningNode };
const defaultCategory = categories[0]!;

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
  const activePhase = selectedNode.data.phase;
  const previousNodeId = history.length >= 2 ? history[history.length - 2] : undefined;
  const selectedRootId = getCategory(selectedCategory).rootNodeId;
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
          selected: node.id === selectedNodeId,
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
              {phase}
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
            <h1>{selectedNode.data.title}</h1>
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={setFlow}
          onNodeClick={(_, node) => focusNode(node.id)}
          fitView
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
              <h2>{selectedNode.data.title}</h2>
              <p className="lead">{selectedNode.data.summary}</p>
            </div>

            <details className="detail-block">
              <summary>何それ？</summary>
              <p>{selectedNode.data.what}</p>
            </details>

            <details className="detail-block">
              <summary>なぜ見るか</summary>
              <p>{selectedNode.data.intent}</p>
            </details>

            <details className="detail-block" open>
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
            </details>

            <details className="detail-block">
              <summary>次に見る</summary>
              <div className="next-actions">
                {displayedNextIds.map((id) => {
                  const node = getNode(id);
                  if (!node) return null;
                  return (
                    <button key={id} onClick={() => focusNode(id)} type="button">
                      {node.data.title}
                    </button>
                  );
                })}
              </div>
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
