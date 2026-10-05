# Bean Around: seasonal packages and illustrated equipment

## Implemented
- Static HTML/CSS/JavaScript architecture preserved. No framework, runtime dependency, or backend added.
- Upgrade tab **Trang trí mùa**, scene previews and explicit purchase confirmation.
- Per-shop package costs **30,000k**, charged to the existing decorExpense ledger. One active package per shop; no stacking or automatic renewal.
- Effective on purchase day through day +29 inclusive. Time is simulation/game days, including days another shop is visited; nothing advances while the game is closed.
- Availability: summer months 4/5/6; autumn 9/10; Xmas 11/12; Tet 1/2; Mid-Autumn 7/8. Month 3 has no new package on sale. Existing game calendar is retained: day 1 starts in month 11.
- Buying on the last eligible day still gives all 30 days even after the selling window closes.
- Adds 50% counter/online demand before existing capacity and player order limits. This does not guarantee 50% more completed sales when capacity is already full, nor grant cash.
- Each branch buys independently; opening a branch does not copy its parent's paid decorations. Works when visiting a branch manually and with background branch demand.
- Existing saved ten-day festival purchases remain valid to expiry. Old purchase UI routes to the new package tab; cannot stack old and new packages.
- No new save version required: optional seasonPackage {id,start,end,paid}; old saves default to no paid package. Validation rejects malformed duration/value/ID.
- Preserves the earlier cold-brew procurement changes in this PR.

## Art provenance and mapping
The eight original UUID-named PNGs in the repository are preserved unchanged. Binary GitHub tool reads still cannot visually resolve them, so they are NOT assigned guessed content. The user subsequently supplied visible attachments in chat, which were inspected directly. No Windows C:/ path is referenced by the game.

| Visible user attachment | Observed content | Use |
| --- | --- | --- |
| ChatGPT Image Oct 5, 2026, 07_43_58 PM-1.png | Mid-Autumn game concept: burgundy, rabbit lanterns, yellow blossoms, moon/lake | Style and composition reference for new midautumn scene, not screenshot pasted into game |
| ChatGPT Image Oct 5, 2026, 07_44_08 PM-2.png | Summer game concept: sea, tropical leaves, hibiscus, citrus, wood | Reference for summer scene |
| ChatGPT Image Oct 5, 2026, 07_44_20 PM-3.png | Autumn concept: maple foliage, amber light, pumpkins, cat | Reference for autumn scene |
| ChatGPT Image Oct 5, 2026, 07_45_14 PM.png | Christmas concept: pine garlands, red bows, gifts, tree, snowman | Reference for Christmas scene |
| ChatGPT Image Oct 5, 2026, 07_42_56 PM-1.png | White/gold 3-group espresso machine, rails, two steam wands, white portafilters | Image-tool-derived transparent espresso asset, real service machine area |
| ChatGPT Image Oct 5, 2026, 07_43_19 PM-4.png | Black slow juicer, clear hopper and left outlet | Separate derived press asset in service |
| ChatGPT Image Oct 5, 2026, 07_43_14 PM-3.png | Silver/black blender, clear jug and blades | Separate derived blend asset in service |
| No separate Tet attachment | Requested peach/apricot blossoms and red lanterns | Newly generated Tet scene consistent with the approved palette, not a claim of exact reference matching |

### New assets
- assets/bean-around/season-scenes.png: 1024×1536 atlas, six scenes (five paid packages plus restrained everyday cafe). Generated original art from the observed design direction. Contains no fake gameplay text or values.
- assets/bean-around/equipment.png: 2172×724 transparent sprite sheet, derived via image tool from the three equipment references. Not official technical/product photography; exact manufacturer/model is not certified.
- CAFE_ASSETS in index.html centralizes relative paths, dimensions and independent crop rectangles. SVG viewBox clipping renders each asset without stretching, preserving PNG source files.
- Countertop and backdrop are separate non-interactive layers. Machine, cup, ingredients, order queue and action buttons remain live gameplay.
- Illustrations used in service scene, preparation/shop postcard, package previews and header accents.
- Coffee grinder and pour-over had no supplied separate reference; existing graphics are retained instead of substituting juicer/blender or inventing product assets.
- No liquid animation added: preparation timing and outcomes are unchanged.

## Visual scope and performance limits
- Scene art and machine sheet were opened/inspected as generated images. Source concept screenshots were inspected directly in chat.
- No full screenshot is used as a game background; reference UI/status bars/order numbers are excluded.
- Two cached PNG atlases total approximately 4.85 MB before HTTP compression. The eight large original reference PNGs are not loaded by the game. Further WebP/AVIF optimization is desirable.
- Camera/style is an illustration/render interpretation, not pixel-identical reproduction.
- Full decorative margins of the tall concept images are intentionally constrained to preserve the existing mobile interaction layout.
- Alpha edge/contact shadow quality on the real mobile background still needs browser review, especially around thin espresso rails, steam wands and transparent jugs. Do not label this as pixel-perfect extraction or fully visually approved.
- No production merge/deploy requested or performed.

## Verification actually performed
- Entire existing index.html read; no AGENTS.md or package/build/lint/typecheck configuration found in repository tree.
- JavaScript syntax compiled with V8.
- 1,022/1,022 game-logic checks pass using fixed RNG seed 123456789. Includes 943 prior checks (the calendar-only scene assertion updated to require purchase) plus 79 seasonal checks.
- Monthly eligibility matrix across 12 months for every package; exact debit, expense posting, cross-month expiry, renewals, no stacking, insufficient funds, prep-only purchase, old-save defaults, valid reload, corrupt save rejection, independent branches, demand limits, local asset paths and crop bounds.
- Existing upgrades, stock usage, cold brew, order flow, staff, online, reviews, branch simulation and reports remain covered by regression suite.
- No browser/DOM rendering or iPhone device runner is available in this session. No actual game screenshots or visual assertions at 375×812, 390×844, 430×932 or 1280×800 are claimed.
- Required next visual QA on preview: all three machines idle/working, focus/tap areas, no overflow, all seasonal scenes, purchase/reload/expiry, ingredient and delivery controls, portrait short heights. The preview must be reviewed before production.
