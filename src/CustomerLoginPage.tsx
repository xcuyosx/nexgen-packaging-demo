import { useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

type CustomerLoginPageProps = {
  logoUrl: string
  loading: boolean
  error: string
  message: string
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (contactName: string, companyName: string, email: string, password: string) => Promise<void>
}

export function CustomerLoginPage({ logoUrl, loading, error, message, onLogin, onRegister }: CustomerLoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === 'register') {
      await onRegister(contactName, companyName, email, password)
      return
    }
    await onLogin(email, password)
  }

  return (
    <section className="customer-login-page page-section">
      <div className="customer-login-shell">
        <div className="customer-login-brand">
          <img src={logoUrl} alt="NexGen Packaging Group" />
        </div>

        <form className="customer-login-card" onSubmit={submit}>
          <div className="customer-login-heading">
            <h1>{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
            <p>{mode === 'signin' ? 'Access your quotes, orders, and account details.' : 'Use your work email to create a NexGen customer account.'}</p>
          </div>

          {mode === 'register' ? (
            <div className="customer-login-registration-fields">
              <label>
                Your name
                <span className="customer-login-field">
                  <input
                    type="text"
                    autoComplete="name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    required
                  />
                </span>
              </label>
              <label>
                Company
                <span className="customer-login-field">
                  <input
                    type="text"
                    autoComplete="organization"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    required
                  />
                </span>
              </label>
            </div>
          ) : null}

          <label>
            Email
            <span className="customer-login-field">
              <input
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </span>
          </label>

          <label>
            Password
            <span className="customer-login-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === 'register' ? 8 : undefined}
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
          {message ? <p className="customer-login-message" role="status">{message}</p> : null}

          <button className="customer-login-submit" type="submit" disabled={loading}>
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
            {!loading ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </button>

          <div className="customer-login-switch">
            <span>{mode === 'signin' ? 'New to NexGen?' : 'Already have an account?'}</span>
            <button type="button" onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
