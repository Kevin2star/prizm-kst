import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import CreateSpace from './pages/CreateSpace'
import JoinSpace from './pages/JoinSpace'
import SpacePage from './pages/SpacePage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateSpace />} />
      <Route path="/join" element={<JoinSpace />} />
      <Route path="/spaces/:spaceId" element={<SpacePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
