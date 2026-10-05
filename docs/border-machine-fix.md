# Seasonal borders and single-stage equipment

- Added assets/bean-around/season-borders.png, a 1983×793 transparent atlas with five original image-tool-generated border designs following the user's visible reference motifs: summer tropical flowers/citrus, autumn leaves/lanterns, Christmas pine/bows/lights, Tet peach/apricot blossoms/red lanterns, Mid-Autumn rabbits/mooncakes/lanterns.
- Border renders as eight individually clipped pieces around an empty center. Game padding reserves the same space as the frame, reduces trim width/height on short screens, and the entire decoration layer has pointer-events:none. No changes to package price, duration, calendar or demand effect.
- Corrected atlas rendering: SVG viewBox + outer overflow alone allowed adjacent appliances to appear in wide/tall letterboxed viewports. Every asset now has an explicit inner viewport with the crop's exact aspect ratio before the outer responsive meet/slice fit. Applied to equipment, scenery and border pieces.
- machineForStage reads actual recipe/cup progress and prioritizes an in-flight job. Only one active equipment crop renders: coffee starts espresso; pour-over/cold brew switch after espresso; juice uses press; smoothie uses blender. Water/tea use the existing kettle illustration. Finishing/serving shows a clear workbench instead of idle appliances. Milk steaming can retain the espresso machine. Extra-shot machine action invokes extraShot, not a second ordinary recipe step.
- Ingredient buttons and machine cooking durations, inventory deductions, saves, staff behavior and grade logic unchanged.
- Preparation/shop overview retains one espresso machine crop (not all three appliances).
- Source reference files are untouched; new border artwork is a separate derivative design, not a screenshot background.

## Verification
1,039/1,039 V8 game-logic checks passed with fixed RNG seed 123456789, including 17 new border/stage cases. Tested clipping markup invariants, all five border crops within atlas, independent nine-slice center, package expiry, espresso/pour/cold/juicer/blender/kettle selection, running job priority, no appliance on finishing/serving, extra shot and no state mutation from display selection.
Image-tool output was viewed as an asset. No browser/Safari screenshot runner is available; actual screenshots and the 375×812 / 390×844 / 430×932 / 1280×800 layouts remain unverified. This is a preview change, not a production merge.
