# Zidny Design System

The brand and UI foundation for **Zidny** — an Algerian agency and freelance
marketplace that connects top talent with the best opportunities and guides
businesses through digital transformation. Tagline spirit: *"Chez Zidny, on
digitalise même ta grand-mère."* Clarity, optimism, forward motion — for
everyone, not an elite.

This project doubles as the home of **Zidny Talks**, the brand's podcast
pitch deck (see `decks/zidny-talks/`).

> **Sources provided:** brand color slide (`assets/reference/color-palette-slide.jpg`),
> logo (`uploads/Zidny_logo.png`), `Outfit-Bold.ttf`, decorative blur motif
> (`Vector 277.png`), and the Zidny Talks deck (`Zidny_Talks_Pitch_Deck.pptx`
> + `zidny talks_presentation content.docx`). No codebase or Figma was
> attached — the component library and UI kit are an original, on-brand
> interpretation built from the palette + the requested "Apple liquid glass"
> direction.

---

## Visual identity in one line

**Deep-navy canvases, frosted sky-blue glass, Outfit type, soft blue-cast
shadows, fully rounded controls.** Apple "liquid glass" rendered in the Zidny
palette.

---

## CONTENT FUNDAMENTALS

How Zidny writes.

- **Bilingual, French-first.** Product and marketing copy lead in French
  (Algerian context), with English and Arabic appearing where the audience
  is global (e.g. episode titles). Darija is acknowledged as part of the
  audience's voice.
- **Voice:** confident, warm, a little rebellious. "Sans filtres." It speaks
  *to* a generation, not down to it. Optimistic about technology and about
  Algerian youth specifically.
