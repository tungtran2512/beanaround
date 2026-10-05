# Vector equipment and online seasonal multiplier

Date: 2026-10-05
Base / rollback: dfe1ee3472e1ca21b263723e4a6c8723dc3dfd41

## Changes
- Removed seasonal border, header scenery, counter scenery, image previews and the side inset from the live UI.
- Kept original source PNGs archived and untouched. No runtime asset map requests them.
- Added assets/bean-around/equipment-vector.svg: original vector drawing of three-group ivory/brass espresso machine, black slow juicer and silver blender. Transparent background, no embedded photo, no remote resources; 53,879 bytes.
- Equipment remains in the existing clipped atlas renderer. Machine switching retains the image node and only changes its viewport; no new timer, recipe or animation.
- Removed obsolete decor-preview entry behavior, so existing bookmarked preview URLs start the normal game.
- Seasonal packages retain IDs, 30,000k price, month gates, separate shop ownership and 30 game-day validity. Existing purchases automatically use the new benefit for their remaining days without repayment.
- Benefit is now x2 online parcels, after base demand, championship multiplier, daily variation and rounding; explicit player admission limit applies last. Walk-in demand gets no package multiplier.
- Online capacity scales correspondingly: 500 -> 1,000, or championship 850 -> 1,700. These are parcel counts, not cups. Group orders retain their existing composition.
- In-progress accepted quotas are preserved. New forecasting applies when opening the next shift; no retroactive doubling of existing tickets.
- Save validation now permits up to 2,000 accepted online parcels / delivery tickets and admission limits. The save version and key remain unchanged; no destructive migration.
- Procurement includes expanded online demand and cold-brew inputs. Seasonal stock / cake pack limits support the larger forecasts.
- No money is awarded directly by the package. Orders consume stock and earn normal real receipt revenue.

## Validation actually performed
- JavaScript syntax compilation passed.
- 1,068 deterministic game logic checks passed, including 11 new multiplier/expiry/branch/save/procurement/end-to-end checks.
- Completed an isolated 1,700-parcel shift with actual ingredient consumption and online commission; migrated the save while more than 1,000 parcels were issued and again after closing.
- Verified explicit limit 1,500 survives reload; disabling online still yields zero; package expiry does not erase accepted orders.
- SVG structure checked for balanced tags, unique IDs, valid internal gradient references, no bitmaps or external resources.
- Existing machine-stage logic checks passed. Browser-oriented DOM retention checks remain available through BeanAroundRenderChecks.runBrowser().
- No browser, screenshot renderer, filesystem shell, npm config or iPhone device was available in this session. No screenshots or visual Safari/viewport confirmation are claimed. SVG appearance and touch geometry still require an actual browser review.

## Files
- index.html
- assets/bean-around/equipment-vector.svg
- docs/vector-equipment-online-packages.md
