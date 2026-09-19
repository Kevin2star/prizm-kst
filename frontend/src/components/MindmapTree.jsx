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

export default function MindmapTree({ node, expanded, onToggle, onOpenArtifact, onOpenSources, depth = 0 }) {
  if (!node) return null
  const isOpen = expanded.has(node.id) || node.type === 'SPACE'
  const hasChildren = (node.children && node.children.length > 0) || node.type === 'COMMON' || node.type === 'DIFF' || node.type === 'NOTES'
  const indent = { paddingLeft: depth * 16 }

  if (node.type === 'ARTIFACT') {
    return (
      <div className="tree-node" style={indent}>
        <button type="button" className="tree-label" onClick={() => onOpenArtifact(node.artifactId)}>
          <span className="dot" style={{ background: colorForMajor(node.nickname) }} />
          {node.label}
          <StatusMark status={node.status} />
        </button>
      </div>
    )
  }

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
        <button type="button" className="tree-label" onClick={() => onToggle(node.id)}>
          {node.label}
          {node.updated ? <span className="chip">업데이트됨</span> : null}
        </button>
        {node.sourceArtifactIds?.length ? (
          <button type="button" className="linkish" onClick={() => onOpenSources(node.sourceArtifactIds)}>
            소스 {node.sourceArtifactIds.length}개 보기
          </button>
        ) : null}
      </div>
      {isOpen ? (
        <div>
          {node.body ? <p className="tree-body">{node.body}</p> : null}
          {node.items?.map((item) => (
            <p key={`${item.artifactId}-${item.summary}`} className="tree-body">
              <span className="dot" style={{ background: colorForMajor(item.nickname) }} />
              {item.summary}
            </p>
          ))}
          {(node.children || []).map((child) => (
            <MindmapTree
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onOpenArtifact={onOpenArtifact}
              onOpenSources={onOpenSources}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
