import { useState } from 'react'
import type { LocalProfile } from '../localWorkspace'
import './account-settings.css'

type Section = 'profile' | 'workspace' | 'privacy'

type AccountSettingsProps = {
  profile: LocalProfile
  portfolioCount: number
  assetCount: number
  assetBytes: number
  onSave: (patch: Pick<LocalProfile, 'name' | 'email'>) => void
  onBack: () => void
  onSignOut: () => void
}

function formatStorage(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AccountSettings({ profile, portfolioCount, assetCount, assetBytes, onSave, onBack, onSignOut }: AccountSettingsProps) {
  const [section, setSection] = useState<Section>('profile')
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [message, setMessage] = useState('')

  const saveProfile = () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) { setMessage('Add a name before saving.'); return }
    if (!trimmedEmail || !trimmedEmail.includes('@')) { setMessage('Add a valid email address before saving.'); return }
    onSave({ name: trimmedName, email: trimmedEmail })
    setMessage('Profile saved locally.')
  }

  return <main className="account-settings-screen">
    <header className="account-settings-header">
      <button className="brand brand-button" onClick={onBack}><i>✦</i> folio</button>
      <div><span>Local workspace</span><button type="button" onClick={onSignOut}>Sign out</button></div>
    </header>
    <section className="account-settings-shell">
      <aside className="account-settings-nav">
        <div className="account-settings-person"><i>{profile.name.slice(0, 1).toUpperCase()}</i><span><b>{profile.name}</b><small>{profile.email}</small></span></div>
        <p>ACCOUNT</p>
        {([
          ['profile', 'Profile', 'Your name and email'],
          ['workspace', 'Workspace', 'Plan, portfolios, and storage'],
          ['privacy', 'Privacy & data', 'What Folio keeps'],
        ] as const).map(([id, label, hint]) => <button type="button" key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}><b>{label}</b><small>{hint}</small></button>)}
      </aside>
      <section className="account-settings-content">
        {section === 'profile' && <><p className="account-settings-kicker">ACCOUNT SETTINGS</p><h1>Your profile,<br />kept simple.</h1><p className="account-settings-intro">This information belongs to your Folio account when online accounts arrive. For now, it is saved only in this browser.</p><div className="account-settings-card"><h2>Profile details</h2><label><span>Display name</span><input value={name} onChange={event => { setName(event.target.value); setMessage('') }} placeholder="Your name" /></label><label><span>Email address</span><input type="email" value={email} onChange={event => { setEmail(event.target.value); setMessage('') }} placeholder="you@example.com" /></label><div className="account-settings-save"><small>{message || 'Used for your future sign-in and account recovery.'}</small><button type="button" onClick={saveProfile}>Save changes</button></div></div><div className="account-settings-note"><b>✦ A local-first prototype</b><span>There is no remote account, password, or email delivery yet. Supabase will handle authentication securely when Folio moves online.</span></div></>}
        {section === 'workspace' && <><p className="account-settings-kicker">YOUR WORKSPACE</p><h1>A small plan<br />with room to make.</h1><p className="account-settings-intro">The free plan is intentionally useful. Limits are here to keep Folio fast, friendly, and inexpensive to run.</p><div className="account-settings-card plan-card"><div><span>YOUR PLAN</span><h2>Free</h2><p>Everything needed to make and share a thoughtful portfolio.</p></div><b>Active</b></div><div className="account-stat-grid"><article><span>PORTFOLIOS</span><strong>{portfolioCount} <small>/ 3</small></strong><p>Three distinct homes for your work.</p></article><article><span>ASSETS</span><strong>{assetCount}</strong><p>{formatStorage(assetBytes)} stored in this browser.</p></article><article><span>UPLOAD LIMITS</span><strong>10 <small>MB</small></strong><p>Per image · 5 MB per font file.</p></article></div><div className="account-settings-note"><b>Keeping costs kind</b><span>When hosting arrives, image resizing and sensible file limits will keep portfolios quick without making the free plan feel cramped.</span></div></>}
        {section === 'privacy' && <><p className="account-settings-kicker">PRIVACY & DATA</p><h1>Clear about<br />what we keep.</h1><p className="account-settings-intro">Folio should collect the least information needed to make your portfolio work.</p><div className="account-settings-card data-card"><h2>Data in this prototype</h2><dl><div><dt>Profile</dt><dd>Your display name and email address.</dd></div><div><dt>Portfolio work</dt><dd>Pages, blocks, settings, links, and publishing state.</dd></div><div><dt>Uploaded assets</dt><dd>Images and fonts you add to the asset shelf.</dd></div><div><dt>Where it lives</dt><dd>Only in this browser’s local storage right now.</dd></div></dl></div><div className="account-settings-note"><b>Before Folio goes online</b><span>You’ll be able to export or permanently delete your data. The public privacy policy will state exactly what is stored, why, and for how long.</span></div><div className="account-danger"><div><b>Account deletion</b><span>Not available yet because this is a local prototype—not a hosted account.</span></div><button type="button" disabled>Delete account</button></div></>}
      </section>
    </section>
  </main>
}
