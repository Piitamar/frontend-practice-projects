import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-slate-400">Khong thay trang.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
        >
          Ve trang chu
        </Link>
      </div>
    </main>
  )
}
