import { useEffect, useRef, useState, type FormEvent } from 'react'
import { login } from '../pages/websocket/connection'

export default function LoginWidget() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!open) return

      const target = event.target as Node | null
      if (target && panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const data = await login(username.trim(), password)

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setSuccess(data.message)
      console.log("đăng nhập thành công", data.token, data.user);      setOpen(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-sky-400/30 bg-slate-900/90 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-slate-950/40 backdrop-blur transition hover:border-sky-300 hover:bg-slate-800"
      >
        Đăng nhập
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Đăng nhập"
          className="w-80 rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100 shadow-2xl shadow-slate-950/60 backdrop-blur"
        >
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="account" className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Tài khoản
              </label>
              <input
                id="account"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Nhập tài khoản"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
