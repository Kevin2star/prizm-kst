import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import ErrorBoundary from '../components/ErrorBoundary'
import GroupCards from '../components/GroupCards'
import MindmapCanvas from '../components/MindmapCanvas'
import MindmapTree, { collectMajors, colorForMajor, identityKey, memberColorMap } from '../components/MindmapTree'
import SourcePanel from '../components/SourcePanel'
import { connectSpaceRealtime } from '../realtime'
import { applySpaceSession, findSpaceMembership, joinSpaceByCode } from '../spaceMembership'
import { clearSession, loadSession, sessionMatchesSpace } from '../session'
import { supabase } from '../supabaseClient'
import './SpaceWorkspace.css'

function isMissingSpace(err) {
  const code = err?.code || ''
  const message = err?.message || ''
  return (
    code === 'SPACE_NOT_FOUND' ||
    /스페이스를 찾을 수 없습니다|참여 코드를 찾을 수 없습니다/.test(message)
  )
}

function shortName(name) {
  const value = String(name || '?')
  return value.length > 3 ? value.slice(0, 3) : value
}

function Icon({ children }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {children}
    </svg>
  )
}

const SIDEBAR_PX = 64

function mapChatMessage(row, sessionMemberId, colorFn) {
  const memberId = row.memberId ?? row.member_id ?? null
  const nickname = row.nickname || '멤버'
  const rawId = row.id
  const id =
    rawId == null
      ? `msg-${Date.now()}`
      : String(rawId).startsWith('msg-') || String(rawId).startsWith('tmp-')
        ? String(rawId)
        : `msg-${rawId}`
  return {
    id,
    name: nickname,
    text: row.body || row.text || '',
    color: colorFn(nickname, memberId),
    mine: memberId != null && String(memberId) === String(sessionMemberId),
    memberId: memberId == null ? null : String(memberId),
    createdAt: row.createdAt || row.created_at || null,
    kind: 'chat',
  }
}

function upsertTeamMessage(current, msg) {
  if (!msg?.id) return current
  if (current.some((item) => item.id === msg.id)) return current
  const next = current.filter((item) => {
    if (!String(item.id).startsWith('tmp-')) return true
    return !(item.text === msg.text && String(item.memberId) === String(msg.memberId))
  })
  return [...next, msg]
}

