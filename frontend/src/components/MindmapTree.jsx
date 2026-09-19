const PALETTE = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0f766e', '#ea580c']

export function colorForMajor(major) {
  if (!major) return '#9ca3af'
  let hash = 0
  for (let i = 0; i < major.length; i += 1) hash = (hash * 31 + major.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function collectMajors(node, set = new Set()) {
  if (!node) return set
  if (node.major) set.add(node.major)
  ;(node.children || []).forEach((child) => collectMajors(child, set))
  ;(node.items || []).forEach((item) => item.major && set.add(item.major))
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
          <span className="dot" style={{ background: colorForMajor(node.major) }} />
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
              <span className="dot" style={{ background: colorForMajor(item.major) }} />
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
