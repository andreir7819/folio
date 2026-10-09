import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'
import './auth-screen.css'

type Mode = 'signup' | 'login' | 'reset'

type Props = {
  mode: Mode
  onBack: () => void
  onModeChange: (mode: Mode) => void
}

const validEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email)

export default function AuthScreen({ mode, onBack, onModeChange }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isSignup = mode === 'signup'
  const isReset = mode === 'reset'

  const changeMode = (next: Mode) => {
    setError('')
    setMessage('')
    onModeChange(next)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const cleanEmail = email.trim().toLowerCase()
    if (!validEmail(cleanEmail)) { setError('Enter a valid email address.'); return }
    if (isSignup && !name.trim()) { setError('Add a name so Folio knows what to call you.'); return }
    if (!isReset && password.length < 8) { setError('Use a password with at least 8 characters.'); return }
    if (!supabase) { setError('Folio is not connected to its account service yet.'); return }

    setSubmitting(true)
    if (isReset) {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin })
      setSubmitting(false)
      if (requestError) { setError(requestError.message); return }
      setMessage('If this email has a Folio account, a reset link is on its way.')
      return
    }

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
      })
      setSubmitting(false)
      if (signUpError) { setError(signUpError.message); return }
      if (!data.session) {
        setMessage('Check your inbox to confirm your email, then return here. Your portfolio work stays on this device for now.')
      }
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    setSubmitting(false)
    if (signInError) { setError(signInError.message); return }
  }

  const eyebrow = isReset ? 'ACCOUNT RECOVERY' : isSignup ? 'CREATE YOUR FOLIO ACCOUNT' : 'WELCOME BACK'
  const title = isReset ? 'Get back to\nyour work.' : isSignup ? 'Make a home\nfor your work.' : 'Pick up where\nyou left off.'
  const intro = isReset
    ? 'We’ll send a secure password-reset link to your email address.'
    : isSignup
      ? 'Your account is secured by Supabase. Portfolio syncing comes next; your current work remains safely saved in this browser.'
      : 'Sign in to your Folio account. Your existing local work stays right where it is while cloud sync is being built.'

  return <main className="auth-screen">
    <header className="auth-header"><button type="button" onClick={onBack}><i>✦</i> folio</button></header>
    <section className="auth-card">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span className="auth-intro">{intro}</span>
      <form onSubmit={submit}>
        {isSignup && <label><span>Display name</span><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>}
        <label><span>Email address</span><input autoFocus={!isSignup} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" /></label>
        {!isReset && <label><span>Password</span><input value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} /></label>}
        {error && <small className="auth-error">{error}</small>}
        {message && <small className="auth-message">{message}</small>}
        <button className="auth-primary" type="submit" disabled={submitting}>{submitting ? 'One moment…' : isReset ? 'Send reset link' : isSignup ? 'Create account' : 'Sign in'} <b>↗</b></button>
      </form>
      {!isReset && <button type="button" className="auth-text-button" onClick={() => changeMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Already have an account? Sign in' : 'New to Folio? Create an account'}</button>}
      {!isSignup && <button type="button" className="auth-text-button subtle" onClick={() => changeMode(isReset ? 'login' : 'reset')}>{isReset ? 'Back to sign in' : 'Forgot your password?'}</button>}
      <aside className="auth-note"><b>✦ A careful transition</b><span>Accounts are live. Cloud portfolio storage is not yet switched on, so nothing in your local portfolio shelf is moved or overwritten.</span></aside>
    </section>
  </main>
}
