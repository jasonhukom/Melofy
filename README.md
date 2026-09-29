# Melofy

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
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

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
