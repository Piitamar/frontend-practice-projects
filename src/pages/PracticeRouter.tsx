import { Navigate, useParams } from 'react-router-dom'
import { getPractice } from '../data/practices'
import WebSocketPracticePage from './websocket/WebSocketPracticePage'
import SimplePracticePage from './SimplePracticePage'

export default function PracticeRouter() {
  const { slug } = useParams()
  const practice = getPractice(slug)

  if (!practice) {
    return <Navigate to="/" replace />
  }

  if (practice.slug === 'websocket-chat') {
    return <WebSocketPracticePage />
  }

  return <SimplePracticePage slug={practice.slug} title={practice.title} />
}
