import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginWidget from './components/LoginWidget'
import Home from './pages/Home'
import NotFoundPage from './pages/NotFoundPage'

import WebSocketPracticePage from './pages/websocket/WebSocketPracticePage'
import Websocket2Page from './pages/websocket2/websocket2'
import CryptoDashboard from './pages/dashboard/CryptoDashboard'
import SimplePracticePage from './pages/SimplePracticePage'
import SocialMedia from './pages/socialMedia/SocialMedia'
import FinanceDashboard from './pages/financeDashboard/FinanceDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <LoginWidget />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/practice/websocket-chat"
          element={<WebSocketPracticePage />}
        />

        <Route
          path="/practice/chat-room"
          element={<Websocket2Page />}
        />

        <Route
          path="/practice/dashboard"
          element={<CryptoDashboard />}
        />

        <Route
          path="/practice/social-media"
          element={<SocialMedia />}
        />

        <Route 
          path='/practice/finance-dashboard'
          element={<FinanceDashboard />}
        />

        <Route
          path="/practice/:slug"
          element={<SimplePracticePage />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}