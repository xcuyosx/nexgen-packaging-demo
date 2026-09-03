import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'

type CustomerLoginPageProps = {
  logoUrl: string
  loading: boolean
  error: string
  onLogin: (email: string, password: string) => Promise<void>
}

export function CustomerLoginPage({ logoUrl, loading, error, onLogin }: CustomerLoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onLogin(email, password)
  }

  return (
    <section className="customer-login-page page-section">
      <div className="customer-login-shell">
        <div className="customer-login-intro">
          <img src={logoUrl} alt="NexGen Packaging Group" />
          <p>Customer account</p>
          <h1>Your packaging orders, all in one place.</h1>
          <span>Review orders, reorder products, and manage billing and delivery information.</span>
        </div>

        <form className="customer-login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in</h2>
            <span>Use the email and password assigned to your customer account.</span>
          </div>

          <label>
            Email
            <span className="customer-login-field">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label>
            Password
            <span className="customer-login-field">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error ? <p className="customer-login-error" role="alert">{error}</p> : null}

          <button className="customer-login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </button>

          <p className="customer-login-help">Need access? Contact your NexGen sales representative.</p>
        </form>
      </div>
    </section>
  )
}
