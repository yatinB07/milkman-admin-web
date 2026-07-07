import { Eye, LockKeyhole, Mail, Truck, ShieldCheck } from 'lucide-react'
import type { FormEvent } from 'react'

type LoginPageProps = {
  onLogin: (credentials: { email: string; password: string }) => void
  error?: string
  isLoading?: boolean
}

export function LoginPage({ onLogin, error, isLoading = false }: LoginPageProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    onLogin({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })
  }

  return (
    <main className="login-page">
      <section className="login-card-shell" aria-labelledby="login-heading">
        <div className="login-brand-mark">
          <Truck aria-hidden="true" size={34} />
        </div>
        <div className="login-heading">
          <h1 id="login-heading">MilkMan Admin</h1>
          <p>Operational Suite Access</p>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email Address</span>
            <span className="input-shell">
              <Mail aria-hidden="true" size={19} />
              <input
                autoComplete="email"
                defaultValue="admin@milkman.test"
                name="email"
                type="email"
              />
            </span>
          </label>

          <label className="form-field">
            <span className="field-row">
              Password
              <button className="link-button" type="button">
                Forgot password?
              </button>
            </span>
            <span className="input-shell">
              <LockKeyhole aria-hidden="true" size={19} />
              <input
                autoComplete="current-password"
                defaultValue="password"
                name="password"
                type="password"
              />
              <Eye aria-hidden="true" size={19} />
            </span>
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <label className="toggle-row">
            <input type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>

          <div className="login-security">
            <span>
              <ShieldCheck aria-hidden="true" size={16} />
              Secure TLS 1.3
            </span>
            <span>
              <ShieldCheck aria-hidden="true" size={16} />
              Encrypted Data
            </span>
          </div>
        </form>

        <p className="login-support">
          Problems logging in? <button type="button">Contact System Support</button>
        </p>
      </section>
    </main>
  )
}
