# Design summary — nikdor.xyz

Brutalist, minimalist, terminal-themed. White-primary ("screaming white &
black", not black & white). Ink is the accent, applied as solid blocks. No
images, no external assets, no illustration — every visual element is built
from boxes, rules and text. This is the as-built reference for the live site,
not a set of options.

---

## 1. Color — Alabaster

Only two real colors: paper and ink. Greys are support, never accent.

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#FAFAFA` | Page background. The dominant surface. |
| `--panel` | `#F2F2F2` | Card fills on paper (buttons, inputs) — never used on ink cards. |
| `--ink` | `#1A1A1A` | All text, all borders, every inverted block. |
| `--muted` | `#7D7D7D` | Secondary text on paper — labels, captions, timestamps. |
| `--rule` | `#CCCCCC` | Hairlines on paper only — never text, never fills. |

Every card on the site is an inverted block (`background: var(--ink)`), so
plain `--muted` (3.4:1 on ink) is never used for text on a card. Three
on-ink variants exist for that surface:

| Token | Hex | Role |
|---|---|---|
| `--on-ink` | `#FAFAFA` | Primary text/links on an ink surface. |
| `--muted-on-ink` | `#A6A6A6` | Secondary text on an ink surface (~7.4:1). |
| `--rule-on-ink` | `#4A4A4A` | Hairlines inside an ink card (card-foot divider). |

No gradient, no shadow except the flat offset `4px 4px 0 var(--rule)` on
hover. No hex value appears in markup or scripts — every color reference
goes through a token.

---

## 2. Typography

JetBrains Mono for everything — body, UI, headings. `--font-display` and
`--font-mono` hold the same value; a headline-font swap stays a one-line
change if ever needed, but nothing else in the system currently branches
on it.

```
Google Fonts: JetBrains Mono — 400, 500, 600, 700, 800 (+ italic 400)
```

Loaded with `rel="preconnect"` to `fonts.googleapis.com` /
`fonts.gstatic.com`, before the stylesheet links, in every page `<head>`.

| Element | Size | Weight | Tracking | Case |
|---|---|---|---|---|
| h1 (hero) | 34px (28px ≤880px) | 800 | -0.03em | none |
| h2 (section head) | 20px | 800 | -0.03em | none |
| h3 / card title | 17px | 700 | 0.01em | none |
| Body / paragraph | 16px | 400 | 0 | none |
| Card body text | 14px | 400 | 0 | none |
| Nav link | 13px | 500 (600 active) | 0.04em | lowercase |
| Button / social label | 14px | 700 | 0.02em | lowercase |
| Tag `[ x ]` | 13px | 600 | 0.01em | as-authored |
| Eyebrow (`// section`) | 12px | 500 | 0.18em | uppercase |
| Kicker (inverted, e.g. `open for work`) | 12px | 800 | 0.14em | uppercase |
| Meta / section count / index number | 11px | 500 | 0.16–0.18em | uppercase |

`h1` caps at `max-width: 15ch` with `text-wrap: balance`. Section intros and
hero copy cap at `46ch`; the About page's long-form bio runs `66ch`, wide
enough that 46ch would read as an unreadably narrow ribbon.

---

## 3. Edges & geometry

- **Radius: 2px** on everything — buttons, cards, inputs, the brand mark,
  the accent block.
- **Tags are not chips.** `[ Rust ]` in brackets, no border, no fill.
- Borders: `1px solid var(--ink)` on paper controls (buttons, inputs,
  social buttons), `2px solid var(--ink)` on every inverted card, `3px
  solid var(--ink)` (`--rule-w`) on structural rules — the header bottom
  edge, section-head underlines, the meta-strip top rule, the footer top
  edge, the order-modal border.
- No blur, no soft shadow. The only shadow in the system is
  `4px 4px 0 var(--rule)`, paired with a `translate(-2px, -2px)` on
  hover — used identically on every card, every button, every social
  button, and the brand mark. One hover pattern, everywhere.

---

## 4. Inversion — what's ink, what's paper

Every card on the site inverts (solid `--ink` fill, `--on-ink` text,
`--rule-on-ink` hairlines): project cards, service cards, skill cards,
certificate cards, competition cards, timeline/experience entries, the
freelance card, the stats row.

Also inverted: the `NIKDOR` brand mark, the footer slab, the primary
button, the `open for work` / `currently working on` kicker, the hero
accent block, and the order-form's error/success states (this system has
no color for status — a message either inverts or it isn't shown).

Not inverted: page background, the nav bar, all headings and prose on
paper, the meta strip, the `current-project` annotation (paper with a 3px
ink left-border, not a card), form inputs, and the order/certificate
modal surfaces (paper — the certificate modal wraps a white PDF).

A control that sits on top of an ink card (Order button, View PDF button)
uses `.btn-invert`: paper fill, ink text — the inverse of `.btn-primary`.

---

## 5. Components

- **Nav** — brand left, slash-lowercase links right (`/ about`, `/
  skills`, `/ projects`, `/ achievements`, `/ services`). Active link:
  `border-bottom: 2px solid currentColor`, heavier weight.
- **Section head** — `// title` left, `NN items` count right, sitting on
  a 3px ink rule.
- **Card** — 2px ink border, ink fill, optional `card-head` (title +
  `NN` index number), optional paper `kicker` (e.g. `featured`), body
  text, `card-foot` (1px `--rule-on-ink` divider) holding tags and/or a
  link/button.
- **Buttons** — `.btn` (panel fill, ink border) · `.btn-primary`
  (inverted, used once per page for the dominant action, carries the
  blinking 7×13px block cursor, `1.1s steps(1)`, disabled under
  `prefers-reduced-motion`) · `.btn-ghost` (transparent) · `.btn-invert`
  (paper-on-ink, for controls inside a card).
- **Tags** — `[ bracket ]`, no border, no fill, full ink weight on paper /
  `--muted-on-ink` on a card.
- **Links** — `.link-accent` is underlined ink text, no arrow glyph and
  no other decoration. `.link-disabled` renders as `[ label ]` in muted
  text, not clickable (used for the one private/closed-source project).
- **Social buttons** — inline SVG icons (no `<img>` + filter hacks) so
  they inherit `currentColor` on both paper and the footer.
- **Footer slab** — inverted, copyright left, email right, uppercase
  tracked.

---

## 6. Layout

Single column, `max-width: 980px`, centered, `32px` horizontal padding
(`24px` ≤880px, `18px` ≤520px). Card grids use `gap: 24px` (`16px`
≤720px) and collapse to one column at that same breakpoint. Interior
spacing is always `gap`, never margin, inside flex/grid containers.

Page section order is per-page (see below), not a fixed template — there
is no ticker, no marquee, no component-lab demo block, and no
ink/density/contrast meters on the live site.

---

## 7. Voice

Lowercase, terse, technical. `//` and `/` as punctuation — section
markers, nav links, and the separator inside a single line of related
facts (e.g. `Aug 2024 / Codecademy / Certificate`, `Digital operations /
Software solutions / Video editing`). No em dash or bullet (`•`) as a
separator, no arrow glyphs (`→`) anywhere, including inside links — an
underline alone marks a link as active. No exclamation marks, no
marketing adjectives, no emoji.

---

## 8. Pages

1. **Home** (`/`) — hero (eyebrow role line, h1, subtitle, description,
   primary + text-link actions, ink accent block), meta strip (tag row +
   `open for work` kicker), stats row (inverted, 3 stats), current-project
   annotation, freelance card, links section (5 inline-SVG social
   buttons).
2. **About** (`/about.html`) — eyebrow + h1, bio (5 paragraphs, 66ch),
   education timeline (2 inverted entries with inline mortarboard icon),
   experience (1 inverted entry linking to Projects).
3. **Skills** (`/skills.html`) — 7 inverted category cards in a 2-col
   grid, each with an index number and a `> name` / description list.
4. **Projects** (`/projects.html`) — data-driven from
   `data/projects.json`, pinned entries first with a `featured` kicker,
   2-col grid of inverted cards (index, languages as tags, description,
   tag row, repository link or `[ closed-source ]`).
5. **Achievements** (`/achievements.html`) — certificate grid (5 inverted
   cards, `view pdf` opens a paper `:target` modal with an iframe),
   competition list (4 inverted cards).
6. **Services** (`/services.html`) — data-driven from
   `data/services.json`, 3 category grids of inverted cards (price +
   `order` button), order/payment info, contact links, and the order
   modal (paper surface, inverted error/success states).
