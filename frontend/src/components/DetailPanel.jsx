import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STORAGE_KEY = 'prizm.sourcePanelWidth'
const MIN_WIDTH = 320
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

function ResultSummaryCard({ title, body }) {
  return (
    <article className="nlm-result-card">
      <h3>{title}</h3>
      <p>{body || '아직 분석 결과가 없습니다.'}</p>
    </article>
  )
}

function RawDataCard({ id, title, subtitle, body }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`nlm-raw-card${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <header>
        <span className="nlm-raw-handle" aria-hidden="true">
          ⋮⋮
        </span>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="nlm-raw-sub">{subtitle}</p> : null}
        </div>
      </header>
      <pre>{body || '(내용 없음)'}</pre>
    </article>
  )
}

export default function DetailPanel({ artifact, busy, onClose, onCompare, containerRef }) {
  const panelRef = useRef(null)
  const widthRef = useRef(readStoredWidth())
  const [width, setWidth] = useState(widthRef.current)
  const [order, setOrder] = useState(['parent', 'child'])

  const isComparison = Boolean(artifact?.parentId || artifact?.parent || artifact?.comparisonCommon || artifact?.comparisonDiff)

  const rawItems = useMemo(() => {
    if (!artifact) return []
    const parent = {
      id: 'parent',
      title: artifact.parent?.title || '부모 원본',
      subtitle: [artifact.parent?.nickname, artifact.parent?.sourceName].filter(Boolean).join(' · '),
      body: artifact.parent?.content || '',
    }
    const child = {
      id: 'child',
      title: artifact.sourceName || artifact.title || '새 원본',
      subtitle: [artifact.nickname, artifact.sourceName].filter(Boolean).join(' · '),
      body: artifact.content || '',
    }
    return { parent, child }
  }, [artifact])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
  }, [artifact])

  useEffect(() => {
    setOrder(['parent', 'child'])
  }, [artifact?.id])

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

  function onDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setOrder((current) => arrayMove(current, current.indexOf(active.id), current.indexOf(over.id)))
  }

  if (!artifact) return null

  return (
    <aside className="panel nlm-detail-panel" ref={panelRef} style={{ width: `${width}px` }}>
      <div className="nlm-panel-resizer" onMouseDown={startResize} role="separator" aria-orientation="vertical" aria-label="상세 패널 너비 조절" />
      <div className="panel-inner">
        <div className="panel-head nlm-detail-head">
          <h2>{artifact.title}</h2>
          <div className="nlm-detail-actions">
            <button type="button" className="nlm-compare-btn" onClick={onCompare} disabled={busy}>
              비교하기
            </button>
            <button type="button" className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
        {artifact.nickname ? <p className="nlm-detail-meta">{artifact.nickname}</p> : null}

        {isComparison ? (
          <div className="nlm-detail-split">
            <section className="nlm-detail-analysis">
              <h3 className="nlm-detail-section-title">분석 결과</h3>
              {artifact.status === 'PENDING' || artifact.status === 'PROCESSING' ? (
                <p className="nlm-muted">비교 분석 중입니다…</p>
              ) : (
                <div className="nlm-result-grid">
                  <ResultSummaryCard title="공통점" body={artifact.comparisonCommon} />
                  <ResultSummaryCard title="차이점" body={artifact.comparisonDiff} />
                </div>
              )}
            </section>
            <section className="nlm-detail-raw">
              <h3 className="nlm-detail-section-title">원본 데이터</h3>
              <p className="nlm-muted">카드를 드래그해 순서를 바꿀 수 있습니다.</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={order} strategy={verticalListSortingStrategy}>
                  <div className="nlm-raw-stack">
                    {order.map((id) => {
                      const item = rawItems[id]
                      if (!item) return null
                      return <RawDataCard key={id} id={id} title={item.title} subtitle={item.subtitle} body={item.body} />
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </div>
        ) : (
          <article className="panel-article">
            <p className="body-text">{artifact.content}</p>
          </article>
        )}
      </div>
    </aside>
  )
}
