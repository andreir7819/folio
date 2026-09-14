import './home-screen.css'

type Props = { isSignedIn?: boolean; onStart: () => void; onLogin: () => void; onCredits: () => void; onPlans: () => void }

export default function HomeScreen({ isSignedIn = false, onStart, onLogin, onCredits, onPlans }: Props) {
  return <main className="folio-home">
    <header className="home-nav">
      <button className="home-wordmark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><i>✦</i> folio</button>
      <div className="home-nav-actions">{isSignedIn ? <button className="home-signup" onClick={onStart}>Your portfolios</button> : <><button className="home-login" onClick={onLogin}>Log in</button><button className="home-signup" onClick={onStart}>Sign up</button></>}</div>
    </header>
    <section className="home-hero">
      <p className="home-eyebrow">A PORTFOLIO BUILDER FOR PEOPLE WITH A POINT OF VIEW</p>
      <h1>Your work deserves<br /><em>more than a template.</em></h1>
      <p className="home-intro">Folio is a playful, visual workspace for making a portfolio that feels unmistakably like you—without having to build a whole website from scratch.</p>
      <div className="home-cta"><button onClick={onStart}>{isSignedIn ? 'Open your portfolios' : 'Make your first portfolio'} <span>↗</span></button><small>{isSignedIn ? 'Saved on this device' : 'Free to start · no card needed'}</small></div>
    </section>
    <section className="home-preview" aria-label="A glimpse of the Folio editor">
      <div className="preview-top"><span>folio workspace</span><i>● saved</i><b>Preview ↗</b></div>
      <div className="preview-tabs"><span className="tab-peach">Home</span><span className="tab-green">Work</span><span className="tab-blue">About</span><i>+</i></div>
      <div className="preview-canvas"><p>YOUR INTERNET CORNER</p><h2>A place to<br />make your work<br /><em>feel alive.</em></h2><div className="preview-orbit">✦</div><div className="preview-note">drag it<br />wherever<br />you want ↙</div><div className="preview-tool">✎ Edit&nbsp;&nbsp;&nbsp; ⧉ Duplicate&nbsp;&nbsp;&nbsp; Copy</div></div>
    </section>
    <section className="home-principles"><p>NOT ANOTHER WEBSITE BUILDER</p><div><h2>Make it yours.</h2><span>Freeform canvas pages, considered scroll pages, living details, and enough structure to keep the work in focus.</span></div><div><h2>Keep it human.</h2><span>Less “launch a brand.” More “this is what I make, and why I care about it.”</span></div></section>
    <footer className="home-footer"><span>© folio</span><div><button onClick={onPlans}>Plans</button><button onClick={onCredits}>Credits</button><button onClick={onStart}>Start making ↗</button></div></footer>
  </main>
}
