import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'prizm.sourcePanelWidth'
const MIN_WIDTH = 280
const DEFAULT_WIDTH = 440

function readStoredWidth() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(value) && value >= MIN_WIDTH) return value
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH
}

function saveWidth(width) {
  try {
    localStorage.setItem(STORAGE_KEY, String(width))
  } catch {
    /* ignore */
  }
}

export default function SourcePanel({ title, items, onClose, onOpen, containerRef }) {
  const panelRef = useRef(null)
  const widthRef = useRef(readStoredWidth())
  const [width, setWidth] = useState(widthRef.current)

  function maxWidth() {
    const parentWidth = containerRef?.current?.getBoundingClientRect().width
    return Math.max(MIN_WIDTH, Math.floor((parentWidth || DEFAULT_WIDTH / 0.45) * 0.8))
  }

  function clamp(next) {
    return Math.min(maxWidth(), Math.max(MIN_WIDTH, Math.round(next)))
  }

  useEffect(() => {
    const next = clamp(widthRef.current)
    widthRef.current = next
    setWidth(next)
    saveWidth(next)
  }, [items])

  useEffect(() => {
    const el = containerRef?.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(() => {
      const next = clamp(widthRef.current)
      if (next === widthRef.current) return
      widthRef.current = next
      setWidth(next)
      saveWidth(next)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  function startResize(event) {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = panelRef.current?.getBoundingClientRect().width || widthRef.current
    const handle = event.currentTarget
    handle.classList.add('resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function move(ev) {
      const next = clamp(startWidth + (startX - ev.clientX))
      widthRef.current = next
      setWidth(next)
    }

    function up() {
      handle.classList.remove('resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      saveWidth(widthRef.current)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  if (!items) return null

  return (
    <aside className="panel" ref={panelRef} style={{ width: `${width}px` }}>
      <div className="nlm-panel-resizer" onMouseDown={startResize} role="separator" aria-orientation="vertical" aria-label="상세 패널 너비 조절" />
      <div className="panel-inner">
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
                  {item.nickname || item.memberNickname}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <article className="panel-article">
            <p>
              {items.nickname}
            </p>
            <p className="tags">{(items.tags || []).join(' · ')}</p>
            <p className="body-text">{items.content}</p>
          </article>
        )}
      </div>
    </aside>
  )
}
