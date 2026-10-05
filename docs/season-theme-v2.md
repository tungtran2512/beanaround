# Bean Around — Seasonal Visual System V2 & branch online launch

Implemented on `feat/cozy-season-themes`; production is not changed.

## Branch online launch
- Quầy online chuyên nghiệp (6,500k) available before the first branch shift (previously after eight).
- New branch-only Khai trương online / đào tạo tại chỗ (8,500k): requires the online station and an active online employee; includes completed packing induction. It increases the reachable local online audience, not cash or guaranteed sales.
- Nhận diện tại địa điểm (6,000k) after one completed shift. Existing expanded counter (4,500k) after three.
- Hire online, helper2, helper3, barista2, cashier2: 2,800k. Enroll delivery, speedBrew, packingLine, dispatchLead: 7,100k.
- Total early investment: 35,400k, excluding stock, wages and daily advertising (1,000k). Existing barista and manager are included in the branch opening setup.
- Complete paid training during actual worked shifts: delivery needs three; other courses two. Existing save ownership is preserved. No automatic purchase or free employee.
- At the fifth shift, baseline fixture (4★, 4.5 skill, menu at normal prices) forecasts ~284 orders, before seasonal/contest bonuses. With 350 team capacity, daily market variation gives roughly 252–315. Good service may increase demand; poor service, missing staff, no advertising or order limits reduce it.
- Branch online launch removes the additional penalty for unrelated bakery/decor development. The branch still retains the 90% sales scaling, own demand and capacity.
- Branch online UI now offers its own 6,500k station, instead of displaying the main-shop tablet requirements. Both advertising entry points debit the same branch wallet and set its own campaign flag once per day.
- Main-shop economics and branch opening costs/requirements are unchanged. No save schema bump; the existing upgrade map stores the new owned flag.

## Shared renderer, distinct art
`SeasonTheme` holds four configurations. One scene renderer uses four original vector café environments, four prop layers, four header edge illustrations, four micro ornaments, and four paper notes. No duplicate gameplay screens, external image links, fonts or libraries.
- Spring: cherry branches, garden arch, ceramic blossom vessels, pale-pink note, burgundy.
- Summer: monstera/palm, sunlit conservatory window, citrus jar, yellow note, deep-green header/CTA/nav. No flowers or beach.
- Autumn: maple, timber shelves and coffee jars, chalkboard, two small pumpkins, dried wheat, kraft note, amber/burgundy.
- Winter: evening snowy window behind the machine, small pine arrangement, two gifts, five header snowflakes and five warm lights, ice-white note, navy header/CTA/nav.
- All new decorative assets are original SVG. Existing source photos and equipment-vector atlas are preserved.
- Background and lighting are subdued; machine and cup remain sharp, opaque and above the decor. Only tiny edge/background particles animate via CSS; reduced-motion disables them.
- Header ornaments use a text-safe mask derived from actual HUD bounding boxes and updated by ResizeObserver; overlapping protected areas are unioned. Notes adapt to the existing short order card (46×32 maximum); they sit below the price and hide automatically when actual option/customer text needs that space. This deliberately prioritizes readable live orders over the spec's conflicting top-right note position.
- No changes to eight service rows, navigation height, controls, machine/cup sizes, recipes, stock use, timers or save writes from theme selection.
- `?season-theme=spring|summer|autumn|winter|off` is a visual review override only.

## Files
- `index.html`: shared theme/config/rendering/CSS, order-note protection, branch launch progression and tests.
- `assets/bean-around/{spring,summer,autumn,winter}-cafe-room.svg`: distinct interiors.
- `assets/bean-around/season-*-props.svg`, `season-*-header.svg`, `season-*-note.svg`, `season-*.svg`: original decorative layers.
- `tests/season-theme-browser.cjs`: actual Chromium/WebKit visual and interaction regression checks.
- `docs/screenshots/`: actual running-game screenshots, updated after review.

## Validation
Local deterministic JavaScript harness: 1,089 checks passed, including ten new branch launch cases.
Browser results: Chromium and WebKit pass at 375×812, 390×844 and 430×932. Tests compare fourteen gameplay rectangles with the unchanged main baseline; confirm 44px main targets, touch hit-testing, zero horizontal overflow, zero JavaScript/console/asset errors, sharp machine/cup, retained background/equipment DOM during machine swaps, safe note suppression and theme selection without state/save changes.
Actual UI clicks tested branch online-station purchase and own-wallet advertising, in both engines.
Inspected actual 390px four-season screenshots, 375/430 responsive samples, and espresso/juicer/blender in idle and working states.
No physical iPhone test or long-running FPS/memory profiling. Static HTML project has no configured build, lint or typecheck script; JavaScript parsing, deterministic logic checks and browser tests are used instead.
No production deployment.

## Screenshots and reproducible tests
- [Four seasons at 390px](screenshots/four-seasons-390.jpg)
- [Responsive views](screenshots/season-responsive.jpg)
- [Equipment idle/working](screenshots/equipment-stages.jpg)
- [Chromium results](screenshots/chromium-results.json)
- [WebKit results](screenshots/webkit-results.json)
- [Branch launch checkpoints](branch-launch-checkpoints.json)

The checkpoint file is a controlled forecast test using real purchase/training functions. It supplies worked/paid-shift attendance to advance training; cash values exclude simulated stock purchases and operating expenses. It is not a full profit simulation or a sales guarantee.


Final tested code: `a02f130d6bac7d9f5caef233f5002f3221e98e1d`. [Chromium/WebKit CI run](https://github.com/tungtran2512/beanaround/actions/runs/37349952222).
