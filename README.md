# Melofy

<<<<<<< HEAD
A free, YouTube-powered music player with a Spotify-style UI — now rebuilt
as a proper Django + Python backend, with Google/YouTube account sign-in
and a single-page app frontend so music never stops when you navigate. Plus
an Android Studio project that wraps the whole thing.

```
melofy/
├── backend/            Django project — the API and the app itself
│   ├── melofy_backend/ settings, urls, wsgi
│   ├── core/           search + "discover" endpoints (server-side YouTube key)
│   ├── accounts/       Firebase login + YouTube account linking
│   ├── frontend/       the single-page app (HTML/CSS/JS, served by Django)
│   ├── requirements.txt, .env.example, .python-version
├── android/            Android Studio project (WebView + Custom Tabs wrapper)
├── LICENSE, .gitignore
```

## What changed from the static version

- **One backend now serves everything.** The frontend is still plain
  HTML/CSS/JS (no framework, no build step) but it's served by Django, and
  it's a genuine single-page app — clicking around never stops the music,
  including when the tab or app loses focus.
- **No API key needed by anyone using the app.** The YouTube key lives on
  the server as an environment variable now, not typed into the app.
- **Sign in with Google, connect your YouTube account.** Once connected,
  Your Library shows your actual liked videos, subscriptions, and playlists
  from YouTube, pulled live via the YouTube Data API.
- **No emoji anywhere in the UI** — every icon is a small inline SVG.
- **Sidebar is now a slidable, closeable drawer** (menu button, top left).
- **Volume moved into a floating "sound mixer"** button, bottom right —
  click it to reveal a slider.
- **Home page shows random picks** on top of your recently played.
- Real favicon + app icons (SVG + PNG), generated from the app's own logo mark.

## What's still true

Playback still goes through YouTube's official IFrame Player API — the
legitimate way to embed YouTube, and the reason ads on individual videos
can't be suppressed (that's controlled by YouTube/the content owner, not
this app). Downloading/saving audio to the device isn't built for the same
reason: that requires extracting streams outside YouTube's player, which
violates YouTube's Terms of Service.

**If you pasted a YouTube API key anywhere it could be seen (a chat, a
screenshot, a commit) — regenerate it in Google Cloud Console before using
it here.** It goes in an environment variable, never in a committed file.

## 1. One-time setup

You'll set up to three things, all free. Do them in this order.

### a) YouTube Data API key (for search + Home's random picks)
Google Cloud Console → **APIs & Services → Library** → enable **YouTube
Data API v3** → **Credentials → Create Credentials → API key**.

