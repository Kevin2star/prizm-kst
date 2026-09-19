import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import MainPage from './pages/MainPage'
import SignUp from "./pages/SignUp";
import CreateSpace from './pages/CreateSpace'
import JoinSpace from './pages/JoinSpace'
import SpacePage from './pages/SpacePage'
import { supabase } from './supabaseClient'
import './App.css'

function RequireAuth({ children }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setAuthed(Boolean(data.session?.user))
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session?.user))
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  if (!ready) return null
  if (!authed) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/main" element={<RequireAuth><MainPage /></RequireAuth>} />
      <Route path="/create" element={<CreateSpace />} />
      <Route path="/join" element={<JoinSpace />} />
      <Route path="/spaces/:spaceId" element={<SpacePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
