import { useState, type FormEvent } from 'react'
import type { LocalProfile } from './localWorkspace'
import './local-account.css'

type Props = {
  mode: 'signup' | 'login'
  savedProfile: LocalProfile | null
  onCreate: (name: string, email: string) => void
  onContinue: () => void
  onBack: () => void
}

export default function LocalAccountScreen({ mode, savedProfile, onCreate, onContinue, onBack }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError('Add a name so Folio knows what to call you.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Add a valid email address.')
    onCreate(name.trim(), email.trim().toLowerCase())
  }
  const hasProfile = !!savedProfile
  return <main className="local-account-screen">
    <header className="local-account-header"><button onClick={onBack}><i>✦</i> folio</button></header>
    <section className="local-account-card">
      <p>FOLIO ON THIS DEVICE</p>
      <h1>{mode === 'signup' ? 'Make your\ncreative corner.' : hasProfile ? `Welcome back,\n${savedProfile.name}.` : 'No local profile\nyet.'}</h1>
      {mode === 'signup' && <><span className="local-account-intro">Create a local profile to save portfolios and uploaded assets on this browser while we build Folio’s secure online accounts.</span><form onSubmit={submit}><label><span>Name</span><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="Your name" autoComplete="name" /></label><label><span>Email</span><input value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" type="email" autoComplete="email" /></label>{error && <small className="local-account-error">{error}</small>}<button className="local-account-primary" type="submit">Create local profile <b>↗</b></button></form></>}
      {mode === 'login' && hasProfile && <><span className="local-account-intro">Your portfolios are saved on this browser. Continue to pick up where you left off.</span><div className="local-profile-summary"><i>{savedProfile.name.slice(0, 1).toUpperCase()}</i><span><b>{savedProfile.name}</b><small>{savedProfile.email}</small></span></div><button className="local-account-primary" onClick={onContinue}>Continue to Folio <b>↗</b></button></>}
      {mode === 'login' && !hasProfile && <><span className="local-account-intro">This browser does not have a local Folio profile yet. Create one to start saving work here.</span><button className="local-account-primary" onClick={onBack}>Back to Folio <b>↗</b></button></>}
      <aside className="local-account-note"><b>What this means right now</b><span>This prototype saves on your device using browser storage. It does not create an online account, transmit your email, or store a password. Real sign-in and cloud sync come next.</span></aside>
    </section>
  </main>
}
