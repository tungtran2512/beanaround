# Decoration activation and preparation-screen fix

## Findings
The prior preview link opened the ordinary saved game. A new/unowned or expired shop correctly resolved to "everyday", so no inset or frame was applied. This is verified from the rendering condition, not from a claim to have inspected the user's private save.
The pre-opening Quán tab also still used renderStationV112 rather than the compact eight-panel service renderer.
Legacy active holiday.kind="festival" purchases were not mapped to any seasonal artwork.

## Changes
- The Quán tab now uses the modern eight-panel layout in preparation, service and report. Preparation shows MỞ CỬA; report shows TỔNG KẾT. Brewing remains blocked outside service.
- Active legacy festival purchases receive artwork based on their purchase month without a second fee, a longer term, or extra demand.
- Added ?decor-preview=midautumn (and summer/autumn/xmas/tet) for a read-only view of the real shop renderer, using a transient clone of the user's current state.
- Added Xem thử trên quầy to each seasonal package, available even outside its purchase month.
- Preview chooses visual assets only. It cannot purchase a package, grant the 50% demand bonus, advance the game clock or write saves.
- The visible XEM THỬ banner includes Thoát. Exit restores the original root state and navigation, removes the preview query, and resumes the normal game.
- The screen-wide taste-timing capture is disabled during preview so it cannot intercept Thoát.
- Real purchases retain their 30,000k fee, month restrictions, per-shop ownership and 30-day duration.

## Validation
- Full JavaScript parses.
- 1,051 deterministic logic checks pass.
- Existing 13 rendering checks pass in the DOM test double.
- Eight additional runtime checks using actual renderer/preview/timer/save functions pass: preparation layout, report layout, original-state isolation, frame activation without purchase, no extra queue generation, paused time/save taste capture disabled, and original-state restoration on exit.
- Read-only preview uses real data; no fabricated customers, reviews or revenue.
- Browser/iPhone execution, pixel screenshots, Safari compositing and measured touch layout remain unverified in this tool environment.

Preview entry:
?decor-preview=midautumn
Ordinary gameplay remains at the root URL and requires an active purchased package for seasonal decoration.
