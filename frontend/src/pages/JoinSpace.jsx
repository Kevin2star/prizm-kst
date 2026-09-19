import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { applySpaceSession, joinSpaceByCode } from '../spaceMembership'
import { supabase } from '../supabaseClient'

export default function JoinSpace() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        navigate('/')
        return
      }
      const member = await joinSpaceByCode(code)
      applySpaceSession(member, code.trim().toUpperCase())
      navigate(`/spaces/${member.space_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <Link to="/main" className="back">
        ← 메인
      </Link>
      <h1>참여 코드로 입장</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          6자리 코드
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
        </label>
        <button className="btn primary" disabled={busy} type="submit">
          입장
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
    </main>
  )
}
