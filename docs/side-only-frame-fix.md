# Side-only decoration and scrolling navigation

- Keep the playable width at 90%, with 5% seasonal decoration on each side.
- Remove top and bottom decoration reservations, hidden outer sign and bottom artwork. Side strips use the full source image height instead of stretching only its middle.
- Restore the shop name to the normal header. Preserve iPhone safe-area padding in the header and bottom navigation.
- Make management and upgrade navigation scroll in normal document flow (position: static), rather than remaining over the content.
- Place read-only preview controls within the header flow so they cannot cover bottom navigation now that the lower decoration band is gone. The extra row exists only in preview.
- No recipe, economy, save or package-duration changes.

Validation: JavaScript parses; 1,057 existing logic checks and 13 DOM renderer checks pass. Preview notice mount/removal checked with a DOM test double. No actual browser/Safari scroll or screenshot verification was available.
