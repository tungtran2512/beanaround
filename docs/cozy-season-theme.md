# Cozy SeasonTheme — preview only

## Scope
Base: 578ef27013e71ac65ee658b09297ff6f1ac0b88d.
This branch does not update main or production.

The existing eight-row service renderer and all its dimensions, grid definitions,
padding, machine sizing and touch positions are retained. Existing CSS is intact;
an additive, scoped paint layer handles the visual treatment.

## Architecture
SeasonTheme has autumn, spring, summer and winter configurations. Each defines
background, headerDecor, machineAreaDecor, orderDecor, ctaDecor, navDecor,
particles, lighting and a separate atmospheric palette. One cafeSceneMarkup
renderer is reused; there are no separate gameplay pages.

Theme selection is presentation-only:
- active package: tet -> spring, summer -> summer, autumn/midautumn -> autumn,
  xmas -> winter;
- otherwise existing GAME calendar: months 1–3 spring, 4–6 summer, 7–10 autumn,
  11–12 winter;
- ?season-theme=autumn (also spring/summer/winter/off) is a non-persistent visual
  override for review. It never buys a package or changes a saved field.

Paid packages still cost 30,000k, last 30 game days, obey the same month gates
and double online parcels. No economic or recipe/timer changes.

The small ornament configuration uses four original botanical SVGs. Only the
active motif URL is requested; header/CTA/navigation share its browser cache.
The common room SVG is loaded once. Scene markup is cached by theme and scope.
No ambient timers or frame-by-frame particle allocation were added. Sparse
petals/leaves/snow are static and confined to the rear window. At <=380px,
secondary stage props and navigation corner ornaments are hidden first.

## Layers
0: common café room with oak shelving, jars, glazed ceramics, window and brass lamps.
1: subdued seasonal window/edge props, behind equipment.
2: warm cream lighting treatment; room alone has 2px blur, muted saturation.
3: original sharp machine SVG and live cup, full opacity.
4: existing cup selection and game controls.
5: existing shift/feedback layer.
All new decoration nodes and pseudo-elements use pointer-events:none.

Header has tiny corner branches and warm lights in the top edge only.
Order card gets a paper lighting treatment, no note covering price/options.
Ingredient/finish button backgrounds, portraits and active navigation styling
are unchanged. Delivery motifs remain in its bottom corners.

## Asset inventory and decisions
| Path | Use |
| --- | --- |
| assets/bean-around/equipment-vector.svg | Existing original vector machine atlas retained byte-for-byte; source read, no redraw or resizing this task. |
| assets/bean-around/cafe-room.svg | New 7.6KB original architectural SVG: restrained café background, shared across all seasons. |
| assets/bean-around/season-autumn.svg | New maple/dried botanical edge artwork; reference implementation. |
| assets/bean-around/season-spring.svg | New small blossom/young-leaf edge artwork. |
| assets/bean-around/season-summer.svg | New subdued green leaves; no beach imagery. |
| assets/bean-around/season-winter.svg | New pine/one small brass ornament/snowflake edge artwork. |
| season-scenes.png, season-borders.png, *-full-frame.png | Archived, unused. Prior wide/full-frame composition conflicts with fixed layout and low-density design. |
| Original UUID-named PNGs | Unchanged. Binary contents cannot be visually opened with this session's tools; no guessed mapping or claimed inspection. |

New background and all four motifs together are about 12KB of SVG text.
None embeds a bitmap, references an external host or adds a full-screen image.
The original equipment/source files are not modified.

## Actual verification
- Complete inline JavaScript parses successfully.
- 1,079 deterministic game logic tests passed (11 new atmosphere checks).
- Compared 20 gameplay/rendering functions against the base: identical, including
  renderStation, machineIllustration, patchMachineElement, all brewing operations,
  online counts, package purchase, save/migrate, daily transitions and branch forecast.
- All pre-existing CSS remains byte-for-byte before the additive theme stylesheet.
- New SVG tag balance, unique IDs and internal gradient references passed checks.
- Optional browser runner JavaScript syntax passed.

