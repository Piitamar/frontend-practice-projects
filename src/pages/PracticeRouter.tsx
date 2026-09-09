import { Navigate, useParams } from 'react-router-dom'
import { getPractice } from '../data/practices'
import WebSocketPracticePage from './websocket/WebSocketPracticePage'
// @ts-expect-error - JSX practice page is kept as a .jsx file by request.
import Websocket2Page from './websocket2/websocket2'
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

  if (practice.slug === 'counter-lab') {
    return <Websocket2Page />
  }

  return <SimplePracticePage slug={practice.slug} title={practice.title} />
}
