import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { loadSession, saveSession } from '../session'

export default function JoinSpace() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ code: '', nickname: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = loadSession()
      const member = await api.joinSpace(form.code, {
        nickname: form.nickname,
        memberId: session.memberId ? Number(session.memberId) : undefined,
      })
      saveSession({
        memberId: member.memberId,
        spaceId: member.spaceId,
        nickname: member.nickname,
        joinCode: form.code.toUpperCase(),
      })
      navigate(`/spaces/${member.spaceId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <Link to="/" className="back">
        ← 홈
      </Link>
      <h1>참여 코드로 입장</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          6자리 코드
          <input value={form.code} onChange={(e) => setField('code', e.target.value.toUpperCase())} maxLength={6} />
        </label>
        <label>
          닉네임
          <input value={form.nickname} onChange={(e) => setField('nickname', e.target.value)} />
        </label>
        <button className="btn primary" disabled={busy} type="submit">
          입장
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </main>
  )
}
