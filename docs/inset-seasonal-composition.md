# Inset seasonal game composition

## User correction
The reference places the entire playable shop, including navigation, inside a substantial illustrated surround. A narrow overlay strip does not reproduce that composition.

## Implementation
- Reserve approximately 10% width on each side (375px viewport: 37.5px per side, 300px playable width).
- Reserve separate artwork areas above the header and below navigation. Both the game padding and external artwork use the same CSS variables.
- Reflow service rows into the remaining height instead of scaling hit targets with a CSS transform. Header, queue, order, equipment, ingredients, delivery and navigation all remain inside the opening.
- Compact-screen breakpoints reduce vertical decoration and row spacing. Safe areas are included in the reserved top/bottom.
- Decorated ingredient pages contain five ingredients plus a 44px page button. The bakery keeps all six cakes in one row; its previous redundant page button is hidden. No recipe, cake or ingredient is removed.
- Custom shop names render on the outer sign. The live cash/day/rating header remains inside the shop.
- Preserve the existing stable bench/image patching and one visible machine per stage.

## Artwork
New asset: assets/bean-around/midautumn-full-frame.png (941 x 1672 RGBA PNG, approximately 1.21 MB).
Generated as a derivative of the user's supplied Mid-Autumn screenshot, with all embedded gameplay/text removed and a transparent center. Visually inspected the generated asset: lanterns, golden flowers, moon, rabbits, mooncakes, wood sign and bottom platform follow the supplied composition. It is artwork, not a screenshot of the running game.
Eight source crops reserve the center for real controls and prevent decoration from covering it. Source image and equipment assets are unchanged.
Summer, autumn, Xmas and Tet retain their existing atlas artwork with the new wider surround layout.

## Verification
- JavaScript parses successfully.
- 1,044 deterministic logic/regression cases pass.
- 13 renderer cases pass using an in-memory DOM test double, including 200 machine transitions, frame lifecycle, custom-name update and stable image identity.
- Repository assets and original code are preserved; no gameplay economy/save schema change.

Browser-console checks for a running decorated shop:
```js
BeanAroundRenderChecks.runBrowser()
BeanAroundRenderChecks.auditLayout()
```
The second check measures the live game bounds and primary 44px targets.

## Validation limitations
No browser execution or screenshot tool was available for the game. iPhone Safari compositing, actual viewport screenshots at 375x812 / 390x844 / 430x932 / 1280x800, and touch behavior have NOT been directly verified. The previous GitHub PNG could not be visually reopened through the available connector; the new reference-derived Mid-Autumn asset was visually inspected directly from image generation. Do not treat test-double results as screenshot proof or claim pixel-perfect reproduction.
