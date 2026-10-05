# Stable seasonal border and brewing rendering

Fixes the preview regression after seasonal packages and stage-specific equipment were introduced.

## Changes
- Mount the eight-piece seasonal frame on document.body, outside the clipped service grid. The frame is fixed to the game width, ignores pointer events, and uses HTML image crops from the existing atlas.
- Repair a missing frame on repaint; hide it when the package expires. Keep the image nodes when the shop/theme is unchanged.
- Patch the existing brewing bench instead of replacing its outerHTML on every cup/stage change.
- Preserve the scene and decoded equipment image across espresso, juice, blender, kettle and finishing stages. Change only the crop viewport, visible equipment, labels, buttons and cup.
- Keep a single visible device and disable transition/animation on the bench/equipment containers.

No change to recipes, stock, timers, fees, package terms or save schema. Existing source and derivative assets are unchanged.

## Validation performed
- JavaScript compilation: passed.
- Existing deterministic game regression checks: 1,039 passed, 0 failed.
- 12 renderer regression checks: passed in an in-memory DOM test double, including 200 automatic stage transitions, stable image identity, single visible device, frame repair and expiry.
- Browser-compatible checks are included as:
  window.BeanAroundRenderChecks.runBrowser()
  They create isolated fixtures and do not modify the current game or saved progress.

## Limits
No real browser, Safari device, screenshot capture, image-decoding timing, compositing or touch validation was available in this environment. The DOM checks establish node lifetime and state transitions, not visual proof that Safari no longer flashes. Verify the running preview with an active seasonal package and automatic service on iPhone.
