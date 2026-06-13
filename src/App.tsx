import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Braces,
  Check,
  Cpu,
  FileSearch,
  Globe2,
  History,
  Layers3,
  LockKeyhole,
  Network,
  Radar,
  RotateCcw,
  ShieldCheck,
  Siren,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import {
  categories,
  getCategory,
  getNode,
  learningEdges,
  learningNodes,
  type CategoryId,
  type LearningNodeData,
} from './data/knowledge';

type HistoryItem = {
  id: string;
  title: string;
  category: CategoryId;
};

type GateState = 'boot' | 'notice' | 'workspace';

const categoryIcons: Record<CategoryId, typeof Globe2> = {
  web: Globe2,
  network: Network,
  forensics: FileSearch,
  crypto: LockKeyhole,
  reverse: Cpu,
  pwn: Braces,
};

function LearningNode({ data, selected }: NodeProps<Node<LearningNodeData>>) {
  const category = getCategory(data.category);

  return (
    <div
      className={`learning-node level-${data.level} ${selected ? 'selected' : ''}`}
      style={{ '--node-color': category.color } as React.CSSProperties}
    >
      <Handle className="node-handle node-handle-target" position={Position.Left} type="target" />
      <Handle className="node-handle node-handle-source" position={Position.Right} type="source" />
      <div className="node-glow" />
      <div className="node-corner node-corner-a" />
      <div className="node-corner node-corner-b" />
      <div className="node-topline">
        <span>{category.title.toUpperCase()}</span>
        <span>D{data.level}</span>
      </div>
      <strong>{data.title}</strong>
      <p>{data.summary}</p>
      <span className="node-expand-hint">詳細へ</span>
    </div>
  );
}

const nodeTypes = { learning: LearningNode };

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
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'web-root', title: 'Web画面を表示', category: 'web' },
  ]);
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
  const previousNodeId = history.length >= 2 ? history[history.length - 2].id : undefined;
  const selectedRootId = getCategory(selectedCategory).rootNodeId;
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
        const next = { id: nodeId, title: node.data.title, category: node.data.category };
        if (current[current.length - 1]?.id === nodeId) return current;
        return [...current.slice(-7), next];
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

  const focusCategory = (categoryId: CategoryId) => {
    const rootId = getCategory(categoryId).rootNodeId;
    focusNode(rootId);
  };

  const resetView = () => {
    setSelectedCategory('web');
    focusNode('web-root');
    requestAnimationFrame(() => {
      const corridor = getFlowWindowIds('web-root', 'web').map((id) => ({ id }));
      flow?.fitView({ nodes: corridor, duration: 600, padding: 0.18 });
    });
  };

  useEffect(() => {
    if (!flow || gateState !== 'workspace') return;
    const timer = window.setTimeout(() => {
      const corridor = getFlowWindowIds(selectedNodeId, selectedCategory).map((id) => ({ id }));
      flow.fitView({ nodes: corridor, duration: 700, padding: 0.18 });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [flow, gateState, selectedCategory, selectedNodeId]);

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
            className="app-shell"
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
            <span>observe / reason / decide</span>
          </div>
        </div>
        <nav className="mode-tabs" aria-label="learning modes">
          <span className="mode active">observe</span>
          <span className="mode">reason</span>
          <span className="mode">decide</span>
        </nav>
        <button className="ghost-button" onClick={resetView} type="button">
          <RotateCcw size={16} />
          Reset
        </button>
      </header>

      <aside className="category-rail">
        <div className="panel-title">
          <Layers3 size={16} />
          <span>surface</span>
        </div>
        {categories.map((category) => {
          const Icon = categoryIcons[category.id];
          return (
            <button
              key={category.id}
              className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => focusCategory(category.id)}
              style={{ '--category-color': category.color } as React.CSSProperties}
              type="button"
            >
              <Icon size={18} />
              <span>
                <strong>{category.title}</strong>
                <small>{category.subtitle}</small>
              </span>
            </button>
          );
        })}
      </aside>

      <main className="map-stage">
        <div className="stage-header">
          <div>
            <span className="tiny-label">open state reading</span>
            <h1>{selectedNode.data.title}</h1>
          </div>
          <div className="pulse-meter">
            <Activity size={16} />
            <span>depth {selectedNode.data.level} / live path</span>
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
          <Background color="#27405e" gap={28} size={1} />
          <Controls showInteractive={false} />
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
            <div className="detail-kicker">
              <TerminalSquare size={16} />
              <span>観察メモ</span>
            </div>
            <h2>{selectedNode.data.title}</h2>
            <p className="lead">{selectedNode.data.intent}</p>

            <div className="detail-block">
              <h3>確認ポイント</h3>
              <ul>
                {selectedNode.data.signals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="detail-block">
              <h3>見る札</h3>
              <div className="chips">
                {selectedNode.data.observe.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <h3>詳細な説明</h3>
              <p>{selectedNode.data.details}</p>
            </div>

            <div className="safety-note">
              <ShieldCheck size={15} />
              {selectedNode.data.safety}
            </div>

            <div className="next-actions">
              {selectedNode.data.next.length ? (
                selectedNode.data.next.map((id) => {
                  const node = getNode(id);
                  if (!node) return null;
                  return (
                    <button key={id} onClick={() => focusNode(id)} type="button">
                      {node.data.title}
                    </button>
                  );
                })
              ) : (
                <button onClick={() => focusCategory(selectedCategory)} type="button">
                  <ArrowLeft size={14} />
                  面へ戻る
                </button>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </aside>

      <footer className="history-strip">
        <div className="panel-title">
          <History size={16} />
          <span>trail</span>
        </div>
        <div className="history-items">
          {history.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              onClick={() => focusNode(item.id)}
              className={item.id === selectedNodeId ? 'active' : ''}
              type="button"
            >
              <span>{index + 1}</span>
              {item.title}
            </button>
          ))}
        </div>
        <div className="study-card">
          <Zap size={15} />
          <span>手札: {selectedNode.data.next.length || 'review'}</span>
        </div>
        <div className="study-card">
          <BookOpen size={15} />
          <span>field note 01</span>
        </div>
      </footer>
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
        <div className="boot-code">
          <span>init: self-audit</span>
          <span>map: dormant</span>
          <span>ethics: required</span>
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
        <div className="notice-status">
          <Siren size={18} />
          <span>LEGAL BOUNDARY CHECK</span>
        </div>
        <h1>許可のない対象には触れない</h1>
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
        <small>checkbox + ENTER key</small>
      </div>
    </motion.section>
  );
}