- **Person:** collective **"nous / we"** for the brand, **"vous / you"** for
  the reader. ("Nous construisons la plateforme que la jeunesse algérienne
  n'a jamais eue.")
- **Casing:** Title Case for headings and section titles; sentence case for
  body. ALL-CAPS only for short eyebrows/labels and the wordmark
  (ZIDNY / TALKS) and CTAs ("REJOIGNEZ LE MOUVEMENT").
- **Punctuation:** French guillemets « » for pull-quotes; em-dashes for
  rhythm. Numbers are dramatized as standalone metrics (70%, 38M+, 0).
- **Tone examples:**
  - Headline: *"La Nouvelle Voix d'une Génération"*
  - Punchy claim: *"Impossible à Ignorer. Par Conception."*
  - Provocation: *"Une génération digitale existe. Sa voix, non."*
- **Emoji:** none. Not part of the brand. Use Lucide icons instead.
- **Vibe:** premium-but-accessible; a movement, not a corporation.

---

## VISUAL FOUNDATIONS

- **Color.** Hero is **Sky Blue `#2AA4E7`**; **Primary Blue `#0A60AD`** for
  links/hover/depth; **Deep Navy `#0C224B`** anchors (headings + dark
  surfaces). Airy support tints: Pale Cyan `#E9FCFF`, Aqua Tint `#A9EFFB`,
  with Warm Cream `#FFFAE6` as the single warm contrast. Neutrals are
  cool-cast. See `tokens/colors.css`.
- **Type.** One typeface — **Outfit** (geometric, optimistic). Headings 700,
  tight tracking (−0.01 to −0.02em); body 400 at 1.65 line-height; eyebrows
  600 uppercase with wide tracking. Bold weight is self-hosted from the
  uploaded TTF; other weights load from Google Fonts. See
  `tokens/typography.css`, `tokens/fonts.css`.
- **Backgrounds.** Two modes: (1) **light** — near-white with a faint cyan
  wash (`--surface-page`), for app/marketplace; (2) **deep navy** — a
  `158deg` navy gradient with soft sky **radial glows** and the **blur-line
  motif** (`assets/motifs/blur-line.png`, screen-blended), for decks/hero
  moments. No flat black, ever.
- **Glass (the signature).** Frosted translucent panels:
  `background: rgba(255,255,255,.06–.72)` + `backdrop-filter: blur(18–48px)
  saturate(160–200%)` + a 1px light hairline border + a **specular inner-top
  highlight** (`inset 0 1px 0 rgba(255,255,255,.6)`). Navy glass for dark
  surfaces. Tokens in `tokens/effects.css`.
- **Shadows.** Soft and **blue-cast** (`rgba(12,34,75,…)`), never harsh
  black. Five-step elevation + composed `--shadow-glass`. Brand CTAs add a
  sky **glow** (`--glow-brand`).
- **Corner radii.** Generous and Apple-soft: controls 14px, cards 20px, glass
  panels 28px, chips/avatars fully pill. See `tokens/spacing.css`.
- **Cards.** Rounded (lg/xl), thin hairline border, soft shadow; interactive
  cards lift 3px on hover. Glass cards swap the fill for frosted translucency
  + specular hairline.
- **Borders.** Hairlines: light `rgba(255,255,255,.12–.65)` on glass/dark;
  cool gray (`--border-default #DCE1E8`) on light.
- **Buttons.** Pill-shaped (999px), Outfit 600. Primary = solid sky + glow;
  glass = frosted (over imagery); ghost/secondary = soft tints.
- **Motion.** Gentle. Ease-out `cubic-bezier(.22,.61,.36,1)`; a soft
  overshoot `cubic-bezier(.34,1.56,.64,1)` for toggles/checks. Durations
  120/220/360ms. Fades + small rises; **no bounce-heavy or infinite
  decorative loops.**
- **Hover / press.** Hover: lighten fill / tint background / lift. Press:
  scale down ~0.985 + 1px nudge (buttons), 0.92 (icon buttons).
- **Transparency & blur.** Used liberally (heavy-glass brand direction) on
  navs, cards, modals, toasts, tabs — anywhere a surface floats over color or
  imagery. Dialogs dim + blur the backdrop.
- **Imagery vibe.** Cool, bright, optimistic — blues and cyans, soft light,
  glow rather than grain. The blur-line motif is the recurring flourish.

---

## ICONOGRAPHY

- **Icon set: [Lucide](https://lucide.dev)** — rounded caps/joins, ~2px
  stroke, geometric. It pairs naturally with Outfit and matches the clean,
  optimistic tone. Loaded from CDN (`https://unpkg.com/lucide@latest`);
  wrapped by the `Icon` component (`components/core/Icon.jsx`).
  > **Substitution flag:** the original deck rasterized **react-icons** PNGs.
  > Lucide is the closest clean, CDN-available, recolorable match and is
  > adopted as the official set. Swap if you have a licensed brand set.
- **Color.** Icons take Sky Blue / a light sky `#5BC2F2` on dark, or
  `--text-muted` → brand on hover in light UI. Recolor via `currentColor`,
  never a filter overlay.
- **Sizing.** 16–24px inline; 42px "chip" tiles (rounded square, tinted sky
  background) for feature/card icons.
- **No emoji. No unicode glyph icons.** Decorative dots/lines (deck pillars)
  are CSS shapes, not characters.

---

## INDEX / MANIFEST

**Foundations**
- `styles.css` — root entry (consumers link this one file; `@import`s only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
  `effects.css` (glass/shadow/motion), `base.css` (element defaults).
- `styles/components.css` — class-based component styling (tokens-driven).
- `cards/` — foundation specimen cards (Colors, Type, Spacing, Brand) shown
  in the Design System tab.

**Components** (`components/`, namespace `window.ZidnyDesignSystem_bbc922`)
- core: `Button`, `IconButton`, `Card`, `Badge`, `Tag`, `Avatar`, `Icon`
- forms: `Input`, `Select`, `Switch`, `Checkbox`
- navigation: `Tabs`
- feedback: `ProgressBar`, `Toast`, `Dialog`
  Each has `<Name>.jsx` + `.d.ts` + `.prompt.md`; each group has a `@dsCard`
  demo HTML.

**Assets** (`assets/`)
- `logo/zidny-logo.png`, `fonts/Outfit-Bold.ttf`,
  `motifs/blur-line.png`, `reference/color-palette-slide.jpg`

**Decks** (`decks/`)
- `zidny-talks/` — the Zidny Talks pitch deck, restyled with this system.
  See its own `README.md` for the token→role mapping.

**Pending / next** (see CAVEATS in chat)
- `ui_kits/marketplace/` — full-screen marketplace recreation.

---

*Namespace for `@dsCard` HTML:* `window.ZidnyDesignSystem_bbc922`.
