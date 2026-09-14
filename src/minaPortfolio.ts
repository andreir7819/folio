import type { Block, Page } from './App'

// Fictional demo content, built entirely from the same editable blocks as user portfolios.
export function createMinaPages(): Page[] {
  let serial = 0
  const block = (type: Block['type'], content: string, extra: Partial<Block> = {}): Block => ({
    id: `mina-example-${++serial}`, type, content, animation: 'rise', animationDuration: .65,
    loopAnimation: 'none', ...extra,
  })
  const heading = (content: string, subtitle: string, size = 66) => block('text', content, { subtitle, font: 'editorial', textSize: size, textLineHeight: 1.08 })
  const body = (content: string) => block('body', content, { font: 'DM Sans', textSize: 18, textLineHeight: 1.7, textColor: '#626357' })
  const image = (name: string, alt: string) => block('image', alt, { imageUrl: `/mina/${name}.svg`, imageAlt: alt, imageRadius: 8, imageBorderStyle: 'none' })
  const link = (content: string, pageId: string, extra: Partial<Block> = {}) => block('button', content, {
    buttonLinkType: 'page', buttonPageId: pageId, buttonVariant: 'solid', buttonCorner: 'pill', buttonSize: 'medium',
    accent: '#384b38', buttonTextColor: '#fffdf4', showButtonArrow: true, ...extra,
  })
  const page = (id: string, name: string, blocks: Block[], color = '#fbfaf4', showInNav = true): Page => ({
    id, name, slug: id === 'home' ? '' : id, layout: 'scroll', showHeader: true, showInNav,
    transition: 'fade', background: { type: 'color', color, gradientStart: color, gradientEnd: '#e8e1f2', gradientAngle: 135, imageUrl: '', imageFit: 'cover' }, blocks,
  })
  const home = page('home', 'Home', [
    block('shape', 'Lilac sun', { shapeType: 'circle', shapeWidth: 190, shapeHeight: 190, accent: '#c6b4ed', position: { x: 83, y: 8 }, zIndex: 1, loopAnimation: 'float' }),
    block('shape', 'Little orange spark', { shapeType: 'star', shapeWidth: 86, shapeHeight: 86, accent: '#dc8062', position: { x: 8, y: 65 }, zIndex: 1, loopAnimation: 'spin' }),
    block('text', 'A little clarity.\nA lot of character.', { subtitle: 'MINA PATEL / INDEPENDENT DESIGNER', font: 'editorial', textSize: 78, textLineHeight: 1.03, textAlign: 'center', position: { x: 50, y: 18 }, centerX: true, zIndex: 3 }),
    block('body', 'I make thoughtful digital experiences and identities for people doing good things. Useful first. A little unexpected, always.', { font: 'DM Sans', textSize: 20, textAlign: 'center', textLineHeight: 1.6, position: { x: 50, y: 48 }, centerX: true, zIndex: 3 }),
    link('Explore selected work', 'work', { position: { x: 50, y: 69 }, centerX: true, zIndex: 3 }),
    block('body', 'An example portfolio made in Folio. Fictional designer, real possibilities.', { textSize: 13, textAlign: 'center', position: { x: 50, y: 84 }, centerX: true, zIndex: 3 }),
  ])
  home.layout = 'canvas'
  home.canvasHeight = 900
  return [home,
    page('work', 'Work', [
      heading('Thoughtful things,\nmade with a point of view.', 'SELECTED WORK / 2025—2026'),
      body('A small collection of imagined products, identities, and experiments. These self-initiated concepts explore how clarity and personality can live in the same place.'),
      image('wavy-weather', 'Wavy Weather: a lilac weather app with a warm illustrated forecast'),
      heading('01 — Wavy Weather', 'PRODUCT DESIGN · INTERACTION · PROTOTYPING', 44),
      body('A calmer way to answer a very everyday question: what will today feel like? A weather app concept that puts a useful daily summary before the data.'),
      link('Inside Wavy Weather', 'wavy-weather'),
      image('common-ground', 'Common Ground coffee identity with green and cream stationery'),
      heading('02 — Common Ground', 'VISUAL IDENTITY · WEB DESIGN', 44),
      body('An independent neighborhood café, imagined from the first wordmark to the last mobile interaction. Familiar enough to feel welcoming; distinctive enough to remember.'),
      link('Meet Common Ground', 'common-ground'),
      image('field-notes', 'Two graphic studies exploring warm colors, circles and arch forms'),
      heading('03 — Field notes', 'ONGOING / SMALL EXPERIMENTS', 44),
      body('A place for ideas without a brief. Shape studies, unexpected color pairings, and little compositions made simply to see what happens. Not everything needs to become a product.'),
      link('Have something in mind?', 'contact'),
    ]),
    page('wavy-weather', 'Wavy Weather', [
      heading('Less forecast.\nMore feeling.', '01 / WAVY WEATHER'),
      body('Self-initiated concept · 2026 · Four-week exploration\nRole: product strategy, interface design, and interactive prototyping. This is an illustrative case study, not a released app.'),
      image('wavy-weather', 'Wavy Weather concept showing a 22-degree forecast and hourly temperatures'),
      heading('The everyday question', 'THE BRIEF', 42),
      body('Most days, I don’t need twelve weather charts. I need to know whether to take a jacket, leave a little earlier, or spend lunch outside. The brief was to make the first screen useful in five seconds without hiding the details.'),
      heading('Start with the decision.', 'THE APPROACH', 42),
      body('I organized the experience around three layers: a plain-language summary, the next few hours, and a deeper forecast. Temperature has room to breathe. Supporting information stays quiet until it matters. The visual weather illustration adds atmosphere without competing with the answer.'),
      block('quote', 'A good forecast helps you plan your day, then gets out of the way.', { subtitle: 'Design principle / Wavy Weather' }),
      heading('Small decisions,\nbig difference.', 'DETAILS THAT MATTER', 42),
      body('The warm paper background softens the interface. Lilac distinguishes cloudy conditions without making the day feel gloomy. Hourly information reads left to right, and every essential status has a text label—color is never the only cue.'),
      heading('What I would test next', 'REFLECTION', 42),
      body('This concept has not been user-tested, so there are no invented conversion rates or success metrics. The next step would be to test whether people can answer “Do I need a jacket?” faster, check contrast in bright sunlight, and explore severe-weather alerts with the prominence they deserve.'),
      link('Next: Common Ground', 'common-ground'),
      link('Back to all work', 'work', { buttonVariant: 'text', buttonTextColor: '#384b38' }),
    ], '#f4f0f9', false),
    page('common-ground', 'Common Ground', [
      heading('Your usual.\nAnything but ordinary.', '02 / COMMON GROUND'),
      body('Fictional café identity · 2026 · Three-week exploration\nRole: brand direction, visual identity, and website concept. An independent project exploring how a neighborhood place might feel online.'),
      image('common-ground', 'Common Ground brand mockups: wordmark card and green illustrated poster'),
      heading('A place, not a lifestyle.', 'THE BRIEF', 42),
      body('The imagined café is somewhere you stop on a normal Tuesday. The identity needed to feel hospitable without becoming generic, and the website needed to answer practical questions before telling a brand story.'),
      heading('Built around familiarity', 'IDENTITY SYSTEM', 42),
      body('A generous serif wordmark, forest green, warm cream, and a soft apricot accent form the core. The circular illustration suggests a shared table and a coffee bean. A small visual vocabulary lets menus, packaging, and signage feel related without looking identical.'),
      block('quote', 'Make it easy to find your way in.', { subtitle: 'Design principle / Common Ground' }),
      heading('The website has a job.', 'DIGITAL EXPERIENCE', 42),
      body('Opening hours, the menu, location, and accessibility information come first. On a phone, those tasks take priority over large photography. Motion is limited to short, optional transitions, so the experience still works for someone checking a menu on a slow connection.'),
      heading('A system with room to grow', 'REFLECTION', 42),
      body('The next iteration would stress-test the identity on long menus, seasonal notices, and bilingual layouts. A good identity should survive ordinary use, not just look good on a presentation slide.'),
      link('More about my approach', 'about'),
      link('Back to all work', 'work', { buttonVariant: 'text', buttonTextColor: '#384b38' }),
    ], '#f0f2e8', false),
    page('about', 'About', [
      heading('Curious by nature.\nConsidered by design.', 'HELLO, I’M MINA'),
      body('I’m a fictional independent designer created for this Folio example. My work sits between clear digital products and expressive visual identities. I care about the moment when something becomes easier to understand—and a little more enjoyable to use.'),
      image('field-notes', 'Mina’s graphic field notes: abstract circular and arched compositions'),
      heading('How I like to work', 'A LITTLE STRUCTURE, A LITTLE PLAY', 42),
      body('01 / Listen carefully. Get clear on who the work is for and what it needs to do.\n\n02 / Find the shape of it. Explore a few distinct directions, then choose one for a reason.\n\n03 / Make it tangible. Move into prototypes early, where details can be tried rather than debated.\n\n04 / Refine together. Test, simplify, and leave a system someone else can confidently use.'),
      heading('Things I can help with', 'CAPABILITIES', 42),
      body('Product and interface design · Responsive websites · Visual identities · Interactive prototypes · Design systems · Creative direction for small teams'),
      block('quote', 'Personality is most useful when it makes something feel more human.', { subtitle: 'A working philosophy' }),
      heading('Away from the screen', 'SMALL THINGS', 42),
      body('Collecting printed ephemera. Noticing hand-painted signs. Taking the slower route home. Keeping a notebook full of ideas that may or may not ever become anything.'),
      link('Let’s make something thoughtful', 'contact'),
    ]),
    page('contact', 'Contact', [
      heading('Good things start\nwith a conversation.', 'SAY HELLO'),
      body('Have a product that needs some clarity, an identity that needs a little character, or an idea you’re still finding words for? A short introduction is a lovely place to start.'),
      heading('A useful first note', 'WHAT TO INCLUDE', 42),
      body('Tell me a little about your project, who it’s for, what you need help with, and your rough timeline. If you have a budget range or a few references, include those too. The brief doesn’t have to be perfect.'),
      block('quote', 'A little context goes a long way.', { subtitle: 'No pitch deck required' }),
      body('This is a fictional example, so there is no live inbox or inquiry form. When you make your own portfolio, replace this note with your preferred contact details and connect a button to your contact page.'),
      link('Take another look at the work', 'work'),
      link('Back home', 'home', { buttonVariant: 'text', buttonTextColor: '#384b38' }),
    ], '#f5ece4'),
  ]
}
