const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0f766e', '#ea580c']

const MEMBER_PALETTE = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#db2777',
  '#0f766e',
  '#ea580c',
  '#4f46e5',
  '#0891b2',
  '#ca8a04',
  '#be123c',
  '#15803d',
  '#9333ea',
  '#c2410c',
  '#0369a1',
  '#a21caf',
]

export function colorForMajor(label) {
  if (!label) return '#9ca3af'
  let hash = 0
  for (let i = 0; i < label.length; i += 1) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function identityKey(nickname, memberId) {
  if (memberId != null && String(memberId).trim() !== '') return `id:${memberId}`
  const nick = String(nickname || '').trim().toLowerCase()
  return nick ? `nick:${nick}` : 'id:unknown'
}

export function memberColorMap(members) {
  const list = [...(members || [])].sort((a, b) => String(a.key).localeCompare(String(b.key), 'ko'))
  const n = list.length
  const map = new Map()
  list.forEach((member, index) => {
    const color =
      n <= MEMBER_PALETTE.length
        ? MEMBER_PALETTE[index]
        : `hsl(${Math.round((360 * index) / n)} 58% 42%)`
    map.set(member.key, color)
  })
  return map
}

export function collectMajors(node, set = new Set()) {
  if (!node) return set
  if (node.nickname) set.add(node.nickname)
  ;(node.children || []).forEach((child) => collectMajors(child, set))
  ;(node.items || []).forEach((item) => item.nickname && set.add(item.nickname))
  return set
}

function StatusMark({ status }) {
  if (status === 'PENDING' || status === 'PROCESSING') return <span className="chip warn">분석 중</span>
  if (status === 'FAILED') return <span className="chip danger">분석 실패 — 원문은 볼 수 있음</span>
  return null
}

export default function MindmapTree({ node, expanded, onToggle, onOpenArtifact, colorForNode, depth = 0 }) {
  if (!node) return null
  const isOpen = expanded.has(node.id) || node.type === 'SPACE'
  const hasChildren = Boolean(node.children && node.children.length)
  const indent = { paddingLeft: depth * 16 }
  const color = colorForNode?.(node) || colorForMajor(node.nickname)

  return (
    <div className="tree-node" style={indent}>
      <div className="tree-row">
        {hasChildren ? (
          <button type="button" className="caret" onClick={() => onToggle(node.id)}>
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className="caret-spacer" />
        )}
        <button
          type="button"
          className="tree-label"
          onClick={() => {
            if (node.type === 'ARTIFACT' && node.artifactId) onOpenArtifact(node.artifactId)
            else if (hasChildren) onToggle(node.id)
          }}
        >
          <span className="dot" style={{ background: color }} />
          {node.label}
          <StatusMark status={node.status} />
        </button>
      </div>
      {isOpen ? (
        <div>
          {(node.children || []).map((child) => (
            <MindmapTree
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onOpenArtifact={onOpenArtifact}
              colorForNode={colorForNode}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
