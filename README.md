# Egypt Quest

A map adventure across Egypt — every place on the map opens a different mini-game.
Runs as a **web app (PWA)** and as an **Android app** (Capacitor), from the same code in `www/`.

## Project layout

```
www/                         ← the whole web app (also Capacitor's webDir)
  index.html                 ← entry point (script order matters, see below)
  css/style.css
  js/
    config.js                ← VERSION, place order, ADS settings  ← edit here
    map.js                   ← the Egypt map: outline, Nile, labels, markers, golden scarabs, gestures
    map-art.js               ← illustrated map BACKGROUND (code-painted terrain, seas, relief) — no text/markers
    world.js                 ← hidden-object world engine (used by Giza)
    ads.js                   ← ad layer: AdMob (Android) / H5 Games Ads (web) / test mock
    app.js                   ← Android back button, splash, service worker, external links
    main.js                  ← boot + render loop (loaded last)
    core/
      registry.js            ← definePlace() / defineBonus() → builds SITES, WORLDS, GAMES…
      progression.js         ← Ankh tokens, level/place unlock rules, trials, save migration (pure, unit-tested)
      state.js  i18n.js  canvas.js  audio.js  save.js  fx.js
      progress.js            ← levels, stars, intro, win/result dialog
      retention.js           ← daily login, quests, chest, achievements, reminders
      shop.js  bonus.js  ui.js  input.js  scenes.js
      qgen.js                ← live question generator (Wikidata + Open Trivia DB) + quiz renderer
  games/                     ← ONE FILE PER PLACE (map pin + info + game)
    grand-egyptian-museum.js  giza-pyramids.js  alexandria-qaitbay.js  luxor-karnak.js
    aswan-philae.js  abu-simbel.js  siwa-oasis.js  edfu-temple.js  saint-catherine-sinai.js
    red-sea-hurghada.js  abydos.js  white-desert.js  wadi-al-hitan.js  marsa-matruh.js
    kharga-oasis.js  el-gouna.js
    bonus/  scarab-rush.js  pharaoh-quiz.js  treasure-catch.js
  assets/images/  assets/icons/
  manifest.webmanifest  sw.js
android/                     ← generated Capacitor Android project (committed)
resources/                   ← source art for Android icons/splash
capacitor.config.json  package.json
```

All scripts are plain `<script>` tags sharing one global scope (no bundler).
Order in `index.html`: `config → core → map/world → ads/app → games → bonus → main`.

### Adding a new place

1. Create `www/games/my-place.js`:
   ```js
   definePlace({
     id:"myplace", lon:31.2, lat:30.0,
     en:"My Place", ar:"…", eraEn:"…", eraAr:"…", dEn:"…", dAr:"…",
     logo:"assets/images/myplace.jpg",        // optional, else icon(ctx) is drawn
     challenge:["My challenge","…"], par:45, starTip:["…","…"],
     levels:(x,k)=>L2((5+x)+" items",(5+x)+" عناصر"),  // text in the level list
     fact:["…","…"],
     icon(ctx){ /* draw a ~20px glyph centred on 0,0 */ },
     game:(()=>({ help:{en:"…",ar:"…"}, start(){}, status(){return""}, draw(t){}, tap(x,y){ /* winGame(1..3) */ } }))()
   });
   ```
2. Add `<script src="games/my-place.js"></script>` in `index.html`.
3. Add `"myplace"` to `SITE_ORDER` in `js/config.js` (position = unlock order).
   Optional: `unlock:{levels:2,stars:4}` in `definePlace` changes what the previous place needs to open this one.

Use `later(fn, ms)` instead of `setTimeout` inside games — it is cancelled automatically when the run ends.

## The map scene (v4.2)

The map is drawn in two layers every frame:

