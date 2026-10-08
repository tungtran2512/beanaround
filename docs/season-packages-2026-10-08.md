# Six seasonal packages — 2026-10-08

## Gameplay

Six two-month sale windows: Tet Jan–Feb, spring Mar–Apr, summer May–Jun, autumn Jul–Aug, winter Sep–Oct, Christmas Nov–Dec. Each shop pays 30,000k for 60 inclusive game days from purchase. The package multiplies online parcel demand by 3 after other bonuses, before the owner's admission cap. Rating calculations and accepted shift quotas are unchanged. Active legacy 30-day purchases extend once to 60 total days without a second charge; expired purchases remain expired.

## Artwork

The user explicitly authorized recreating artwork from their chat reference images and uploading it to this repository. The spring and winter atlas is AI-assisted artwork derived from those references, not the original attachment bytes. Source: assets/bean-around/sources/spring-winter-lake-2026.png. The rejected earlier compressed atlas is not included.

Each column has four panels in order: header, order/price, delivery CTA, navigation footer; the fifth panel is the matching machine-stage background. tests/season-theme-browser.cjs records measured crop coordinates and generates individual WebP derivatives without stretching. Runtime uses only the selected theme's small WebPs. The source atlas is archived and never loaded by gameplay.

SeasonTheme shares one gameplay renderer across tet, spring, summer, autumn, winter and xmas. Tet and Xmas preserve their existing red artwork. Spring uses the green lakeside garden; winter uses the snowy blue lakeside cafe. All component banners use cover cropping, including the delivery CTA. Stage backgrounds use cover rather than fill; only the new background images receive 0.65px blur and 0.84 opacity. Machines, cup and interactive controls remain outside the decorative layer, sharp and opaque. Layout geometry is unchanged.

## Verification

Run the Chromium/WebKit visual workflow. It checks six themes at 375×812, 390×844 and 430×932, source decoding, layout, touch interception, machine sharpness, idle/active device stages, save migration, bonus stacking and four-minute simulated fulfillment. Physical-device performance is not measured by CI.
