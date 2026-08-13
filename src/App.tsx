import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginWidget from './components/LoginWidget'
import Home from './pages/Home'
import NotFoundPage from './pages/NotFoundPage'
import PracticeRouter from './pages/PracticeRouter'

export default function App() {
  return (
    <BrowserRouter>
      <LoginWidget />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice/:slug" element={<PracticeRouter />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
