import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { applySpaceSession, createOwnedSpace, joinSpaceByCode } from '../spaceMembership'
import { supabase } from '../supabaseClient'

export default function CreateSpace() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onCreate(event) {
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
      const space = await createOwnedSpace(user, { name, description: name })
      const member = await joinSpaceByCode(space.join_code)
      applySpaceSession(member, space.join_code)
      setCreated(space)
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
      <h1>스페이스 만들기</h1>
      {!created ? (
        <form onSubmit={onCreate} className="form">
          <label>
            주제
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="교내 카페 개선안" />
          </label>
          <button className="btn primary" disabled={busy} type="submit">
            만들기
          </button>
        </form>
      ) : (
        <>
          <p className="lede">이 코드는 스페이스를 삭제하기 전까지 바뀌지 않습니다.</p>
          <div className="code-box">
            <strong>{created.join_code}</strong>
            <button
              type="button"
              className="btn"
              onClick={() => navigator.clipboard.writeText(created.join_code)}
            >
              복사
            </button>
          </div>
          <button className="btn primary" type="button" onClick={() => navigate(`/spaces/${created.id}`)}>
            이 스페이스로 입장
          </button>
        </>
      )}
      {error ? <p className="error">{error}</p> : null}
    </main>
  )
}
