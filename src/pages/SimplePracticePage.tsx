import { Link } from 'react-router-dom'
import { practices } from '../data/practices'

type SimplePracticePageProps = {
  slug: string
  title: string
}

export default function SimplePracticePage({ slug, title }: SimplePracticePageProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm text-slate-400 transition hover:text-slate-100">
          ← Back home
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-400">This page is a separate practice shell for {slug}.</p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Practice links</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {practices.map((item) => (
              <li key={item.slug}>
                <Link
                  to={item.route}
                  className="block rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
