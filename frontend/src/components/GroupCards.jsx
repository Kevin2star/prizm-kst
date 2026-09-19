export default function GroupCards({ root, onOpenArtifact, onOpenSources }) {
  const groups = (root?.children || []).filter((child) => child.type === 'GROUP')
  const singles = (root?.children || []).filter((child) => child.type === 'ARTIFACT')
  return (
    <div className="cards">
      {groups.map((group) => {
        const common = group.children?.find((c) => c.type === 'COMMON')
        const diff = group.children?.find((c) => c.type === 'DIFF')
        const notes = group.children?.find((c) => c.type === 'NOTES')
        const sources = group.children?.find((c) => c.type === 'SOURCES')
        return (
          <article key={group.id} className="card">
            <h3>
              {group.label} {group.updated ? <span className="chip">업데이트됨</span> : null}
            </h3>
            <p>
              <strong>공통점</strong> {common?.body}
            </p>
            <p>
              <strong>차이점</strong>
            </p>
            <ul>
              {(diff?.items || []).map((item) => (
                <li key={item.artifactId}>{item.summary}</li>
              ))}
            </ul>
            <p>
              <strong>비고</strong> {notes?.body}
            </p>
            <button type="button" className="linkish" onClick={() => onOpenSources(common?.sourceArtifactIds || [])}>
              소스 {common?.sourceArtifactIds?.length || 0}개 보기
            </button>
            <div className="source-list">
              {(sources?.children || []).map((item) => (
                <button key={item.id} type="button" onClick={() => onOpenArtifact(item.artifactId)}>
                  {item.label}
                </button>
              ))}
            </div>
          </article>
        )
      })}
      {singles.map((item) => (
        <article key={item.id} className="card">
          <h3>{item.label}</h3>
          <p>
            {item.nickname} · {item.major}
          </p>
          <button type="button" className="linkish" onClick={() => onOpenArtifact(item.artifactId)}>
            소스 1개 보기
          </button>
        </article>
      ))}
    </div>
  )
}
