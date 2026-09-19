export default function SourcePanel({ title, items, onClose, onOpen }) {
  if (!items) return null
  return (
    <aside className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <button type="button" className="btn" onClick={onClose}>
          닫기
        </button>
      </div>
      {Array.isArray(items) ? (
        <ul className="panel-list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="linkish" onClick={() => onOpen(item.id)}>
                {item.title || item.label}
              </button>
              <p>
                {item.nickname || item.memberNickname} · {item.school} · {item.major}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <article className="panel-article">
          <p>
            {items.nickname} · {items.school} · {items.major}
          </p>
          <p className="tags">{(items.tags || []).join(' · ')}</p>
          <p className="body-text">{items.content}</p>
        </article>
      )}
    </aside>
  )
}
