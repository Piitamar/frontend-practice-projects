export type PracticeItem = {
  slug: string
  title: string
  route: string
}

export const practices: PracticeItem[] = [
  {
    slug: 'websocket-chat',
    title: 'WebSocket Chat',
    route: '/practice/websocket-chat',
  },
  {
    slug: 'chat-room',
    title: 'Chat Room',
    route: '/practice/chat-room',
  },
  {
    slug: 'dashboard',
    title: 'Crypto Dashboard',
    route: '/practice/dashboard',
  },
  {
    slug: 'socialMedia',
    title: 'Social Media',
    route: '/practice/social-media',
  },
  {
    slug: 'finance-dashboard',
    title: 'Finance Dashboard',
    route: '/practice/finance-dashboard',
  }
]

export function getPractice(slug: string | undefined) {
  return practices.find((item) => item.slug === slug)
}
