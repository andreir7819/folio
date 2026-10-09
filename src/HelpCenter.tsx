import { useState } from 'react'
import './help-center.css'

type Article = {
  id: string
  eyebrow: string
  title: string
  summary: string
  sections: Array<{ heading: string; body: string }>
}

const articles: Article[] = [
  {
    id: 'start',
    eyebrow: 'GETTING STARTED',
    title: 'Make a portfolio that feels like yours.',
    summary: 'Start with one page, then add only what helps tell the story of your work.',
    sections: [
      { heading: 'Choose your space', body: 'Canvas pages are freeform: drag text, images, shapes, and details into place. Scroll pages are better for case studies, writing, and work people should read in order.' },
      { heading: 'Build from blocks', body: 'Open Add to bring in text, images, projects, galleries, embeds, and playful motion. Select a block to edit its details in the Inspector.' },
      { heading: 'Preview before you publish', body: 'Preview removes editor controls so you can check the experience as a visitor. Use device previews as a guide, then make intentional adjustments where your work needs them.' },
    ],
  },
  {
    id: 'accounts',
    eyebrow: 'ACCOUNTS & DATA',
    title: 'What Folio keeps, and why.',
    summary: 'Folio should hold the least amount of information needed to make your portfolio work.',
    sections: [
      { heading: 'Your account', body: 'Folio uses Supabase for account sign-in, email confirmation, and password recovery. Folio never stores or sees your raw password.' },
      { heading: 'Your current workspace', body: 'Portfolio edits are still saved in this browser while cloud syncing is under construction. Signing in does not upload, replace, or delete your existing local work.' },
      { heading: 'Before public launch', body: 'Folio will publish a privacy policy, a data export path, and a permanent account-deletion flow before it asks creators to trust it with hosted portfolios.' },
    ],
  },
  {
    id: 'assets',
    eyebrow: 'ASSETS & FONTS',
    title: 'Use work you have the right to share.',
    summary: 'A portfolio can be personal without borrowing someone else’s work without permission.',
    sections: [
      { heading: 'Images and uploads', body: 'Only upload images or fonts you created, licensed, or otherwise have permission to publish. A file being easy to download does not automatically make it okay to reuse.' },
      { heading: 'Built-in fonts', body: 'Folio’s built-in font library is served through Google Fonts. Those font families are open-source and suitable for commercial and personal web projects.' },
      { heading: 'Custom fonts', body: 'If custom font uploads return in a future release, the uploader—not Folio—must have the right to use and publish that font. Brand, game, movie, and celebrity-themed fonts deserve extra caution.' },
    ],
  },
  {
    id: 'takedowns',
    eyebrow: 'TAKEDOWNS & RIGHTS',
    title: 'A clear path when something should not be online.',
    summary: 'Folio will take credible intellectual-property and privacy reports seriously.',
    sections: [
      { heading: 'What to include', body: 'A useful report identifies the exact Folio portfolio URL, explains what material is at issue, provides your contact details, and states why you believe the content should be removed or restricted.' },
      { heading: 'What Folio will do', body: 'When Folio is publicly hosted, we will review credible reports, may temporarily restrict the reported material while reviewing it, and will tell the portfolio owner what happened when appropriate.' },
      { heading: 'Important launch note', body: 'Folio is still in development. Before public publishing opens, this help article will gain a monitored contact method, a formal terms page, a privacy policy, and a complete takedown/counter-notice procedure. This page is product guidance, not legal advice.' },
    ],
  },
]

export default function HelpCenter({ onBack }: { onBack: () => void }) {
  const [activeId, setActiveId] = useState('start')
  const active = articles.find(article => article.id === activeId) ?? articles[0]
  return <main className="help-center">
    <header className="help-header"><button className="home-wordmark" onClick={onBack}><i>✦</i> folio</button><button className="home-login" onClick={onBack}>← Back</button></header>
    <section className="help-shell">
      <aside className="help-nav"><p>FOLIO HELP</p><h1>A little<br /><em>clarity.</em></h1><span>Short, human answers while Folio grows.</span><nav aria-label="Help articles">{articles.map(article => <button type="button" key={article.id} className={active.id === article.id ? 'active' : ''} onClick={() => setActiveId(article.id)}><small>{article.eyebrow}</small><b>{article.id === 'takedowns' ? 'Takedowns & rights' : article.id === 'assets' ? 'Assets & fonts' : article.id === 'accounts' ? 'Accounts & data' : 'Getting started'}</b><i>↗</i></button>)}</nav></aside>
      <article className="help-article">
        <p>{active.eyebrow}</p><h2>{active.title}</h2><span className="help-summary">{active.summary}</span>
        <div className="help-sections">{active.sections.map(section => <section key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></section>)}</div>
        {active.id === 'takedowns' && <aside className="help-callout"><b>For Folio’s creator</b><span>Before accepting public portfolios, publish the real contact route and have a qualified lawyer review your terms, privacy policy, and takedown process for the places you operate.</span></aside>}
      </article>
    </section>
  </main>
}
