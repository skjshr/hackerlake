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
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Radar, TerminalSquare } from 'lucide-react';
import {
  getCategory,
  getNode,
  learningEdges,
  learningNodes,
  type CategoryId,
  type LearningNodeData,
} from './data/knowledge';

type GateState = 'boot' | 'notice' | 'workspace';

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

const attackPhases = ['偵察', '列挙', '侵入', '権限昇格', '維持・痕跡消去'] as const;
const activePhase = '偵察';

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
  const [gateState, setGateState] = useState<GateState>('boot');
  const [agreed, setAgreed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('web');
  const [selectedNodeId, setSelectedNodeId] = useState('web-root');
  const [history, setHistory] = useState<string[]>(['web-root']);
  const [flow, setFlow] = useState<ReactFlowInstance<Node<LearningNodeData>, Edge> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setGateState('notice'), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (gateState !== 'notice') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && agreed) {
        setGateState('workspace');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [agreed, gateState]);

  const selectedNode = getNode(selectedNodeId) ?? getNode('web-root')!;
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

  return (
    <div className="shell-root">
      <div className="ambient-grid" />
      <div className="signal-field" />
      <AnimatePresence mode="wait">
        {gateState === 'boot' && <BootScreen key="boot" />}
        {gateState === 'notice' && (
          <NoticeGate
            key="notice"
            agreed={agreed}
            onAgreedChange={setAgreed}
            onEnter={() => agreed && setGateState('workspace')}
          />
        )}
        {gateState === 'workspace' && (
          <motion.div
            key="workspace"
            className={`app-shell ${selectedNodeId !== selectedRootId ? 'has-selected-focus' : ''}`}
            initial={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
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
        <AnimatePresence mode="wait">
          <motion.section
            key={selectedNodeId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h2>なぜ見るか</h2>
            <p className="lead">{selectedNode.data.intent}</p>

            <details className="detail-block" open>
              <summary>どう見るか</summary>
              <ol className="simple-steps">
                {selectedNode.data.observe.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </details>

            <details className="detail-block">
              <summary>条件が見えたら</summary>
              <div className="branch-cards">
                {selectedNode.data.signals.map((item, index) => {
                  const targetId = displayedNextIds[index % Math.max(displayedNextIds.length, 1)];
                  const targetNode = targetId ? getNode(targetId) : undefined;
                  return (
                    <button
                      key={item}
                      disabled={!targetNode}
                      onClick={() => targetNode && focusNode(targetNode.id)}
                      type="button"
                    >
                      <span>もし</span>
                      <strong>{item}</strong>
                      <em>{targetNode ? `${targetNode.data.title}へ` : '観察メモに残す'}</em>
                    </button>
                  );
                })}
              </div>
            </details>

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
        </AnimatePresence>
      </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BootScreen() {
  return (
    <motion.section
      className="boot-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -18, filter: 'blur(14px)' }}
      transition={{ duration: 0.42 }}
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
          initial={{ opacity: 0, letterSpacing: '0.18em', y: 12 }}
          animate={{ opacity: 1, letterSpacing: '0.05em', y: 0 }}
          transition={{ duration: 0.65, ease: [0.2, 0.9, 0.2, 1] }}
        >
          HACK YOURSELF
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
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
      initial={{ opacity: 0, scale: 0.985 }}
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
