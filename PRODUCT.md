# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences, weighted equally: recruiters and hiring managers in industry (maintenance, continuous improvement, cost optimization) evaluating an Industrial Civil Engineer, and people from the tech side looking at what he builds on GitHub.

## Product Purpose
Personal portfolio of Fernando Véliz (Ingeniero Civil Industrial, Región de Coquimbo, Chile). It presents the industrial engineering profile and, alongside it, the web tools and games he publishes on GitHub. Success: a visitor understands both sides in seconds and goes to the CV (LinkedIn) or contacts him.

## Positioning
An industrial engineer who also ships real software: daily games (Chiledle, Shortcut-dle), trackers, a music player, an osu!mania beatmap generator. The GitHub side is live proof, not a claim.

## Operating Context
Static site on GitHub Pages (repo `ladrillopastabasee.github.io`). The GitHub projects section must update itself when new public repos are created, reading links and descriptions from each repo's README via the public GitHub API, with no build step.

## Capabilities and Constraints
- Static HTML/CSS/JS, no build step, no server.
- GitHub data fetched client-side from the public API (unauthenticated, 60 req/h per visitor), cached in the browser.
- CV is promoted through a LinkedIn button; the LinkedIn URL is not available yet (left configurable).

## Evidence on Hand
- `bart.jpg` profile picture.
- Email: fernando.jvelizv@gmail.com.
- Public GitHub repos with Spanish READMEs (user `ladrillopastabase`).
- Industrial project cards are placeholders (same title repeated); no real figures. The user chose not to lead with numbers: do not invent metrics; use real GitHub stats instead.

## Brand Commitments
- Keep the existing identity: dark ground, animated colour blobs, glass panels. Improve colour and style, do not replace it.
- Motion-heavy and eye-catching by explicit request ("usar siempre muchas animaciones, muy llamativo").
- Spanish copy.

## Product Principles
- Both sides of the profile get equal stage.
- Show real work, never invented numbers.
- The page maintains itself: a new repo appears without editing the site.

## Accessibility & Inclusion
Respect `prefers-reduced-motion` despite the motion-heavy brief.
