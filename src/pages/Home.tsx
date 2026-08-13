import { Link } from 'react-router-dom'
import { practices } from '../data/practices'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Practice Home</h1>
        <p className="mt-3 text-slate-400">Chọn một project để đi tới trang tương ứng.</p>

        <nav className="mt-8">
          <ul className="grid gap-3 sm:grid-cols-2">
            {practices.map((item) => (
              <li key={item.slug}>
                <Link
                  to={item.route}
                  className="block rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}
