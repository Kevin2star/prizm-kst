import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import ErrorBoundary from '../components/ErrorBoundary'
import GroupCards from '../components/GroupCards'
import MindmapTree, { collectMajors, colorForMajor } from '../components/MindmapTree'
import SourcePanel from '../components/SourcePanel'
import { connectSpaceRealtime } from '../realtime'
import { loadSession, sessionMatchesSpace } from '../session'

export default function SpacePage() {
  const { spaceId } = useParams()
  const navigate = useNavigate()
  const session = loadSession()
  const [space, setSpace] = useState(null)
  const [graph, setGraph] = useState(null)
  const [artifacts, setArtifacts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [panel, setPanel] = useState(null)

  useEffect(() => {
    if (!sessionMatchesSpace(spaceId)) {
      navigate('/join')
    }
  }, [spaceId, navigate])

  async function refresh() {
    const [spaceData, graphData, list] = await Promise.all([
      api.getSpace(spaceId),
      api.getGraph(spaceId),
      api.listArtifacts(spaceId),
    ])
    setSpace(spaceData)
    setGraph(graphData)
    setArtifacts(list)
    setExpanded((current) => {
      if (current.size > 0) return current
      const next = new Set()
      next.add(graphData.root.id)
      ;(graphData.root.children || [])
        .filter((child) => child.type === 'GROUP')
        .forEach((child) => next.add(child.id))
      return next
    })
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message))
    const stop = connectSpaceRealtime(spaceId, () => {
      refresh().catch(() => {})
    })
    return stop
  }, [spaceId])

  const majors = useMemo(() => [...collectMajors(graph?.root)], [graph])

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onUpload(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api.createArtifact(spaceId, {
        memberId: Number(session.memberId),
        title,
        content,
      })
      setArtifacts((current) => [created, ...current])
      setTitle('')
      setContent('')
      refresh().catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function openArtifact(id) {
    const detail = await api.getArtifact(id)
    setPanel({ title: detail.title, items: detail })
  }

  async function openSources(ids) {
    const details = await Promise.all((ids || []).map((id) => api.getArtifact(id)))
    setPanel({ title: `소스 ${details.length}개 보기`, items: details })
  }

  return (
    <div className="space-shell">
      <header className="space-header">
        <div>
          <p className="eyebrow">Prizm</p>
          <h1>{space?.name || '스페이스'}</h1>
          <p>
            코드 {space?.joinCode || session.joinCode} · {session.nickname} / {session.major}
          </p>
        </div>
        <Link to="/join" className="btn">
          다른 프로필
        </Link>
      </header>
      <div className="space-grid">
        <section className="upload-pane">
          <h2>결과물 올리기</h2>
          <form onSubmit={onUpload} className="form">
            <label>
              제목
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              본문
              <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
            </label>
            <button className="btn primary" disabled={busy} type="submit">
              {busy ? '올리는 중' : '업로드'}
            </button>
          </form>
          {error ? <p className="error">{error}</p> : null}
          <h3>최근 업로드</h3>
          <ul className="recent">
            {artifacts.map((item) => (
              <li key={item.id}>
                <button type="button" className="linkish" onClick={() => openArtifact(item.id)}>
                  {item.title}
                </button>
                <span>
                  {item.nickname} · {item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="canvas">
          <div className="legend">
            {majors.map((major) => (
              <span key={major}>
                <i className="dot" style={{ background: colorForMajor(major) }} />
                {major}
              </span>
            ))}
          </div>
          {graph?.root ? (
            <ErrorBoundary fallback={<GroupCards root={graph.root} onOpenArtifact={openArtifact} onOpenSources={openSources} />}>
              <MindmapTree
                node={graph.root}
                expanded={expanded}
                onToggle={toggle}
                onOpenArtifact={openArtifact}
                onOpenSources={openSources}
              />
            </ErrorBoundary>
          ) : (
            <p>마인드맵이 곧 여기에 표시됩니다</p>
          )}
        </section>
        {panel ? (
          <SourcePanel
            title={panel.title}
            items={panel.items}
            onClose={() => setPanel(null)}
            onOpen={openArtifact}
          />
        ) : null}
      </div>
    </div>
  )
}
