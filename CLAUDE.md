# Steam Art Kit — notes for future sessions

- Owner: Arda. Commits are authored by Arda only: never add Co-Authored-By or session trailers.
- Style: plain HTML/CSS/ES modules, no build step, no runtime dependencies, offline-first PWA, GitHub Pages deploy from `app/`.
- Two languages (English, Turkish) in `app/js/i18n.js`; a unit test enforces key parity. Dark theme is the default.
- Visual language: modelled on the Steam client so the tool feels at home for its audience (navy `#1b2838`, header `#171a21`, accent blue `#66c0f4`, text `#c7d5e0`, green primary button). IBM Plex Sans throughout. Never use Valve's logos or the Steam wordmark.
- Pure modules (`presets.js`, `crop.js`, `zip.js`) are unit-tested with `node --test`; the UI is tested with Playwright (`PW_CHROMIUM_PATH` reuses a preinstalled Chromium).
- Asset sizes live only in `app/js/presets.js`; when Steam changes its specs, change them there and in the README table.
- The tool is independent of Valve and says so in the footer.