This repo has no package.json or build/lint/typecheck configuration.
There is no local shell/browser, but GitHub Actions successfully ran the actual
Playwright browser suite in BOTH Chromium and WebKit:
https://github.com/tungtran2512/beanaround/actions/runs/37343997278

Both passed at 390x844, 375x812 and 430x932:
- positions and sizes of all 14 regions unchanged from baseline (0.75px tolerance);
- no horizontal overflow; primary targets at least 44px;
- decoration layers cannot intercept touches; hit-testing reaches live buttons;
- machine and cup have no filter and remain fully opaque;
- switching devices preserves the room and equipment image nodes;
- no page errors, console errors or missing asset responses.

Each browser captured 12 seasonal screenshots, 6 idle/working equipment screenshots
and 3 baseline screenshots from the real game. These are not generated mockups.
WebKit is an automated Linux WebKit build, not physical iPhone Safari.

## Reproducible browser / screenshot checks
tests/season-theme-browser.cjs serves this branch and the base HTML locally,
uses isolated browser storage, opens real game recipes, and:
- compares before/after bounds for all 14 key containers;
- checks no horizontal overflow, 44px targets and actual touch hit tests;
- checks state/localStorage are unchanged by theme switching;
- captures all four themes at 390x844, 375x812 and 430x932;
- captures espresso/juicer/blender idle and working at 390x844;
- verifies machine switching retains the room and equipment image nodes;
- fails on browser console/page errors or failed assets.

Run from a clone containing the base commit (Playwright >=1.45):
    npm install --no-save playwright
    npx playwright install chromium webkit
    node tests/season-theme-browser.cjs
    BROWSER=webkit node tests/season-theme-browser.cjs

Results are written to artifacts/season-theme/<browser>/results.json and PNGs.
The first successful run's captured images are available here:
- Chromium: https://github.com/tungtran2512/beanaround/actions/runs/37343997278/artifacts/11360350094
- WebKit: https://github.com/tungtran2512/beanaround/actions/runs/37343997278/artifacts/11360005732

The CI workflow has read-only repository permissions and only uploads test artifacts;
it never pushes a branch, merges a PR, deploys a site or accesses production saves.

For manual review on the preview deployment, open ?season-theme=autumn, then
the Quán tab; switch to the other query values. The page still uses normal game
navigation and storage. Do not treat this as a read-only gameplay mode.

## Visual review
The first four-season 390x844 contact sheet was opened and visually inspected.
The machine/cup and order were clear and controls stayed clean, but differences
between seasons were too subtle. A follow-up changed rear-window colors/foliage,
placed one small seasonal object on the rear shelf and slightly increased
header corner ornament visibility. Machine and live control geometry remained
unchanged. Subsequent browser checks and contact sheets are recorded below.

Remaining limits: no physical iPhone, Safari chrome/keyboard/orientation testing,
extended play performance measurements, or accessibility contrast instrumentation.
375x812 and 430x932 have automated layout/touch checks and real screenshots; they
are not a claim of hands-on device testing. Production remains unchanged.

The refined 390x844 contact sheet and six equipment-stage captures were opened
and inspected. No decoration obscures the machine, cup, order or controls. A final
paint-only contact shadow strengthens the device/worktop relationship. Real
contact sheets are committed under docs/screenshots; full-resolution individual
screens and other viewport captures are in the CI artifacts.

## Final review evidence
- Game/style commit: 30f8310ab9fed93aec355e2b2573a5c2d507135d.
- Final browser run: https://github.com/tungtran2512/beanaround/actions/runs/37345070554
- Chromium screenshots: https://github.com/tungtran2512/beanaround/actions/runs/37345070554/artifacts/11360041914
- docs/screenshots/four-seasons-390.jpg: actual four-season game captures, assembled for review.
- docs/screenshots/equipment-stages.jpg: actual bench captures for three devices, idle and working.
- docs/screenshots/chromium-results.json: recorded browser run results.

These final contact sheets were opened and visually inspected. Machines/cups are
sharp; subdued shelf/window details stay behind them; all four order cards remain
readable; no botanical art covers buttons. Sparse seasonal artwork is intentional.
The 375px/430px variants were checked automatically, not individually eyeballed.
The code is on feat/cozy-season-themes and PR #2; main is unchanged.
