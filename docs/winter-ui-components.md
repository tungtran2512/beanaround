# Winter component artwork — 6 October 2026

The four winter component backgrounds were redrawn from the user's separately supplied header, order/price, delivery button, and footer references. These replace the previous small vector accents on those four winter surfaces. Other seasons, café stage artwork, equipment, recipes, unlocks, finances, timers and save data are unchanged.

## Assets

| Runtime asset | Role |
| --- | --- |
| `assets/bean-around/winter-ui-header.webp` | Snowy fir ends, warm light cable, pinecone, gold/red baubles, navy center |
| `assets/bean-around/winter-ui-order.webp` | Pale icy paper, navy/gold trim, fir/pinecones, right lantern |
| `assets/bean-around/winter-ui-deliver.webp` | Icy bevel, snowy fir/pinecone ends, warm bulbs, clear blue center |
| `assets/bean-around/winter-ui-footer.webp` | Lanterns at both ends, snowy fir, blue field, wooden lower lip |

The source is an imagegen redraw, not the user's original attachment or a flattened screenshot of the game. It is preserved at `assets/bean-around/sources/winter-ui-atlas-2026.png`. Four independent 1170px-wide WebP derivatives total approximately 378 KiB. The original source is not fetched by the game.

The header/title, dates, cash, order, price, timers, button label, navigation icons and selected/disabled states remain live HTML/SVG. No fake labels or numbers are part of the art.

## Integration

- `SeasonTheme.winter.uiArtwork` is the centralized four-asset map. Other seasons set skin variables to `none`.
- `syncWinterComponentArt()` mounts an aria-hidden absolute layer inside each existing host. It adds no service-panel rows and does not change host padding, sizes, font sizes or action attributes.
- Each illustration has separate left, center and right slices. Endcaps scale together; the quiet middle can stretch to fit the existing responsive width. Container units preserve endcap proportions when space permits, with a percentage fallback.
- Live controls remain above artwork. All decoration and descendants use `pointer-events:none`.
- The old winter note, header garnish, CTA flakes and footer corners are suppressed on these four surfaces to avoid duplicate ornament.
- Small local backplates protect text over the detailed branches while preserving text positions.
- Skin nodes mount only when missing, survive unchanged panels, and unmount on theme changes. The stable machine/background patchers are untouched.

## Validation

Tested code commit: `a49af3767277b4dd95f7d311a6f5fd2780335820`.
[GitHub Actions run](https://github.com/tungtran2512/beanaround/actions/runs/37398782428).

- JavaScript syntax parses; 1,089 existing deterministic logic checks passed.
- Chromium and WebKit passed at 375×812, 390×844 and 430×932.
- All 14 tracked host/machine/cup rectangles match the baseline within 0.75 CSS px in every season.
- 44px main touch targets, center hit testing, no horizontal overflow, zero page/console/asset errors.
- Preview theme changes preserve serialized state and localStorage. Winter art unmounts on switching to spring.
- The illustrated delivery button becomes enabled after an actual recipe completes; a real click serves the order and increases real revenue.
- Existing branch-online purchase/advertising tests and machine/background DOM-retention checks passed.
- Screenshots were captured from the running game, opened and visually inspected. Inspection caught poor contrast over order-card branches and obscured navigation icons; local backplates and explicit foreground stacking resolve them.
- Source atlas and all four optimized derivatives were opened and inspected.
- Real screenshots: [components at 390px](screenshots/winter-ui-components-390.jpg), [three mobile widths](screenshots/winter-ui-responsive.jpg), [ready-to-deliver Chromium](screenshots/winter-ui-ready-chromium.png), [ready-to-deliver WebKit](screenshots/winter-ui-ready-webkit.png), [before this update](screenshots/winter-ui-before.jpg).
- Structured browser results: [Chromium](screenshots/winter-ui-chromium.json), [WebKit](screenshots/winter-ui-webkit.json).
- The screenshot fixture clears old temporary toast messages when starting a fresh test scene; runtime toast behavior is unchanged.

There is no package/build/lint configuration in this static repository. Validation therefore uses script parsing, the game's regression suites and actual browser execution. CI emits existing Node/action deprecation warnings; the game has no console errors.

## Limits

This is a faithful redraw, not a claim of pixel-identical reproduction. Source photos have presentation margins and different banner proportions; the game uses only the banner design, fits its existing geometry, and keeps live text readable. Active navigation and disabled delivery state intentionally remain visible over the illustration. No physical iPhone or sustained frame-rate profile was available. No production deployment or main-branch update was performed.
