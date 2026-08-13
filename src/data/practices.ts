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
    slug: 'counter-lab',
    title: 'Counter Lab',
    route: '/practice/counter-lab',
  },
  {
    slug: 'todo-board',
    title: 'Todo Board',
    route: '/practice/todo-board',
  },
  {
    slug: 'ui-playground',
    title: 'UI Playground',
    route: '/practice/ui-playground',
  },
]

export function getPractice(slug: string | undefined) {
  return practices.find((item) => item.slug === slug)
}
