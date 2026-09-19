import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { saveSession } from '../session'

export default function CreateSpace() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)
  const [join, setJoin] = useState({ nickname: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onCreate(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const space = await api.createSpace(name)
      setCreated(space)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onJoin(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const member = await api.joinSpace(created.joinCode, join)
      saveSession({
        memberId: member.memberId,
        spaceId: member.spaceId,
        nickname: member.nickname,
        joinCode: created.joinCode,
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
          <p className="lede">참여 코드를 공유하세요. 자료를 한 사람이 모을 필요는 없습니다.</p>
          <div className="code-box">
            <strong>{created.joinCode}</strong>
            <button
              type="button"
              className="btn"
              onClick={() => navigator.clipboard.writeText(created.joinCode)}
            >
              복사
            </button>
          </div>
          <form onSubmit={onJoin} className="form">
            <label>
              닉네임
              <input value={join.nickname} onChange={(e) => setJoin({ ...join, nickname: e.target.value })} />
            </label>
            <button className="btn primary" disabled={busy} type="submit">
              이 스페이스로 입장
            </button>
          </form>
        </>
      )}
      {error ? <p className="error">{error}</p> : null}
    </main>
  )
}
