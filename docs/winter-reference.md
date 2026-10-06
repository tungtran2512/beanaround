# Winter reference refinement — 6 October 2026

The supplied winter concept is used as a visual reference. Existing gameplay dimensions and control positions remain authoritative; the concept's numeric row heights are not used to resize the game.

## Changes
- Header: detailed frosted pine needles, red berries, silver bauble, five snowflakes and five warm bulbs over the existing navy header. The live text and settings button are protected by a mask based on actual glyph bounds.
- Waiting queue: snowy pine at outer edges; selected customer navy, with existing urgent warning colors intact.
- Order: pale-blue taped "Warm Cup, Warm Heart" note next to the price. Actual glyph intersection is checked, including title, options, customer and price; long orders suppress the note. No padding or control size changes.
- Machine stage: an original generated winter café illustration, inspired by the reference, with wood shelves, coffee jars, snowy window and warm pendant/lantern. A 780×520 WebP derivative (~109KB) is used at runtime; the original PNG is preserved under sources. This is café artwork, not a photograph or technical equipment reference.
- Edge props: detailed small snowman, two wrapped gifts, snowy pine and pinecone. A lit small tree and café chalkboard appear only for the narrower juicer/blender stages, where space is available; they do not crowd the wide espresso machine.
- Delivery CTA and navigation: icy highlights, snowflakes and pine corner ornaments. Existing dimensions, active areas and disabled-button feedback remain unchanged.
- Machine/cup assets, recipes, inventory, prices, order volumes, save migration and gameplay timing are unchanged. Spring, summer and autumn art/config are unchanged.
- Visual preview only; production is not deployed.

## Assets and implementation
- index.html: winter configuration, paint-only CSS, optional winter prop image, header text mask and safe note placement.
- assets/bean-around/winter-cafe-room.webp: optimized room used by the game.
- assets/bean-around/sources/winter-cafe-2026.png: original generated source, never loaded by gameplay.
- assets/bean-around/season-winter-{header,props,counter,note,pine-corner,cta-right,nav-left,nav-right}.svg and season-winter.svg: original vector decoration.
- tests/season-theme-browser.cjs: real Chromium/WebKit validation and screenshot runner. The original generated source is resized/compressed only in the isolated test environment; no runtime dependency added.

## Verification
1,089 deterministic logic checks passed. The unchanged service renderer, panel patcher, equipment patcher, stock/recipe operations, save migration and online forecast functions were compared to the previous feature-branch version.

Chromium and WebKit both pass at 375×812, 390×844 and 430×932. Fourteen service/header/navigation rectangles match the original baseline (within 0.75 CSS px), main touch targets remain at least 44px, hit-testing succeeds, no horizontal overflow, and no JavaScript/console/asset errors. Machine/cup remain fully opaque with no filter; decoded equipment and background DOM stay mounted through machine switches. Winter notes hide for long orders and use the intended 50×44px decoration box beside the price. Additional tree/chalkboard props are hidden for espresso and visible only for narrower devices.
Actual running-game screenshots were opened and inspected at all three widths, and with espresso, juicer and blender idle/working. A CSS-specificity issue in the first pass was corrected; screenshots now explicitly await image decoding before capture.
No physical-iPhone validation or sustained frame-rate profiling is claimed. This static HTML repository has no configured build/lint/typecheck task; JavaScript parsing, deterministic checks and actual browser tests were used.

Tested code: `2ea0d14bdf2add938558fb4d732acd0a473d2913`.
[Browser CI run](https://github.com/tungtran2512/beanaround/actions/runs/37394481567).

## Actual screenshots
- [Before: previous four-season implementation](screenshots/winter-reference-before.jpg)
- [After: winter at 375, 390 and 430px](screenshots/winter-reference-responsive.jpg)
- [After: machine stages, idle and working](screenshots/winter-reference-machines.jpg)
- [Four seasons after change](screenshots/four-seasons-390.jpg)
- [Chromium report](screenshots/winter-reference-chromium.json)
- [WebKit report](screenshots/winter-reference-webkit.json)