| Layer | File | What it contains |
|---|---|---|
| Background | `www/js/map-art.js` (`MapArt`) | seas with depth and reef shelves, neighbouring lands fading into the navy theme, sand texture, shaded relief (Red Sea Hills, Sinai, Gilf Kebir, dunes, oasis depressions, the Nile valley), oases, the Nile, Delta, Lake Nasser, Suez Canal, gold coastline & graticule, night-time city lights |
| Interactive | `www/js/map.js` | labels (EN/AR), markers & destination images, stars, daily badge, golden/cursed scarab, boats, camels, compass, all gestures and hit-testing |

- The background is **painted by code in longitude/latitude** with the same projection as `mp()` — it never contains text, markers, icons or UI.
- It is cached at device resolution: moved/scaled during a pinch or drag, re-painted crisp ~140 ms after the gesture ends.
- The relief is computed once (in ≤12 ms slices, so the game never freezes) and cached on the device in IndexedDB.
- Palettes per map theme (Classic / Sunset / Night) are at the top of `map-art.js` (`PAL`).
- Export a clean artwork image (no UI), e.g. for store screenshots, from the browser console:
  `MapArt.renderImage(2560,1707).toBlob(b=>open(URL.createObjectURL(b)))`

Backup of the previous map: `backup/map-v4.1/` (also git tag `map-v4.1-backup`).

## Run locally

```bash
npm start            # serves www/ on http://localhost:8080
```
Deep links: `index.html?game=giza`, `index.html?bonus=quiz` (locked places only get selected).

## Ads

Configured in `www/js/config.js → ADS`. Placement rules (policy-friendly):

| Type | Where | Rule |
|---|---|---|
| Banner | Map screen only | hidden during any game |
| Interstitial | When leaving a result dialog | every 3 finishes, ≥120 s apart, none in first 180 s |
| Rewarded | "Double points" on result, "+3 hints" when out / in shop, "Open chest now" | always opt-in |

Timers are compensated during rewarded ads, audio pauses during ads.