### b) Firebase project (for "Sign in with Google")
1. [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. **Build → Authentication → Sign-in method** → enable **Google**.
3. **Project settings → General → Your apps → Add app → Web** — copy the
   config object into `backend/frontend/js/firebaseConfig.js` (this one is
   *designed* to be public client-side config — unlike the YouTube key,
   it's safe to commit).
4. **Project settings → Service accounts → Generate new private key** —
   downloads a JSON file. Paste its entire content as one line into the
   `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable (used server-side
   only, to verify sign-ins — never commit the file itself).

### c) Google OAuth client (for "Connect your YouTube account")
This is separate from Firebase's config — it's what lets the backend keep
reading someone's liked videos/subscriptions/playlists after they leave.
1. Same Google Cloud project as (a) → **APIs & Services → OAuth consent
   screen** — fill in the basics. While testing, "Testing" mode + adding
   yourself as a test user is enough; production use with real users needs
   Google's verification for the `youtube.readonly` scope.
2. **Credentials → Create Credentials → OAuth client ID → Web application.**
   Authorized redirect URI: `<PUBLIC_BASE_URL>/api/youtube/callback`
   (e.g. `https://your-app.vercel.app/api/youtube/callback` — update this
   after your first deploy, since you won't have the URL yet).
3. Copy the client ID and client secret into your environment.

Put everything from (a)–(c) into `backend/.env` for local dev (copy
`backend/.env.example` first) or into your host's environment variable
settings for production.

## 2. Run it locally

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then fill in the values from step 1
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000 — search, playback, and the random Home picks
all work immediately (they only need the YouTube API key). Sign-in and
YouTube account linking need the Firebase/OAuth steps above and a real
`PUBLIC_BASE_URL` matching wherever you're running this.

## 3. Deploy — GitHub + Vercel

```bash
git init && git add . && git commit -m "Initial commit"
=======
A free, account-free music player that streams from YouTube — with a
Spotify-style dark UI, liked songs, playlists, and a persistent now-playing
bar. Plain HTML/CSS/JS (no build step, no framework), plus a small Android
Studio project that wraps it in a native app.

**No sign-up required for anyone using the app.** The only setup step is
that *you*, the developer, generate one free YouTube API key (see below) —
that key lives in the deployed app itself, not tied to any personal login.

## What's included

```
melofy/
├── index.html, search.html, library.html, liked.html, playlist.html
├── css/            variables, base, layout, components, player
├── js/             storage, player, playerbar, ui, youtubeApi, common,
│                   and one file per page (home/search/library/liked/playlist)
├── android/        Android Studio project (WebView wrapper)
├── vercel.json, LICENSE, .gitignore
```

### Features
- Search YouTube for any song and play it instantly
- Persistent now-playing bar: play/pause, next/prev, shuffle, repeat, seek, volume
- Liked Songs and unlimited custom playlists — all stored locally in the browser
- Recently played, genre quick-picks on Home
- Fully responsive — sidebar on desktop, bottom tab bar + compact player on mobile
- Works as a normal website *and* as an Android app (same code, bundled into the APK)

### What it deliberately doesn't do
- **It can't strip YouTube's own ads.** Playback uses YouTube's official
  IFrame Player API — the legitimate, documented way to embed YouTube
  (https://developers.google.com/youtube/iframe_api_reference). Ads on
  individual videos are controlled by YouTube and the content owner, not by
  this app. Doing that would mean extracting/downloading audio streams
  outside YouTube's player, which violates YouTube's Terms of Service — this
  project doesn't do that. The app itself adds zero ads of its own.
- No offline downloads, for the same reason.

## How it's structured (read this before you start editing)

This is a classic multi-page site (separate `.html` files, not a single-page
app) — but plain multi-page navigation would normally stop the music on
every click. To avoid that, the player saves its state (current track +
position) to `localStorage` every few seconds, and each page reloads that
state on load and resumes automatically. In practice this means navigating
between pages causes a very brief (~1 second) reload of the audio rather
than Spotify's zero-interruption playback. Browsers can also block
autoplay-with-sound on a fresh page load until you interact with the page —
if that happens, the bar will just show "paused" with the song cued up
instead of silently failing. If you'd rather have a true single-page app
with zero playback interruption, that's a straightforward conversion — ask
and it can be restructured that way.

## 1. Get a free YouTube Data API key (one-time, ~2 minutes)

Search only needs this — playback never does.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
   and create a project (or use an existing one).
2. Go to **APIs & Services → Library**, search for **YouTube Data API v3**,
   and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**.
4. Copy the key. Optionally click "Restrict key" → "API restrictions" →
   limit it to YouTube Data API v3 (recommended, not required).
5. Open the app, click the ⚙️ settings icon, paste the key, and save.

The free tier gives roughly 10,000 quota units/day, and a search costs about
100 units — so roughly 100 searches/day by default. That's a Google-side
limit, adjustable from the Cloud Console if you need more.

## 2. Run it locally

Any static file server works. From the project folder:

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open the printed local URL. (Double-clicking `index.html` directly
also works for a quick look, but a local server is recommended.)

## 3. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

<<<<<<< HEAD
Then on [vercel.com](https://vercel.com): **Add New → Project** → import
the repo → set the **Root Directory** to `backend`. Vercel auto-detects
Django (zero configuration needed) from `manage.py` and the
`WSGI_APPLICATION` setting. Add all the environment variables from step 1
in the project's **Settings → Environment Variables**, plus:

- `DATABASE_URL` — a hosted Postgres connection string. SQLite's file
  won't persist reliably on Vercel's serverless filesystem, and the
  YouTube-account-linking feature needs a real database. Vercel Postgres,
  [Neon](https://neon.tech), and [Supabase](https://supabase.com) all have
  workable free tiers — create one, copy its connection string here.
- `PUBLIC_BASE_URL` — your deployment's URL, e.g. `https://your-app.vercel.app`
  (no trailing slash). Update this and the OAuth redirect URI (step 1c)
  once you know your actual URL.
- `DJANGO_SECRET_KEY` — any long random string.

After deploying, run the database migration once against your production
database (`vercel env pull` locally, then `python manage.py migrate`, or
your host's equivalent one-off command runner).

## 4. Android app

1. Open `MainActivity.kt` and set `APP_URL` to your deployed URL (Google
   sign-in needs a real public HTTPS address, so this can no longer be a
   bundled local copy the way the first version was).
2. Open Android Studio → **Open** → select the `android/` folder, let
   Gradle sync, run.

**How sign-in works here:** a plain WebView isn't allowed to complete
Google sign-in (Google blocks it as an "embedded user agent"), so
`MainActivity` detects navigation to `accounts.google.com` and opens it in
a Chrome Custom Tab instead. Completing sign-in there hands control back to
the app through a `melofy://auth/complete` deep link with a one-time code,
which the app's own WebView redeems to establish its session — this is
necessary because Custom Tabs and the WebView don't share cookies. This is
the most involved, least-tested part of the whole project (I can author
Django/Kotlin/JS code but can't run the full Google OAuth round-trip in the
environment that built this) — the pattern is correct and standard, but
budget some time for debugging it against your own Firebase/OAuth
credentials.

Before publishing anywhere, change the placeholder package name
(`com.melofy.app`) in `android/app/build.gradle.kts` and
`AndroidManifest.xml`, and swap in your own launcher icon.

**Versions used:** Android Gradle Plugin 9.0.1, Gradle 9.1.0, Kotlin 2.4.20,
compileSdk/targetSdk 36, minSdk 26.

## Notes & possible next steps

- Clicking into one of "Your YouTube playlists" currently shows its title
  and video count but not its contents — fetching a playlist's actual
  videos (`playlistItems.list`) is a small, separate addition if you want it.
- Not built: a visible reorderable queue, drag-to-reorder within a
  playlist, a full-screen mobile "Now Playing" view.
- The app's name, colors, and fonts are easy to change — "Melofy" appears
  in `index.html`'s `<title>`, the sidebar logo, `strings.xml` (Android),
  and `app/build.gradle.kts`; colors are CSS variables in
  `backend/frontend/css/variables.css`.

## License

MIT — see `LICENSE`.
=======
Then in the repo: **Settings → Pages → Source: Deploy from a branch →
main / (root)**. Your site will be live at
`https://<you>.github.io/<repo>/`.

## 4. Deploy to Vercel

1. Push the repo to GitHub (above).
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   the repo.
3. Leave the framework preset as-is (Vercel detects a static site
   automatically) — no build command needed. Deploy.

`vercel.json` is already set up for clean URLs (`/search` instead of
`/search.html`).

## 5. Run the Android app in Android Studio

1. Open Android Studio → **Open** → select the `android/` folder.
2. Let Gradle sync (first sync downloads dependencies — needs internet).
   If Android Studio reports a missing Gradle wrapper jar on first open,
   click the prompt to let it regenerate the wrapper — this is normal for a
   hand-written project and only happens once.
3. Run on an emulator or a physical device (▶ button).

By default the app loads its **own bundled copy** of the web files from
`android/app/src/main/assets/www/` — so the UI shell opens even with no
signal (playback and search still need internet, since both talk to
YouTube). If you edit the web app later, copy your changes into
`android/app/src/main/assets/www/` too, or switch the app to always load
your live deployment instead — open `MainActivity.kt` and change:

```kotlin
private const val LOAD_URL = LOCAL_URL       // bundled copy (works offline for the UI)
// to:
private const val LOAD_URL = "https://your-app.vercel.app/"   // always up to date
```

Before publishing anywhere, change the placeholder package name
(`com.melofy.app`) in `android/app/build.gradle.kts` and
`AndroidManifest.xml` to your own, and swap in your own app icon (Android
Studio's **Image Asset** tool, right-click `res` → New → Image Asset, is the
easiest way).

**Versions used:** Android Gradle Plugin 9.0.1, Gradle 9.1.0, Kotlin 2.4.20,
compileSdk/targetSdk 36, minSdk 26 (Android 8.0+). If a lot of time has
passed since this was generated, Android Studio may offer to update these —
that's safe to accept.

## Notes & possible next steps

- Not built yet, but straightforward to add if useful: a visible up-next
  queue view, drag-to-reorder within a playlist, and a full-screen
  "Now Playing" view for mobile.
- Rename the app: the name "Melofy" appears in each HTML `<title>`, the
  sidebar logo, `strings.xml` (Android), and `app/build.gradle.kts`
  (`namespace`/`applicationId`) — search and replace as you like.

## License

MIT — see `LICENSE`. Do whatever you like with it.
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
