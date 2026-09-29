/* firebaseAuth.js — "Sign in with Google" + "Connect your YouTube account".
   ES module (needs the Firebase JS SDK's modular imports), loaded with
   type="module" in index.html; exposes window.FirebaseAuth so the rest of
   the (non-module) app can use it.

   Android note: a plain WebView is not allowed to complete Google sign-in
   (Google blocks it as an "embedded user agent") — MainActivity.kt detects
   navigation to accounts.google.com and opens a Chrome Custom Tab instead.
   That Custom Tab is a separate browser context with its own cookies, so
   completion is handed back to the app via a melofy://auth/complete deep
   link + a one-time code rather than a normal redirect-result/cookie. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

const IS_ANDROID = /MelofyAndroidApp/.test(navigator.userAgent);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/youtube.readonly");

let currentUser = null;
const listeners = [];
function emit() { listeners.forEach(cb => { try { cb(currentUser); } catch (e) {} }); }

async function refreshSessionFromServer() {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  const data = await res.json();
  currentUser = data.signedIn
    ? { uid: data.uid, email: data.email, displayName: data.displayName, youtubeConnected: data.youtubeConnected }
    : null;
  emit();
  return currentUser;
}

async function establishSession(user) {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ idToken })
  });
  const data = await res.json();
  if (res.ok) {
    currentUser = { uid: data.uid, email: data.email, displayName: data.displayName, youtubeConnected: data.youtubeConnected };
    emit();
  }
  return data;
}

async function signIn() {
  if (IS_ANDROID) {
    // Continues in MainActivity's Custom Tab; completion arrives later via
    // window.completeAndroidHandoff(), not here.
    await signInWithRedirect(auth, provider);
    return;
  }
  const result = await signInWithPopup(auth, provider);
  await establishSession(result.user);
}

async function signOutEverywhere() {
  try { await signOut(auth); } catch (e) { /* ignore */ }
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  currentUser = null;
  emit();
}

function connectYouTube() {
  const platform = IS_ANDROID ? "android" : "web";
  window.location.href = `/api/youtube/connect?platform=${platform}`;
}

async function disconnectYouTube() {
  await fetch("/api/youtube/disconnect", { method: "POST", credentials: "same-origin" });
  if (currentUser) currentUser.youtubeConnected = false;
  emit();
}

// Called by MainActivity (evaluateJavascript) once the melofy://auth/complete
// deep link hands a one-time code back to the app's own WebView.
window.completeAndroidHandoff = async function (code) {
  const res = await fetch(`/api/auth/exchange?code=${encodeURIComponent(code)}`, { credentials: "same-origin" });
  const data = await res.json();
  if (res.ok) {
    currentUser = { uid: data.uid, email: data.email, displayName: data.displayName, youtubeConnected: data.youtubeConnected };
    emit();
    if (window.UI) window.UI.toast("Signed in");
  }
};

async function init() {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      if (IS_ANDROID) {
        // This code is actually running inside the throwaway Custom Tab
        // right now, not the app's WebView — hand off instead of trying to
        // keep a session here.
        const idToken = await result.user.getIdToken();
        const res = await fetch("/api/auth/mobile-handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken })
        });
        const data = await res.json();
        if (res.ok) window.location.href = `melofy://auth/complete?code=${encodeURIComponent(data.code)}`;
        return;
      }
      await establishSession(result.user);
      return;
    }
  } catch (e) { /* no pending redirect, or Firebase isn't configured yet */ }

  await refreshSessionFromServer();
}

export const FirebaseAuth = {
  init, signIn, signOutEverywhere, connectYouTube, disconnectYouTube,
  onChange: (cb) => listeners.push(cb),
  getUser: () => currentUser
};
window.FirebaseAuth = FirebaseAuth;
