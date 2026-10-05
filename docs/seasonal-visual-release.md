# Seasonal visual release

## Scope
Requested: 90% playable width, a softer counter background, complete seasonal artwork, preserved branch branding, and publication to the main game.

## Changes
- The decorated shop occupies 90% of the width, with 5% side bands. Top/bottom bands remain separately sized for sign and seasonal decoration.
- Full-resolution transparent frames now exist for summer, autumn, Christmas, Tet/spring and Mid-Autumn.
- Source frames are separate PNG files. Only the active theme is mounted, with eight crops sharing one cached image request. Original references and previous assets are retained.
- Warm cream surfaces, lighter wood dividers and subtle shadows join the working shop to the frame.
- The counter scenery alone gets a 0.55px blur and 22% warm-white veil. Machines and cups keep their original sharp artwork; stage changes still preserve the decoded image and backdrop.
- Branch accent, dark and soft colors are derived from the branch's saved brand.accent. Seasonal packages never overwrite it.
- Each shop buys and expires its package independently. Terms remain 30,000k / 30 game days / +50% demand subject to capacity.
- Read-only seasonal previews remain available; they pause the game and do not write saves.

## New assets
- assets/bean-around/summer-full-frame.png — tropical foliage, hibiscus, citrus, cafe cat.
- assets/bean-around/autumn-full-frame.png — amber leaves, lanterns, books, pumpkin.
- assets/bean-around/xmas-full-frame.png — evergreen, snowman, gifts, tree.
- assets/bean-around/tet-full-frame.png — mai/peach blossoms, lanterns, banh chung, kumquat.
Each is 941 x 1672 with transparency, generated as an adaptation of the approved frame family and visually inspected. Existing midautumn-full-frame.png remains in use.
These are artwork assets, not screenshots of the running game.

## Verification
- JavaScript compilation passed.
- 1,057 deterministic logic/regression checks passed.
- 13 DOM renderer checks passed in a test double, including 200 equipment transitions and frame lifecycle.
- New checks cover all five frame sources, source aperture, branch color independence, separate purchase charges and save/reload of package expiry.
- Existing source PNGs, README and unrelated Index.html were preserved.
- No economy or save-schema changes in this visual finishing step.

## Limits
No real browser or iPhone screenshot execution was available. CSS visual composition, Safari blur/compositing and physical touch targets have not been directly measured after this finishing step. Generated artwork was viewed; test-double rendering is not a substitute for game screenshots.

## Release
The user explicitly requested applying this release to the main game. Publish through Git history without force-pushing or deleting existing files.