**Android (AdMob)** — `@capacitor-community/admob`
1. Create the app + 3 ad units (banner, interstitial, rewarded) in AdMob.
2. Put the ids in `ADS.native` and the **app id** in `android/app/src/main/AndroidManifest.xml` (`com.google.android.gms.ads.APPLICATION_ID` — currently Google's test id).
3. Set `ADS.test=false` for release. Consent (UMP/GDPR) is requested automatically on start; create the consent message in AdMob → Privacy & messaging.
4. Add `app-ads.txt` to your website.

**Web (Google H5 Games Ads / AdSense)**
1. Apply for AdSense with H5 games ads; set `ADS.web.client = "ca-pub-…"` (and optionally `bannerSlot`).
2. With `test:true` the H5 test mode is used. With no `client` set, **no ads and no ad rewards** are offered on the web.
3. Layout testing only: open `http://localhost:8080/index.html?devads=1` (needs `test:true`) to see clearly-labelled *DEV placeholder* ads. They never appear on a real domain, in a release build (`test:false`) or in the Android app.

If you target kids, set `ADS.childDirected=true` (Google Families policy).

## Web deploy

Upload the `www/` folder to any static host over HTTPS (Netlify, Vercel, Firebase Hosting, GitHub Pages via Actions).
The service worker makes it installable and playable offline. Bump `CACHE` in `www/sw.js` on each release.

## Android build

Requires Android Studio (JDK 21, SDK 36).
```bash
npm install
npm run android:sync     # copies www/ into the app and updates plugins
npm run android:open     # open in Android Studio → Run / Build → Generate Signed Bundle
```
App id: `com.amsolutions.egyptquest` (change in `capacitor.config.json` before the first Play upload).
Regenerate icons after editing `resources/`: `npx @capacitor/assets generate --android --assetPath resources`.

## Tests

```bash
npm test             # unit tests of the progression rules (Node's built-in runner, no dependencies)
npm run test:e2e     # browser tests of the progression flows (needs: pip install playwright && playwright install chromium)
python3 tests/e2e/phase1_e2e.py   # saves, missed days, ads, achievements
python3 tests/e2e/visual_e2e.py   # fonts, icons, overflow, reduced motion
```

## Changelog — v5.1 (bug fixes + missing features)

**Bug fixes**
- A result dialog could pop up over the next screen if you left a level within ~2 s of winning (the timer was not run-scoped). Fixed.
- On short phones the win dialog could not scroll, so its last buttons could be cut off. Fixed (and the light rays no longer overflow the dialog).
- Siwa Oasis: following hints on a 5×5 board could run out of moves. A hint plan now always fits in the move limit (extra moves are added only when a hint is used; more than one hint still caps the result at ★★).
- Siwa's Hint button said "(ad)" even when no ads are available. It now shows 0.

**Missing features (from the engagement plan)**
- The currency is now called **Coins** everywhere in the interface (saves are unchanged: same balance, same prices).
- **New daily missions**: *Collect 50 coins*, *Play for 10 minutes* (counted only while a game is on screen, shown in minutes) and *Earn 40+ coins in one level*.
- **Records** (`core/records.js`, saved as `runs` and `bt`): the 10 best runs by coins and the fastest win for every level. Level rows show your best time, the win dialog says when you set a new fastest time, and Progress lists *Best runs · on this device* (never presented as a global ranking).
- **Charms** (Shop → Charms): frame colours for the place markers on the map — Gold (free), Lapis 150, Faience 250, Carnelian 300, Amethyst 400 coins. Buy once, switch any time.
- Backup codes now include records, charms and the equipped frame. Reset clears records and charms, and keeps settings.

## Changelog — v5.0 (redesign phase 5: settings & progress)

- **Settings** (gear in the map HUD, `js/core/settings.js`): Sound, Vibration (buzz when you lose a heart), Reduce motion (stops dialog animations, confetti, the map reveal and the reward count-up; the system setting is still respected), Language, Map style (Auto / Sunny / Sunset / Night, plus device location), Backup / restore and Reset (two taps). Sound and language left the map HUD; in games the sound button is still one tap away.
- Settings are saved: `vibOn`, `motionOff` and now also the **language** (it used to reset to English on every start). Older saves get the defaults.
- **Progress** replaces *Book* on the side rail: *Your journey* with stats, **personal bests** from data the game already keeps (best place, ★★★ levels, highest Endless level — labelled "on this device", not a global ranking), badge gallery and place facts.
- Reset is one shared function (`resetProgress()` in `core/ui.js`) used by Progress and Settings; it keeps your settings.

## Changelog — v4.9 (redesign phase 4: menus)

- Every menu now has a header with a back button and its own colour tint, so they no longer all look the same.
- **Shop**: tabs *Boosts* / *Map styles*, 2-column cards with an icon, "you have N", description and a gold price button (greyed when you can't afford it, *Owned* badge for one-time items). Map styles show colour swatches for Auto / Classic / Sunset / Night plus the location button.
- **Daily reward**: 7-day calendar that fits every phone (past days ✓, today gold, day 7 chest), a *Today* reward card, gold Claim.
- **Daily quests**: streak card (with freezes and the "breaks never cost points" note), mission cards with progress bars and a gold *Claim* button when done, the all-3 bonus card with progress, time until new quests.
- **Collection**: stats (sites, stars, badges, balance), a badge gallery (gold medallions when earned, dimmed with a lock otherwise), place cards with their illustration, star bar and fact; backup and reset side by side.
- **Bonus games**: cards with an icon and a play button.
- Same buttons, prices, rewards and logic as before.

## Changelog — v4.8 (redesign phase 3: play & results)

- **Level intro**: place illustration, game type, how to play, three rule tiles (hearts · ★★★ rule · time par), Cancel + gold Start side by side. Bonus games and Scribe's Trials get their own icon and label.
- **In-game HUD**: back button with arrow, rounder buttons, clearer status pill (no letter spacing).
- **Win dialog**: three big stars that pop in one by one (earned ones gold), light rays behind, reward tiles for points (counts up) and Ankh, one row per detail (time & speed, multipliers, daily bonus, perfect hint, Ankh tip, lost heart), a note for the next place, and **exactly one gold primary button** (Next level / Unlock & play, or *New place unlocked* when a place opened). Retry and Map sit side by side; the optional ad is last.
- **Lose dialog**: broken-heart art, reason and tip rows, *Try again* as the primary button, Scribe's Trial when offered.
- Bonus wins show a trophy. Animations stop with *reduce motion*. Same buttons and logic as before.

## Changelog — v4.7 (redesign phase 2: map & places)

- **16 place illustrations** (`assets/places/<id>.svg`, 2–6 KB each, drawn in code, offline): shown as a banner on the place card and as the header of the level select. `placeArt(id)` in `core/state.js` returns the path.
- **Map HUD**: new Ankh counter next to coins; the hint bar shows the how-to tip only on the first visits, then the next place with a progress bar; the Quests button shows a red badge when a mission can be claimed; side buttons moved down so they never cover the hint.
- **Place card**: illustration banner, chips (game type, stars, levels done), the button now reads *Play*.
- **Level select** redesigned as a sheet: place art header with back button and Ankh balance, star progress bar, level cards (done ✓ · next level highlighted in gold · unlock with Ankh · locked) with stars on the right, curse mode as a switch, Endless below. All buttons, rules and trials work exactly as before.

## Changelog — v4.6 (visual foundation — redesign phase 1)

- **Lapis & Gold design system** (`css/style.css`, last block): colour tokens with one meaning each (gold = coins & main actions, faience = Ankh & success, carnelian = hearts, nile = info), 16/24 px radii, raised gold primary buttons (≥48 px), unified dialogs and list rows with a short open animation, solid panels instead of costly background blur.
- **Fonts bundled for offline use**: Cairo (body) and El Messiri (titles), Latin + Arabic subsets (`assets/fonts`, SIL OFL), precached by the service worker.
- **Icons**: 22 new line icons (`assets/icons/ui-*.svg`). Emoji in menus and dialogs are turned into the matching icon (hint, time, boost, freeze, ward, gift, missions, trophy…) instead of disappearing.
- Fixes: daily-reward calendar no longer overflows on phones; on-map messages restyled, never wider than the screen, and the mascot waits while a message is shown; dialog titles lost the odd gold first letter.
- Respects *reduce motion*. No gameplay, save or ads changes.
- Test: `python3 tests/e2e/visual_e2e.py`.

## Changelog — v4.5 (places cost points)

- **Places are bought with points**, in map order: price = 100 × position (Giza 100, Alexandria 200 … El Gouna 1,500). Select the next locked place on the map and tap *Unlock for N points* twice (the first tap only asks to confirm). Points come from the same balance as the shop.
- Stars and levels no longer open places; levels inside a place still use Ankh. Places that were already open stay open.
- Settings in `config.js → PROGRESSION` (`placeUnlock:"points"`, `placeCostStep:100`); a place can set its own `unlockCost`. Set `placeUnlock:"progress"` to go back to the v4.3 rule.

## Changelog — v4.4.1 (stability)

- **No fake ads**: the placeholder ad provider runs only on localhost with `?devads=1` and `ADS.test:true`. Without a real ad SDK, no "watch an ad" buttons are shown and no ad reward can be granted (rewards still need the SDK's completed callback).
- **No missed-day penalty**: a break no longer costs points (the old "mummy's curse"). Only the streak counter restarts; a streak freeze still bridges one missed day. Earned coins, items and achievements are never touched.
- **Achievements**: locked/unlocked badges use CSS icons again (the emoji filter had removed ✅/⬜); the badge toast keeps its ✦ icon.
- **Save safety** (`core/savecheck.js`): every field is type- and range-checked on load and on backup restore; valid data passes through unchanged. An unreadable save is kept as `egyptquest.v1.corrupt` and the last good copy (`egyptquest.v1.bak`, written at each start) is loaded instead. If storage is blocked or full, the game keeps running and tells the player once.

## Changelog — v4.4 (map follows the sun)

- New map style **Auto** (default): sunny *Classic* by day, *Sunset* colours around sunrise and sunset (sun between −6° and +8°), *Night* after dark. It is checked every minute and when the app comes back to the foreground.
- The sun's height is computed **on the device** (`www/js/daylight.js`) from the clock and the player's location — no API needed for the time of day, so it also works offline.
- Location, in order: device location if the player allowed it (button in Shop → Map style; never asked at start-up) → approximate location from a free IP-geolocation API (`get.geojs.io`, fallback `ipapi.co`, no key, at most once a day) → Cairo. Only a rounded position (~10 km) is stored on the device.
- Picking Classic / Sunset / Night in the Shop turns Auto off; old saves that had Sunset or Night selected keep it.
- Android: added `ACCESS_COARSE_LOCATION` (only used for this).

## Changelog — v4.3.1

- El Gouna Film Festival is now about **Egyptian films from 2015 on**: live Wikidata questions only use films released from 2015 (and the actors in them), and the built-in bank was replaced with post-2015 films — stars, directors, release years, plots and new film jokes (title riddles). Set `MIN_YEAR` in `games/el-gouna.js` to change the cut-off.

## Changelog — v4.3 (progression)

**Ankh tokens** (☥) — a separate counter from points; points stay the shop currency.
- A win pays Ankh = **new best stars − old best stars** on that level (levels 1–5). Replays only pay improvements, so the same stars are never paid twice. Endless and bonus games give no Ankh.
- **Levels**: level 1 is free; level 2/3/4/5 cost 1/2/3/3 Ankh and need the previous level completed. Tap *Unlock* in the level list, or *Unlock & play* in the result dialog. Endless opens free once level 5 is completed.
- **Places**: a place opens when the previous place has **levels 1–3 completed and 6★** (best per level, summed). Configurable in `config.js → PROGRESSION` or per place with `unlock:{levels,stars}`. Opened places never re-lock. Finishing El Gouna the same way completes the journey (new achievement).
- **Scribe's Trials** — a no-ads, no-purchase way forward using the existing bonus games (same targets, no points):
  - *Token Trial*: +1 Ankh when a level is blocked only by Ankh (max 2 per place).
  - *Passage Trial*: after 3 losses in a row on a level, pass it at 0★ (max 1 per place).
- Every way to start a level goes through one guard (`startSite`), so locked levels/places cannot be started from deep links or old buttons.
- UI: Ankh balance and progress in the level list and info card; progress ring on the next locked place; a short reveal animation when a place opens (skipped on tap and with *reduce motion*).

**Saves**: new fields `pv:2, tok, tokEarned, ul{sites,levels}, cleared, trial, fails`. A save without `pv` is migrated once: everything that was open stays open (places and levels), and Ankh = sum of your best stars. Values are validated on load. Backup codes are now `v:2`; old `v:1` codes still restore (and are migrated).

## Changelog — v4.2.1

- Siwa Oasis sliding puzzle: **Hint** button. A hint plans a solution from the current board (A* search; fallback = undoing the shuffle) and highlights the next 3 tiles to slide with an arrow. Uses the shared hint stock (rewarded ad when empty); more than one hint caps the result at ★★.

## Changelog — v4.2 (map redesign)

- Illustrated, code-painted Egypt map (`map-art.js`) with shaded relief, realistic Nile course (Lake Nasser → Qena bend → Delta branches), Delta & valley vegetation, oases, seas with depth, fading neighbouring lands, gold coastline and graticule; works in all three map themes.
- Map centred below the top HUD; governorate labels fade in by zoom (small Delta governorates only when zoomed); fixed spiky label outlines.
- Emoji removed from the map and HUD: vector glyphs on the canvas (daily star, star counts, curse/ward feedback, compass rose) and SVG/CSS-mask icons in the HUD (`assets/icons/ui-*.svg`, `setRich()` in `ui.js`). Bonus/Book/Shop now have their own icons.
- Fixes: hearts disappeared and quiz score lost its ✓/✗ (stripped by the emoji filter) → text hearts ♥/♡ and ✓/✗; mute button was blank on first launch; score pill overflowed on phones; emoji filter missed ⭐ ⚡ ⏱ ⬜ ☠ ♾ ⚠.

## Changelog — v4.1

**Progression (harder, more replay)**: a place unlocks only after **★★★ on the previous place** (any level); points are for the shop. *(Replaced in v4.3.)*
★★★ requires a run with no lost hearts. Replaying an already-starred level pays 25% (was 40%).

**Win or lose**: every place run has **❤❤❤** (❤❤ on level 5+, Marsa Matruh has 5). Each mistake costs a heart; at 0 the level is lost
(no points). Puzzles without mistakes have move limits (Siwa, Edfu, Philae); Luxor allows N free mismatches; Kharga costs a heart
for a full-but-wrong grid; Giza hunt costs a heart every 3 misses. One "watch an ad → +1 ❤ and continue" per run.
Bonus games need a target: Scarab Rush 30, Treasure Catch 40, Pharaoh Quiz 3/5.

**Fresh questions, never repeated** (`www/js/core/qgen.js`, no API keys):
- Pharaoh Quiz: Wikidata (pharaoh photos, monuments → governorate, governorate capitals, Arabic + English) + Open Trivia DB (English, session token).
- El Gouna: Wikidata Egyptian cinema with photos — *who is this star?*, *which film did X appear in?*, director, release year — mixed with the hand-written bank.
- Shown questions are remembered in `localStorage` (`egyptquest.seen`); data is cached 3 days; offline falls back to the built-in banks.
- Easy levels use well-known stars/films (by Wikipedia popularity); photo distractors match gender; photos with printed names are skipped.

To add your own place's questions or tune difficulty, see `QGen` in `qgen.js`.

## Changelog — v4.0

**Structure**: monolithic engine split into modules; one self-registering file per place; bonus games in `games/bonus/`;
entry renamed to `index.html`; images renamed to clean slugs and resized (737 KB → ~230 KB); removed iframe wrapper pages
(use `?game=` deep links); removed unused world layouts for Alexandria/Luxor/Philae/Abu Simbel (those sites use mini-games).

**Fixes**
- Duplicate code left by the previous split (shared helpers were buried in random game files).
- In-game title pill wrapped to two lines and covered each game's header; now one line (level & points first).
- Mascot quips/toasts covered game content (e.g. El Gouna questions) — moved to the bottom while playing.
- El Gouna question category hidden under the status pill — layout moved down.
- GEM: title under the HUD and subtitle hidden by a dark band; "Book tickets" link never appeared (CSS hid it) — now a button in the GEM info card; board could deadlock when the computer filled the last cell; stale AI move could land in a new game; lose effect relied on matching status text.
- Delayed callbacks (El Gouna, Red Sea, Pharaoh Quiz…) could award a win after leaving the game or into another game — new run-scoped `later()`.
- `?game=` deep links skipped the unlock requirement.
- Map logos: broken images drew an empty marker (now falls back to the icon).
- Daily-login reward popup was lost if another dialog replaced it — re-shown when returning to the map.
- Save on app background / page hide; audio suspended in background.

**Improvements**: GEM AI scales with level (blocks/wins from level 2, smarter from level 3); Android back button
(closes dialogs → leaves game → minimizes); Escape key on desktop; PWA manifest + offline service worker; app icons & splash.
