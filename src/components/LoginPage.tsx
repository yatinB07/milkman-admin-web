import { Eye, LockKeyhole, Mail, Truck, ShieldCheck } from 'lucide-react'
import type { FormEvent } from 'react'

type LoginPageProps = {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin()
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
              <input autoComplete="email" defaultValue="admin@milkman.com" type="email" />
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
              <input autoComplete="current-password" defaultValue="password" type="password" />
              <Eye aria-hidden="true" size={19} />
            </span>
          </label>

          <label className="toggle-row">
            <input type="checkbox" />
            <span>Remember me for 30 days</span>
          </label>

          <button className="primary-button" type="submit">
            Sign In to Dashboard
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
