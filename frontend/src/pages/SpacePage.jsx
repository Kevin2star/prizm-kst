import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import CompareUploadModal from '../components/CompareUploadModal'
import DetailPanel from '../components/DetailPanel'
import ErrorBoundary from '../components/ErrorBoundary'
import { FileDropZone, readUploadFile } from '../components/FileDropZone'
import MindmapCanvas from '../components/MindmapCanvas'
import MindmapTree, { identityKey, memberColorMap } from '../components/MindmapTree'
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

const SIDEBAR_PX = 72

function collectNodeIds(node, set = new Set()) {
  if (!node) return set
  set.add(node.id)
  ;(node.children || []).forEach((child) => collectNodeIds(child, set))
  return set
}

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
  const [compareOpen, setCompareOpen] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const workspaceRef = useRef(null)
  const teamRef = useRef(null)
  const mapRef = useRef(null)
  const canvasRef = useRef(null)
  const teamScrollRef = useRef(null)

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
      const { data, error: memberError } = await supabase
        .from('members')
        .select('id, nickname, user_id')
        .eq('space_id', spaceId)
        .order('id', { ascending: true })
      if (memberError) throw memberError
      memberRows = data || []
    }
    let messages = messageResult
    if (!Array.isArray(messages)) {
      const { data, error: messageError } = await supabase
        .from('space_messages')
        .select('id, space_id, member_id, nickname, body, created_at')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })
        .limit(200)
      if (messageError) throw messageError
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
    setExpanded((current) => {
      const next = collectNodeIds(graphData.root)
      current.forEach((id) => next.add(id))
      return next
    })
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
    setPanel((current) => {
      if (!current?.id) return current
      const updated = list.find((item) => item.id === current.id)
      return updated ? { ...current, ...updated } : current
    })
  }

  useEffect(() => {
    setMapFailed(false)
    setTeamMessages([])
    setSpaceMembers([])
    setPanel(null)
    setCompareOpen(false)
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

  const colorForNode = useCallback(
    (node) => personColor(node?.nickname, node?.memberId),
    [memberColors],
  )

  const visibleTeamMessages = useMemo(() => {
    const chats = teamMessages.map((msg) => ({
      ...msg,
      color: personColor(msg.name, msg.memberId),
      mine: msg.memberId != null && String(msg.memberId) === String(session.memberId),
    }))
    const uploads = artifacts.map((item) => ({
      id: `up-${item.id}`,
      name: item.nickname || '멤버',
      text: `파일을 올렸습니다: ${item.sourceName || item.title}`,
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
    if (teamScrollRef.current) teamScrollRef.current.scrollTop = teamScrollRef.current.scrollHeight
  }, [visibleTeamMessages])

  useEffect(() => {
    if (!panel?.id) return undefined
    const latest = artifacts.find((item) => item.id === panel.id)
    if (!latest) return undefined
    const changed =
      latest.status !== panel.status ||
      latest.title !== panel.title ||
      latest.comparisonCommon !== panel.comparisonCommon ||
      latest.comparisonDiff !== panel.comparisonDiff
    if (!changed) return undefined
    let cancelled = false
    api.getArtifact(panel.id).then((detail) => {
      if (!cancelled) setPanel(detail)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [artifacts, panel?.id, panel?.status, panel?.title, panel?.comparisonCommon, panel?.comparisonDiff])

  function toggle(id) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function createFromFile({ content, name, parentId = null }) {
    setBusy(true)
    setError('')
    setUploadError('')
    try {
      const created = await api.createArtifact(spaceId, {
        memberId: Number(session.memberId),
        content,
        sourceName: name,
        parentId,
      })
      setArtifacts((current) => {
        const without = current.filter((item) => item.id !== created.id)
        return [created, ...without]
      })
      if (parentId) {
        const detail = await api.getArtifact(created.id)
        setPanel(detail)
      }
      refresh().catch(() => {})
      setCompareOpen(false)
    } catch (err) {
      setError(err.message)
      setUploadError(err.message)
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function onRootFile(file) {
    try {
      const parsed = await readUploadFile(file)
      await createFromFile({ content: parsed.content, name: parsed.name })
    } catch (err) {
      setError(err.message)
    }
  }

  async function openArtifact(id) {
    const detail = await api.getArtifact(id)
    setPanel(detail)
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
        const { data, error: insertError } = await supabase
          .from('space_messages')
          .insert({
            space_id: Number(spaceId),
            member_id: Number(session.memberId),
            nickname: session.nickname,
            body: text,
          })
          .select('id, space_id, member_id, nickname, body, created_at')
          .single()
        if (insertError) throw insertError
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

  const treeFallback = graph?.root ? (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <MindmapTree
        node={graph.root}
        expanded={expanded}
        onToggle={toggle}
        onOpenArtifact={openArtifact}
        colorForNode={colorForNode}
      />
    </div>
  ) : null

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
              <p className="nlm-empty">팀과 메시지를 주고받으세요. 파일을 올리면 마인드맵 루트 아래에 노드가 생깁니다.</p>
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
            <FileDropZone disabled={busy} onFile={onRootFile} label={busy ? '업로드 중…' : '파일을 끌어다 놓거나 클릭해서 업로드'} />
            {error ? <p className="nlm-error">{error}</p> : null}
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
          onMouseDown={(event) => startResize(event, workspaceRef.current, teamRef.current, mapRef.current, 300)}
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
            {members.length ? (
              <div className="nlm-legend">
                {members.map((member) => (
                  <span key={member.key}>
                    <i style={{ background: memberColors.get(member.key) }} />
                    {member.nickname}
                  </span>
                ))}
              </div>
            ) : null}
            {graph?.root ? (
              mapFailed ? (
                <ErrorBoundary fallback={treeFallback}>{treeFallback}</ErrorBoundary>
              ) : (
                <ErrorBoundary key={spaceId} fallback={treeFallback}>
                  <MindmapCanvas
                    ref={canvasRef}
                    root={graph.root}
                    expanded={expanded}
                    selectedId={panel?.id}
                    colorForNode={colorForNode}
                    onToggle={toggle}
                    onOpenArtifact={openArtifact}
                    onError={() => setMapFailed(true)}
                  />
                </ErrorBoundary>
              )
            ) : (
              <p className="nlm-empty">파일을 업로드하면 여기에 비교 트리가 표시됩니다</p>
            )}
            {panel ? (
              <DetailPanel
                artifact={panel}
                busy={busy}
                onClose={() => setPanel(null)}
                onCompare={() => {
                  setUploadError('')
                  setCompareOpen(true)
                }}
                containerRef={mapRef}
              />
            ) : null}
          </div>
        </section>
      </main>
      {compareOpen && panel ? (
        <CompareUploadModal
          parentTitle={panel.title}
          busy={busy}
          error={uploadError}
          onClose={() => setCompareOpen(false)}
          onSubmit={({ name, content }) => createFromFile({ content, name, parentId: panel.id })}
        />
      ) : null}
    </div>
  )
}
