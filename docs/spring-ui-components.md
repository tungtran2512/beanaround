# Spring component artwork — 6 October 2026

The user supplied one combined image. Its row mapping is **header, delivery button, order/price, footer**, not header/order/button/footer. Four independent runtime assets follow that mapping.

| Source row | Runtime file | Design |
| --- | --- | --- |
| 1 | [spring-ui-header.webp](../assets/bean-around/spring-ui-header.webp) | Cream/sky field, cherry blossoms, left lantern, right roof/wood |
| 2 | [spring-ui-deliver.webp](../assets/bean-around/spring-ui-deliver.webp) | Green garden field, blossom endcaps, copper/wood trim |
| 3 | [spring-ui-order.webp](../assets/bean-around/spring-ui-order.webp) | Cream field, blossoms, hanging wooden flower tag on right |
| 4 | [spring-ui-footer.webp](../assets/bean-around/spring-ui-footer.webp) | Walnut grain, two lanterns, blossoms and stones |

## Production assets and integration

The artwork was faithfully redrawn/repacked from the attachment using imagegen, then separated into four 1170px-wide WebP derivatives. This is not claimed to be a byte-for-byte crop of the original attachment. The untouched generated atlas is preserved in `assets/bean-around/sources/spring-ui-atlas-2026.png`; it is not loaded by the game. The runtime images total approximately 271 KiB.

`SeasonTheme.spring.uiArtwork` maps each part. Spring uses a cream header with dark live labels, green CTA and walnut footer, matching this newer reference rather than the older burgundy spring header. The rest of the café scene and gameplay remain unchanged.

Winter's existing rendering helper is generalized to `syncCafeComponentArt()`, `.cafe-component-skin` and `.cafe-skin-slices`. Spring and winter share the same absolute, noninteractive three-slice layers. There are no duplicated gameplay components. Artwork mounts only when a host is replaced, switches through CSS variables and unmounts for themes without component artwork.

Local text backplates protect date/rating/order/price readability without moving text. The previous pink note and small spring corner ornaments are suppressed on these four hosts; controls and live labels remain HTML/SVG.

## Verification

Code/test commit: `79faf749eaed1549082361a17cfb4f2612b3caf9`.
[Successful Chromium/WebKit CI](https://github.com/tungtran2512/beanaround/actions/runs/37400038432).

- JavaScript parses; all 1,089 existing deterministic logic checks pass.
- All four themes pass at 375×812, 390×844 and 430×932.
- 14 tracked rectangles remain unchanged (0.75px tolerance), 44px targets and hit tests pass, no horizontal overflow.
- Zero page/console/asset errors. Preview theme changes preserve serialized state and localStorage.
- Spring and winter mount exactly four component skins; switching to summer removes them.
- An actual recipe completion enables the spring CTA, and a real click records the sale.
- Branch-online UI purchase/advertising checks and machine/background DOM-retention checks pass.
- Generated atlas, four optimized assets, spring component closeups, all three viewport screenshots and Chromium/WebKit ready-to-deliver screenshots were opened and inspected.
- The first visual run exposed a test-harness-only baseline issue: the old comparison HTML has no SeasonTheme constant. The image-readiness helper now explicitly supports that baseline. Runtime code did not require a correction.

Screenshots:
[Four components](screenshots/spring-ui-components-390.jpg) ·
[Three mobile widths](screenshots/spring-ui-responsive.jpg) ·
[Chromium ready](screenshots/spring-ui-ready-chromium.png) ·
[WebKit ready](screenshots/spring-ui-ready-webkit.png).

Structured results: [Chromium](screenshots/spring-ui-chromium.json), [WebKit](screenshots/spring-ui-webkit.json).


## Scope and limits

No recipe, timer, revenue, stock, employee, unlock, save migration or input action was changed. Core service/machine patchers remain identical. Main/production was not updated. No physical iPhone or sustained FPS profiling was performed. Existing action/Node deprecation warnings are CI tooling warnings, not game console errors.
