import { useState } from 'react'
import { resolveEmbed, type EmbedKind } from './embeds'
import './media-embed.css'

export default function MediaEmbed({ kind, url, preview }: { kind: EmbedKind; url: string; preview: boolean }) {
  const embed = resolveEmbed(url, kind)
  if (preview && embed) return <EmbedPlayer key={embed.src} kind={kind} embed={embed} originalUrl={url.trim()} />
  return <div className={`media-embed media-${kind}`}>
    <div className="media-placeholder">
      <span aria-hidden="true">{kind === 'video' ? '▷' : '♫'}</span>
      <strong>{embed ? `${embed.provider} ${kind}` : `${kind === 'video' ? 'Video' : 'Audio'} embed`}</strong>
      <small>{embed ? 'Link recognized · test playback in Edit' : url.trim() ? 'Unsupported link · edit to fix' : preview ? 'Media link unavailable' : 'Edit to paste a link'}</small>
    </div>
  </div>
}

function EmbedPlayer({ kind, embed, originalUrl }: { kind: EmbedKind; embed: { src: string; provider: string }; originalUrl: string }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  return <div className="embed-player">
    <div className={`media-embed media-${kind}`}>
      <iframe src={embed.src} title={`${embed.provider} ${kind} player`} loading="lazy" onLoad={() => setState('loaded')} onError={() => setState('error')} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
    <div className="embed-playback-status">
      <span role="status">{state === 'loading' ? 'Loading player…' : state === 'error' ? 'Player could not load.' : 'Player loaded · press play to check availability.'}</span>
      <a href={originalUrl} target="_blank" rel="noopener noreferrer">Open original ↗</a>
    </div>
  </div>
}

export function EmbedSettings({ kind, url, onChange }: { kind: EmbedKind; url: string; onChange: (url: string) => void }) {
  const [testingUrl, setTestingUrl] = useState<string | null>(null)
  const embed = resolveEmbed(url, kind)
  const providers = kind === 'video' ? 'YouTube or Vimeo' : 'Spotify or SoundCloud'
  return <div className="embed-settings">
    <label className="field"><span>{kind === 'video' ? 'Video' : 'Audio'} link</span><input type="url" value={url} placeholder={`Paste a ${providers} link…`} onChange={event => onChange(event.target.value)} aria-invalid={!!url.trim() && !embed} /></label>
    <p className="settings-note" role="status">{embed ? `${embed.provider} link recognized. Playback not yet verified.` : url.trim() ? `Unsupported link. Use a full https share link from ${providers}, rather than embed code.` : `Paste a share link from ${providers}. Playback stays with the original host.`}</p>
    {embed && <button type="button" className="embed-test-button" onClick={() => setTestingUrl(testingUrl === url ? null : url)}>{testingUrl === url ? 'Close player test' : 'Test playback'}</button>}
    {embed && testingUrl === url && <><MediaEmbed kind={kind} url={url} preview /><p className="settings-note">Press play to confirm it works. Private, removed, or region-restricted media may show an error inside the player.</p></>}
    <p className="settings-note">Player availability, ads and branding are controlled by the provider.</p>
    <p className="asset-rights">By adding this embed, you confirm that you own the content or have permission to share it here, including through the provider’s embedding features. Respect the creator’s rights and the provider’s terms.</p>
  </div>
}
