import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

type AuthMode = 'signin' | 'register' | 'request-reset' | 'set-password'

type CustomerLoginPageProps = {
  logoUrl: string
  loading: boolean
  error: string
  message: string
  recoveryToken: string
  recoveryError: string
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (contactName: string, companyName: string, email: string, password: string) => Promise<void>
  onResetRequest: (email: string) => Promise<void>
  onPasswordUpdate: (password: string) => Promise<boolean>
  onClearFeedback: () => void
}

export function CustomerLoginPage({
  logoUrl,
  loading,
  error,
  message,
  recoveryToken,
  recoveryError,
  onLogin,
  onRegister,
  onResetRequest,
  onPasswordUpdate,
  onClearFeedback,
}: CustomerLoginPageProps) {
  const [mode, setMode] = useState<AuthMode>(recoveryToken ? 'set-password' : recoveryError ? 'request-reset' : 'signin')
  const [contactName, setContactName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const switchMode = (next: AuthMode, keepFeedback = false) => {
    setMode(next)
    setPassword('')
    setShowPassword(false)
    if (!keepFeedback) onClearFeedback()
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === 'register') {
      await onRegister(contactName, companyName, email, password)
    } else if (mode === 'request-reset') {
      await onResetRequest(email)
    } else if (mode === 'set-password') {
      if (await onPasswordUpdate(password)) switchMode('signin', true)
    } else {
      await onLogin(email, password)
    }
  }

  const heading = {
    signin: 'Sign in',
    register: 'Create your account',
    'request-reset': 'Reset your password',
    'set-password': 'Choose a new password',
  }[mode]
  const description = {
    signin: 'Access your quotes, orders, and account details.',
    register: 'Use your work email to create a NexGen customer account.',
    'request-reset': 'Enter your email and we’ll help you get back in.',
    'set-password': 'Enter a new password for your sign-in.',
  }[mode]
  const submitLabel = {
    signin: loading ? 'Signing in…' : 'Sign in',
    register: loading ? 'Creating account…' : 'Create account',
    'request-reset': loading ? 'Requesting link…' : 'Send reset link',
    'set-password': loading ? 'Updating password…' : 'Update password',
  }[mode]

  return (
    <section className="customer-login-page page-section">
      <div className="customer-login-shell">
        <div className="customer-login-brand">
          <img src={logoUrl} alt="NexGen Packaging Group" />
        </div>

        <form className="customer-login-card" onSubmit={submit}>
          <div className="customer-login-heading">
            <h1>{heading}</h1>
            <p>{description}</p>
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

          {mode !== 'set-password' ? (
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
          ) : null}

          {mode !== 'request-reset' ? (
            <label>
              {mode === 'set-password' ? 'New password' : 'Password'}
              <span className="customer-login-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={mode === 'signin' ? undefined : 8}
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
          ) : null}

          {error ? <p className="customer-login-error" role="alert">{error}</p> : null}
          {message ? <p className="customer-login-message" role="status">{message}</p> : null}

          <button className="customer-login-submit" type="submit" disabled={loading}>
            {submitLabel}
            {!loading ? <ArrowRight size={18} aria-hidden="true" /> : null}
          </button>

          {mode === 'signin' || mode === 'register' ? (
            <div className="customer-login-switch">
              <button type="button" disabled={loading} onClick={() => switchMode('request-reset')}>Forgot password? Reset it</button>
            </div>
          ) : null}

          <div className="customer-login-switch">
            {mode === 'signin' ? <span>New to NexGen?</span> : null}
            {mode === 'register' ? <span>Already have an account?</span> : null}
            {mode === 'request-reset' ? <span>Remember your password?</span> : null}
            {mode === 'signin' ? (
              <button type="button" disabled={loading} onClick={() => switchMode('register')}>Create an account</button>
            ) : mode === 'register' || mode === 'request-reset' ? (
              <button type="button" disabled={loading} onClick={() => switchMode('signin')}>Sign in</button>
            ) : (
              <button type="button" disabled={loading} onClick={() => switchMode('request-reset')}>Request another reset link</button>
            )}
          </div>

          {mode === 'register' || mode === 'request-reset' ? (
            <p className="customer-login-help">Need help with your account? <Link to="/contact">Contact NexGen</Link>.</p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
