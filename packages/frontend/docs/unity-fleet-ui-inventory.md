# Unity Fleet template videos — fundamental UI components

Extracted from the 26 MP4s in `~/Library/Mobile Documents/com~apple~CloudDocs/iCloud Shared Downloads/Downloads 2/Unity MP4 website design templates/`.
Contact sheets: `/private/var/folders/2s/8m95yn2114v2gjmd121jhbrw0000gn/T/opencode/sheets/`.
These are animated **design templates**, not screenshots of finished code — treat as design-pattern extraction.

## A. Page-level patterns

| # | Component | Seen in |
|---|---|---|
| A1 | Fullscreen video / 3D hero (ambient video behind headline) | Unity Fleet templates 2, 15D, BOCCA, Unique, Spline |
| A2 | Animated wordmark preloader → landing (blurred letters sharpening) | BOCCA, Unique (small C logo reveal), vehicle-62 |
| A3 | Repeated-text wordmark marquee (outline/fill animation) | 15D |
| A4 | Centered eyebrow + display heading + pill CTA hero ("INTERACTIVE 3D CAR TUTORIAL" / WATCH) | Spline, All-New Taycan |
| A5 | Minimal nav: wordmark left, inline links + dark pill button right, or single hamburger | Unity Fleet templates 1, 5, 9 |
| A6 | Dark rounded CTA panel embedded in page ("Drive with Unique Today" + subscribe/CTA) | Unique |
| A7 | Corner CTA banner on hero ("PREORDER NOW") | 3E6 |
| A8 | Feature-card grid: icon chip + short title ("Key Features" 4-up) | Unique |
| A9 | Sequential stat callout cluster over video (icon + headline + subtext, fading in) | 3E6 |
| A10 | Category filter chips above a grid (Premium/Coupe/Hypercars/…) | Unique |
| A11 | Rounded media card grid / masonry gallery (vehicle fleet) | Unique |
| A12 | Footer: link columns + "Subscribe to News" input + legal links | Unique |
| A13 | Ambient in-place display greeting ("Hello Joe." over room video) | Fleet 23 |
| A14 | Giant numeral brand splash ("9" + product photo) | Saab fake phone |
| A15 | Spline-style interactive 3D viewer with rotation, ground shadow, headlights | Fleet 24, 98f series |

## B. Composite widgets

| # | Component | Seen in |
|---|---|---|
| B1 | Status bar (battery %, 5G, clock, weather) | Many HMI |
| B2 | Gear selector P N D R (letters, active circled/colored) | E49, Unity Fleet 6, 22 |
| B3 | Giant numeric readout (speed, km/h) always paired with tiny unit label | Almost all HMI |
| B4 | Contextual status pill with icon ("Coming home.", "TAKE CONTROL", "Parking 560 ft") | 1EF, E49, CD2 |
| B5 | Screen-edge pill widget (speed-limit sign on map corner) | D5B, 233 |
| B6 | POI bubble over map (icon avatar, star rating, name, distance) | 233 |
| B7 | Route overlay on video/3D (green lane lines, polyline trace, "500m办理" turn marker) | A77, BEB, Fleet 25/26 |
| B8 | Turn-by-turn lane card ("Keep left at the fork to continue", ETA 11:20) | Fleet 25 |
| B9 | Music/media card (cover, artist, transport controls) | D5B, Fleet 25/26 |
| B10 | Playback/ETA progress bar ("18 m —— 9 sec" with scrubber) | Fleet 26 |
| B11 | Notification card stack (icon, title, subtitle, "2 MILES AWAY") | Fleet 25 |
| B12 | Voice assistant orb (AVAILABLE/ACTIVE glowing ring) + waveform line | Fleet 25 |
| B13 | On-screen keyboard (qwerty, dark, with suggestions row) | Fleet 25 |
| B14 | Bottom icon dock (climate 20.5°, fan, wipers, locks, AUTO) | D5B, 418 |
| B15 | Climate slider pill (22° ◇ ramp ◇ 20.5°) | A77, F0F |
| B16 | Weather card (icon + "+15°" + "Rain is expected") | Fleet 26 |
| B17 | App icon dock for ambient display (FaceTime/TV/AppStore + date badge "MON 31") | Fleet 23 |
| B18 | Circular gauge (0–7 dial, red active state, odometer) | 3FB |
| B19 | Vertical side progress bar (322 km) | 1EF |
| B20 | Steppable configurator: video/3D left + white panel right (step heading, swatch row with select ring, next pill, bottom progress "01 …") | 4B8, mobile "Rim colour" (BEB) |
| B21 | Slide-to-confirm pill (arrow circle over "Slide" / orange pill swap) | Saab fake phone |
| B22 | Specs label/value grid + product image | 3E6 |
| B23 | Image carousel (arrows + dots) | 3E6 |
| B24 | Gallery UI with minimal underlined word nav (Sea/Forest/Landscape), close + "1/5" counter, image stack with file meta (423 kb / 750×1100 / sRGB) | Fleet 27 |
| B25 | Gallery file-stack cards (rotated doc-style placeholders with meta) | Fleet 27 |
| B26 | Mobile-first phone frame mockups as hero (device in 3D scene) | Saab, BEB |
| B27 | Dark split media+settings panel over full-bleed image (Austria/Iceland cards) | A77, F0F |

## C. Token-level styling (recurring)

- **Dark HMI palette**: near-black ground (#05070A), monochrome gray text scale, single accent (green #34D88B, or blue, or red for warnings); light HMI mirrors it on white.
- **Type**: geometric grotesk; giant numerals for speed; letter-spaced ALL-CAPS micro-labels ("2 MILES AWAY", "START EXPERIENCE", "UI CONCEPT").
- **Pills everywhere**: every CTA / status / toggle is a rounded-full pill; outline variant for secondary, filled for primary.
- **Underlined text links** for minimal galleries (not colorful buttons).
- **Soft depth**: large blur on foreground, 20–40px rounded corners on panels, glass blur over video backgrounds.
- **Ultra-minimal frames**: no boxes around data — numbers sit directly on background or video.

## D. Video → template mapping (for asset reference)

| Sheet | Content |
|---|---|
| large 2 | Apple M2 logo anim (brand, no UI) |
| 087 | 3D city + concept car b-roll |
| 15D | Wordmark marquee film menu |
| 1EF | Vehicle status dashboard |
| 233 | AR city nav, POI bubbles |
| 3E6 | Rivian-style scroll marketing page |
| 3FB | Circular speed gauge |
| 418 | In-car split media+settings |
| 4B8 | 3D configurator, side panel |
| 626 | Unique white rental landing (multi-section) |
| 653 | Green cluster wheel display |
| 98F | Taillight close-ups (b-roll) |
| A70 | BOCCA hero reveal |
| A77 | Iceland floating route card |
| B90 | SAAB slide-to-confirm |
| BEB | Rim colour mobile configurator |
| CD2 | Night-city cluster overlay |
| D5B | White docked HMI (media + nav + dock) |
| E49 | Dark cluster, take control |
| F0F | Austria floating card |
| Unity Fleet 6-fleet27 | white cluster, smart-home greeting, Spline viewer, voice HMI, night nav HMI, gallery UI |
