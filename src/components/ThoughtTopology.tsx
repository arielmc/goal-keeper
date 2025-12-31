import { useState, useRef } from 'react';
import type { MentalModel } from '../types/cognition';

interface Props {
  model: MentalModel;
  onClose: () => void;
  onAddConcept: (label: string, x: number, y: number) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onUpdateConceptPosition: (conceptId: string, x: number, y: number) => void;
}

export function ThoughtTopology({
  model,
  onClose,
  onAddConcept,
  onAddConnection,
  onUpdateConceptPosition,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [newConceptInput, setNewConceptInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (connecting) {
      setConnecting(null);
      return;
    }

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickPosition({ x, y });
    setShowAddInput(true);
  };

  const handleAddConcept = () => {
    if (newConceptInput.trim()) {
      onAddConcept(newConceptInput.trim(), clickPosition.x, clickPosition.y);
      setNewConceptInput('');
      setShowAddInput(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onUpdateConceptPosition(dragging, x, y);
  };

  const handleConceptClick = (conceptId: string) => {
    if (connecting) {
      if (connecting !== conceptId) {
        onAddConnection(connecting, conceptId);
      }
      setConnecting(null);
    }
  };

  const connectionTypeColors = {
    supports: '#22c55e',
    contradicts: '#ef4444',
    relates: '#3b82f6',
    causes: '#f59e0b',
    requires: '#8b5cf6',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span>🗺️</span> {model.name}
            </h2>
            <p className="text-sm text-gray-400">{model.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConnecting(connecting ? null : 'start')}
              className={`px-3 py-1 text-sm rounded ${
                connecting
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {connecting ? 'Cancel Link' : '🔗 Link Ideas'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative h-[calc(100%-80px)]">
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            onClick={handleSvgClick}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(null)}
          >
            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connections */}
            {model.connections.map(conn => {
              const from = model.concepts.find(c => c.id === conn.fromId);
              const to = model.concepts.find(c => c.id === conn.toId);
              if (!from || !to) return null;

              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <g key={conn.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={connectionTypeColors[conn.type]}
                    strokeWidth={2 + conn.strength * 3}
                    strokeOpacity={0.6}
                    markerEnd="url(#arrowhead)"
                  />
                  {conn.label && (
                    <text
                      x={midX}
                      y={midY - 10}
                      fill="rgba(255,255,255,0.6)"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Arrowhead marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.4)" />
              </marker>
            </defs>

            {/* Concepts */}
            {model.concepts.map(concept => (
              <g
                key={concept.id}
                transform={`translate(${concept.x}, ${concept.y})`}
                className="cursor-pointer"
                onMouseDown={() => !connecting && setDragging(concept.id)}
                onClick={() => handleConceptClick(concept.id)}
              >
                {/* Glow effect */}
                <circle
                  r={30 + concept.importance * 20}
                  fill={`rgba(59, 130, 246, ${0.1 + concept.importance * 0.2})`}
                />
                {/* Main circle */}
                <circle
                  r={20 + concept.importance * 10}
                  fill={concept.color || '#3b82f6'}
                  stroke={connecting === concept.id ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={connecting === concept.id ? 3 : 1}
                />
                {/* Label */}
                <text
                  y={35 + concept.importance * 10}
                  fill="white"
                  fontSize="12"
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {concept.label}
                </text>
              </g>
            ))}
          </svg>

          {/* Add concept input */}
          {showAddInput && (
            <div
              className="absolute bg-gray-800 rounded-lg shadow-xl p-3 border border-gray-700"
              style={{ left: clickPosition.x, top: clickPosition.y }}
            >
              <input
                type="text"
                value={newConceptInput}
                onChange={e => setNewConceptInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddConcept()}
                placeholder="New concept..."
                autoFocus
                className="px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 w-48"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddConcept}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddInput(false)}
                  className="px-3 py-1 text-gray-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 text-xs text-gray-500 space-y-1">
            <div>Click canvas to add concept</div>
            <div>Drag concepts to reposition</div>
            <div>Use "Link Ideas" to connect concepts</div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-gray-800/80 rounded p-3 text-xs">
            <div className="text-gray-400 mb-2">Connection Types:</div>
            {Object.entries(connectionTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: color }} />
                <span className="text-gray-300 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
