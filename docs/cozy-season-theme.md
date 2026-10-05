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

This repo has no package.json, build/lint/typecheck configuration. There is no
browser, shell or screenshot renderer available in this session, so the following
have NOT been run: Playwright, Safari/WebKit, touch hit-testing, geometry comparison,
screenshot inspection or idle/working visual review. No screenshot is fabricated
or represented as a running-game capture.

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
These files are not present until the runner is actually executed.

For manual review on the preview deployment, open ?season-theme=autumn, then
the Quán tab; switch to the other query values. The page still uses normal game
navigation and storage. Do not treat this as a read-only gameplay mode.

## Review status
Implementation and logic checks complete; visual approval pending real browser
screenshots. Check that the room is subdued enough behind the machine, that the
cup remains readable, and that no new filter creates a mobile rendering problem.
Do not merge/deploy production before this visual review.
