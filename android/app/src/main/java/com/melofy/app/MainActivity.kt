package com.melofy.app

import android.annotation.SuppressLint
<<<<<<< HEAD
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
=======
import android.os.Bundle
import android.webkit.WebChromeClient
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
<<<<<<< HEAD
import androidx.browser.customtabs.CustomTabsIntent
import org.json.JSONObject

/**
 * Thin WebView wrapper around the deployed Melofy web app.
 *
 * Google blocks completing sign-in inside a plain embedded WebView (it
 * returns "disallowed_useragent"), so any navigation to accounts.google.com
 * is intercepted here and opened in a Chrome Custom Tab instead. That tab
 * has its own separate cookies from this WebView, so completion is handed
 * back via the melofy://auth/complete deep link + a one-time code (see
 * js/firebaseAuth.js and accounts/handoff.py on the backend) rather than a
 * normal cookie-based redirect.
=======

/**
 * Thin WebView wrapper around the Melofy web app. The app's own HTML/CSS/JS
 * is bundled in assets/www and loaded from there, so the UI shell works
 * without a network connection — actual playback and search still need
 * internet, since both talk to YouTube.
 *
 * To point this at a deployed copy instead (e.g. your Vercel URL) so the
 * app always matches your latest deploy, change LOAD_URL below.
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
<<<<<<< HEAD
        // Point this at your deployed backend (Vercel URL, custom domain,
        // etc.) — Google OAuth needs a real public HTTPS URL, so unlike the
        // earlier bundled-assets version, this can't just be a local copy.
        private const val APP_URL = "https://your-app.vercel.app/"
        private const val ANDROID_UA_SUFFIX = " MelofyAndroidApp/1.0"
=======
        private const val LOCAL_URL = "file:///android_asset/www/index.html"
        // private const val REMOTE_URL = "https://your-app.vercel.app/"
        private const val LOAD_URL = LOCAL_URL
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
<<<<<<< HEAD
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.userAgentString = settings.userAgentString + ANDROID_UA_SUFFIX

        webView.webViewClient = MelofyWebViewClient()
        webView.webChromeClient = WebChromeClient()
        webView.loadUrl(APP_URL)
=======
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(LOAD_URL)
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
<<<<<<< HEAD

        handleDeepLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    /** Handles melofy://auth/complete?code=... by handing the code to the
     *  page already loaded in the WebView, which redeems it against
     *  /api/auth/exchange to establish a real session in this WebView's own
     *  storage. Nothing is reloaded, so playback is not interrupted. */
    private fun handleDeepLink(intent: Intent?) {
        val uri: Uri = intent?.data ?: return
        if (uri.scheme == "melofy" && uri.host == "auth") {
            val code = uri.getQueryParameter("code") ?: return
            val jsSafeCode = JSONObject.quote(code) // safely escaped JS string literal
            webView.evaluateJavascript(
                "if (window.completeAndroidHandoff) { window.completeAndroidHandoff($jsSafeCode); }",
                null
            )
        }
    }

    private inner class MelofyWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            if (url.host == "accounts.google.com") {
                CustomTabsIntent.Builder().build().launchUrl(this@MainActivity, url)
                return true
            }
            return false
        }
=======
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