function startResize(event, workspace, leftCol, rightCol, rightMin) {
  if (!workspace || !leftCol || !rightCol) return
  event.preventDefault()
  const resizer = event.currentTarget
  const startX = event.clientX
  const startLeftWidth = leftCol.getBoundingClientRect().width
  const startRightWidth = rightCol.getBoundingClientRect().width
  resizer.classList.add('resizing')
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  function move(ev) {
    const dx = ev.clientX - startX
    const available = workspace.getBoundingClientRect().width - SIDEBAR_PX
    const newLeft = startLeftWidth + dx
    const newRight = startRightWidth - dx
    if (newLeft < 200 || newRight < rightMin) return
    leftCol.style.width = `${(newLeft / available) * 100}%`
    rightCol.style.width = `${(newRight / available) * 100}%`
  }

  function up() {
    resizer.classList.remove('resizing')
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }

  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

export default function SpacePage() {
  const { spaceId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(() => loadSession())
  const [space, setSpace] = useState(null)
  const [graph, setGraph] = useState(null)
  const [artifacts, setArtifacts] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [panel, setPanel] = useState(null)
  const [copied, setCopied] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [teamDraft, setTeamDraft] = useState('')
  const [teamMessages, setTeamMessages] = useState([])
  const [spaceMembers, setSpaceMembers] = useState([])
  const [sendingTeam, setSendingTeam] = useState(false)
  const [aiMessages, setAiMessages] = useState([
    {
      id: 'intro',
      role: 'ai',
      name: 'AI Assistant',
      text: '자료의 내용을 입력하시면 분석하여 마인드맵에 자동으로 공통점/차이점 등을 분류해 드립니다.',
    },
  ])

  const workspaceRef = useRef(null)
  const teamRef = useRef(null)
  const aiRef = useRef(null)
  const mapRef = useRef(null)
  const canvasRef = useRef(null)
  const teamScrollRef = useRef(null)
  const aiScrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function ensureMembership() {
      if (sessionMatchesSpace(spaceId)) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) navigate('/join')
          return
        }

        const membership = await findSpaceMembership(spaceId, user)
        if (membership) {
          applySpaceSession(membership)
          if (!cancelled) setSession(loadSession())
          return
        }

        const { data: spaceRow } = await supabase
          .from('spaces')
          .select('id, owner_id, join_code')
          .eq('id', spaceId)
          .maybeSingle()
        if (!spaceRow) {
          clearSession()
          if (!cancelled) navigate('/main', { replace: true })
          return
        }
        if (spaceRow.owner_id === user.id && spaceRow.join_code) {
          const member = await joinSpaceByCode(spaceRow.join_code)
          applySpaceSession(
            {
              id: member.id,
              space_id: member.space_id,
              nickname: member.nickname,
            },
            spaceRow.join_code,
          )
          if (!cancelled) setSession(loadSession())
          return
        }
      } catch {
        // keep the join gate below
      }

      if (!cancelled) navigate('/join')
    }

    ensureMembership()
    return () => {
      cancelled = true
    }
  }, [spaceId, navigate])

  async function refresh() {
    const [spaceData, graphData, list, messageResult] = await Promise.all([
      api.getSpace(spaceId),
      api.getGraph(spaceId),
      api.listArtifacts(spaceId),
      api.listMessages(spaceId).catch(() => null),
    ])
    let memberRows = spaceData.members
    if (!Array.isArray(memberRows)) {
      const { data, error } = await supabase
        .from('members')
        .select('id, nickname, user_id')
        .eq('space_id', spaceId)
        .order('id', { ascending: true })
      if (error) throw error
      memberRows = data || []
    }
    let messages = messageResult
    if (!Array.isArray(messages)) {
      const { data, error } = await supabase
        .from('space_messages')
        .select('id, space_id, member_id, nickname, body, created_at')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (error) throw error
      messages = (data || []).map((row) => ({
        id: row.id,
        spaceId: row.space_id,
        memberId: row.member_id,
        nickname: row.nickname,
        body: row.body,
        createdAt: row.created_at,
      }))
    }
    setSpace(spaceData)
    setSpaceMembers(memberRows)
    setGraph(graphData)
    setArtifacts(list)
    setTeamMessages((current) => {
      const incoming = (messages || []).map((row) =>
        mapChatMessage(row, session.memberId, () => '#4b5563'),
      )
      let next = incoming
      current
        .filter((item) => String(item.id).startsWith('tmp-'))
        .forEach((item) => {
          next = upsertTeamMessage(next, item)
        })
      return next
    })
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
    setMapFailed(false)
    setTeamMessages([])
    setSpaceMembers([])
    refresh().catch((err) => {
      if (isMissingSpace(err)) {
        clearSession()
        navigate('/main', { replace: true })
        return
      }
      setError(err.message)
    })
    const stop = connectSpaceRealtime(spaceId, (event) => {
      if (event?.type === 'MESSAGE_ADDED' && event.message) {
        const row = event.message
        setTeamMessages((current) =>
          upsertTeamMessage(
            current,
            mapChatMessage(
              {
                id: row.id,
                memberId: row.member_id ?? row.memberId,
                nickname: row.nickname,
                body: row.body,
                createdAt: row.created_at ?? row.createdAt,
              },
              session.memberId,
              () => '#4b5563',
            ),
          ),
        )
        return
      }
      refresh().catch(() => {})
    })
    return stop
  }, [spaceId])

  const members = useMemo(() => {
    const map = new Map()
    const add = (nickname, memberId) => {
      if (!nickname) return
      const key = identityKey(nickname, memberId)
      const id = memberId == null ? null : String(memberId)
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { key, nickname, memberId: id })
        return
      }
      if (id && !existing.memberId) existing.memberId = id
    }
    spaceMembers.forEach((item) => add(item.nickname, item.id))
    add(session.nickname, session.memberId)
    return [...map.values()]
  }, [spaceMembers, session.memberId, session.nickname])

  const memberColors = useMemo(() => memberColorMap(members), [members])

  function personColor(nickname, memberId) {
    return memberColors.get(identityKey(nickname, memberId)) || '#4b5563'
  }

  const visibleTeamMessages = useMemo(() => {
    const chats = teamMessages.map((msg) => ({
      ...msg,
      color: personColor(msg.name, msg.memberId),
      mine: msg.memberId != null && String(msg.memberId) === String(session.memberId),
    }))
    const uploads = artifacts.map((item) => ({
      id: `up-${item.id}`,
      name: item.nickname || '멤버',
      text: `결과물을 올렸습니다: ${item.title}`,
      color: personColor(item.nickname, item.memberId),
      mine: String(item.memberId) === String(session.memberId),
      memberId: item.memberId == null ? null : String(item.memberId),
      createdAt: item.createdAt || item.created_at || null,
      kind: 'upload',
    }))
    return [...uploads, ...chats].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      if (ta !== tb) return ta - tb
      return String(a.id).localeCompare(String(b.id))
    })
  }, [artifacts, teamMessages, session.memberId, memberColors])

  useEffect(() => {
    setAiMessages((current) =>
      current.map((msg) => {
        if (!msg.artifactId) return msg
        const art = artifacts.find((item) => item.id === msg.artifactId)
        if (!art) return msg
        if (art.status === 'READY' && msg.status !== 'READY') {
          return { ...msg, status: 'READY', pending: false, text: `'${art.title}' 분석을 마인드맵에 반영했습니다.` }
        }
        if (art.status === 'FAILED' && msg.status !== 'FAILED') {
          return { ...msg, status: 'FAILED', pending: false, text: '분석에 실패했습니다. 원문은 볼 수 있습니다.' }
        }
        return msg
      }),
    )
  }, [artifacts])

  useEffect(() => {
    if (teamScrollRef.current) teamScrollRef.current.scrollTop = teamScrollRef.current.scrollHeight
  }, [visibleTeamMessages])

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight
  }, [aiMessages])

  const nicknames = useMemo(() => [...collectMajors(graph?.root)], [graph])

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
    const body = content.trim()
    if (!body) return
    const heading = title.trim() || body.slice(0, 40)
    setBusy(true)
    setError('')
    setAiMessages((current) => [
      ...current,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        name: session.nickname,
        color: personColor(session.nickname, session.memberId),
        text: title.trim() ? `${heading}\n${body}` : body,
        mine: true,
      },
      {
        id: `p-${Date.now()}`,
        role: 'ai',
        name: 'AI Assistant',
        pending: true,
        text: '분석 중입니다…',
      },
    ])
    try {
      const created = await api.createArtifact(spaceId, {
        memberId: Number(session.memberId),
        title: heading,
        content: body,
      })
      setArtifacts((current) => [created, ...current])
      setTitle('')
      setContent('')
      setAiMessages((current) => {
        const next = [...current]
        const pendingIndex = [...next].reverse().findIndex((msg) => msg.pending)
        if (pendingIndex >= 0) {
          const idx = next.length - 1 - pendingIndex
          next[idx] = {
            ...next[idx],
            artifactId: created.id,
            status: created.status,
            text: created.status === 'READY' ? `'${created.title}' 분석을 마인드맵에 반영했습니다.` : '분석을 시작했습니다. 마인드맵이 곧 갱신됩니다.',
            pending: created.status === 'PENDING' || created.status === 'PROCESSING',
          }
        }
        return next
      })
      refresh().catch(() => {})
    } catch (err) {
      setError(err.message)
      setAiMessages((current) => [
        ...current.filter((msg) => !msg.pending),
        { id: `e-${Date.now()}`, role: 'ai', name: 'AI Assistant', text: err.message },
      ])
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

  async function copyCode() {
    const code = space?.joinCode || session.joinCode || ''
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  async function sendTeam() {
    const text = teamDraft.trim()
    if (!text || sendingTeam) return
    const tempId = `tmp-${Date.now()}`
    setSendingTeam(true)
    setTeamDraft('')
    setTeamMessages((current) =>
      upsertTeamMessage(
        current,
        mapChatMessage(
          {
            id: tempId,
            memberId: session.memberId,
            nickname: session.nickname,
            body: text,
            createdAt: new Date().toISOString(),
          },
          session.memberId,
          () => '#4b5563',
        ),
      ),
    )
    try {
      let saved
      try {
        saved = await api.sendMessage(spaceId, {
          memberId: Number(session.memberId),
          body: text,
        })
      } catch {
        const { data, error } = await supabase
          .from('space_messages')
          .insert({
            space_id: Number(spaceId),
            member_id: Number(session.memberId),
            nickname: session.nickname,
            body: text,
          })
          .select('id, space_id, member_id, nickname, body, created_at')
          .single()
        if (error) throw error
        saved = {
          id: data.id,
          spaceId: data.space_id,
          memberId: data.member_id,
          nickname: data.nickname,
          body: data.body,
          createdAt: data.created_at,
        }
      }
      setTeamMessages((current) =>
        upsertTeamMessage(
          current.filter((item) => item.id !== tempId),
          mapChatMessage(saved, session.memberId, () => '#4b5563'),
        ),
      )
    } catch (err) {
      setTeamMessages((current) => current.filter((item) => item.id !== tempId))
      setTeamDraft(text)
      setError(err.message)
    } finally {
      setSendingTeam(false)
    }
  }

  return (
    <div className="nlm-workspace">
      <header className="nlm-header">
        <div className="nlm-brand">
          <div className="nlm-logo">
            <Icon>
              <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
            </Icon>
          </div>
          <span className="nlm-title">{space?.name || '스페이스'}</span>
        </div>
        <div className="nlm-header-actions">
          <button type="button" className="nlm-ghost" onClick={copyCode}>
            <Icon>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
            </Icon>
            {copied ? '코드 복사됨' : `공유 ${space?.joinCode || session.joinCode || ''}`}
          </button>
          <Link to="/join" className="nlm-ghost">
            <Icon>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
            </Icon>
            설정
          </Link>
          <Link to="/join" className="nlm-avatar" title={session.nickname}>
            {shortName(session.nickname)}
          </Link>
        </div>
      </header>

      <main className="nlm-main" ref={workspaceRef} id="workspace">
        <aside className="nlm-rail">
          <div className="nlm-members">
            {members.map((member) => (
              <div
                key={member.key}
                className={`nlm-member${
                  member.memberId === String(session.memberId) ||
                  member.key === identityKey(session.nickname, session.memberId)
                    ? ' is-me'
                    : ''
                }`}
                style={{ background: memberColors.get(member.key) }}
                title={member.nickname}
              >
                {shortName(member.nickname)}
              </div>
            ))}
          </div>
          <div className="nlm-rail-rule" />
          <span className="nlm-rail-label">TEAM</span>
        </aside>

        <section className="nlm-pane nlm-pane-team" ref={teamRef} id="col-teamchat">
          <div className="nlm-pane-head">
            <h2>
              <Icon>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
              </Icon>
              팀 채팅
            </h2>
          </div>
          <div className="nlm-scroll" ref={teamScrollRef}>
            {visibleTeamMessages.length === 0 ? (
              <p className="nlm-empty">팀과 메시지를 주고받으세요. 같은 스페이스의 모든 멤버에게 공유됩니다.</p>
            ) : (
              visibleTeamMessages.map((msg) => (
                <div key={msg.id} className={`nlm-msg${msg.mine ? ' mine' : ''}`}>
                  <div className="nlm-msg-name" style={{ color: msg.color }}>
                    {msg.name}
                  </div>
                  <div className="nlm-bubble">{msg.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="nlm-composer">
            <div className="nlm-send-wrap">
              <textarea
                rows={1}
                value={teamDraft}
                placeholder="팀원에게 메시지..."
                onChange={(event) => setTeamDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    sendTeam()
                  }
                }}
              />
              <button type="button" className="nlm-send" onClick={sendTeam} disabled={sendingTeam} aria-label="팀 메시지 보내기">
                <Icon>
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22 11 13 2 9 22 2Z" />
                </Icon>
              </button>
            </div>
          </div>
        </section>

        <div
          className="nlm-resizer"
          id="resizer-1"
          onMouseDown={(event) => startResize(event, workspaceRef.current, teamRef.current, aiRef.current, 200)}
        />

        <section className="nlm-pane nlm-pane-ai" ref={aiRef} id="col-aichat">
          <div className="nlm-pane-head">
            <h2>
              <Icon>
                <rect x="3" y="8" width="18" height="12" rx="2" />
                <path d="M12 8V4M8 4h8" />
                <circle cx="9" cy="14" r="1" fill="currentColor" />
                <circle cx="15" cy="14" r="1" fill="currentColor" />
              </Icon>
              AI 채팅
            </h2>
          </div>
          <div className="nlm-scroll" ref={aiScrollRef}>
            {aiMessages.map((msg) => (
              <div key={msg.id} className={`nlm-msg${msg.mine ? ' mine' : ''}`}>
                <div className="nlm-msg-name" style={{ color: msg.color || undefined }}>
                  {msg.name}
                </div>
                <div className="nlm-bubble">
                  {msg.pending ? (
                    <div className="nlm-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>
          <form className="nlm-composer" onSubmit={onUpload}>
            <label className="nlm-title-field">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목 (비우면 본문 앞부분을 씁니다)" />
            </label>
            <div className="nlm-send-wrap">
              <textarea
                rows={3}
                value={content}
                placeholder="AI 분석 요청..."
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <button className="nlm-send" disabled={busy} type="submit" aria-label="업로드">
                <Icon>
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
                </Icon>
              </button>
            </div>
            {error ? <p className="nlm-error">{error}</p> : null}
          </form>
          <div className="nlm-recent">
            <h3>최근 업로드</h3>
            <ul>
              {artifacts.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => openArtifact(item.id)}>
                    {item.title}
                  </button>
                  <span>
                    {item.nickname} · {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div
          className="nlm-resizer"
          id="resizer-2"
          onMouseDown={(event) => startResize(event, workspaceRef.current, aiRef.current, mapRef.current, 300)}
        />

        <section className="nlm-pane nlm-pane-map" ref={mapRef} id="col-mindmap">
          <div className="nlm-pane-head">
            <h2>
              <Icon>
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="6" r="2" />
                <circle cx="12" cy="18" r="2" />
                <path d="M8 7.5 10.5 16M16 7.5 13.5 16" />
              </Icon>
              마인드 맵
            </h2>
            <div className="nlm-zoom">
              <button type="button" onClick={() => canvasRef.current?.zoomIn()} aria-label="확대">
                +
              </button>
              <button type="button" onClick={() => canvasRef.current?.zoomOut()} aria-label="축소">
                −
              </button>
              <button type="button" onClick={() => canvasRef.current?.fit()} aria-label="맞춤">
                ⤢
              </button>
            </div>
          </div>
          <div className="nlm-map-body">
            {nicknames.length ? (
              <div className="nlm-legend">
                {nicknames.map((name) => (
                  <span key={name}>
                    <i style={{ background: colorForMajor(name) }} />
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
            {graph?.root ? (
              mapFailed ? (
                <ErrorBoundary fallback={<GroupCards root={graph.root} onOpenArtifact={openArtifact} onOpenSources={openSources} />}>
                  <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
                    <MindmapTree
                      node={graph.root}
                      expanded={expanded}
                      onToggle={toggle}
                      onOpenArtifact={openArtifact}
                      onOpenSources={openSources}
                    />
                  </div>
                </ErrorBoundary>
              ) : (
                <ErrorBoundary
                  key={spaceId}
                  fallback={
                    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
                      <MindmapTree
                        node={graph.root}
                        expanded={expanded}
                        onToggle={toggle}
                        onOpenArtifact={openArtifact}
                        onOpenSources={openSources}
                      />
                    </div>
                  }
                >
                  <MindmapCanvas
                    ref={canvasRef}
                    root={graph.root}
                    expanded={expanded}
                    onToggle={toggle}
                    onOpenArtifact={openArtifact}
                    onOpenSources={openSources}
                    onError={() => setMapFailed(true)}
                  />
                </ErrorBoundary>
              )
            ) : (
              <p className="nlm-empty">마인드맵이 곧 여기에 표시됩니다</p>
            )}
            {panel ? (
              <SourcePanel
                title={panel.title}
                items={panel.items}
                onClose={() => setPanel(null)}
                onOpen={openArtifact}
                containerRef={mapRef}
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
