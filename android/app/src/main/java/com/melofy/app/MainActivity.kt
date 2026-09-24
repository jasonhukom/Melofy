package com.melofy.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * Thin WebView wrapper around the Melofy web app. The app's own HTML/CSS/JS
 * is bundled in assets/www and loaded from there, so the UI shell works
 * without a network connection — actual playback and search still need
 * internet, since both talk to YouTube.
 *
 * To point this at a deployed copy instead (e.g. your Vercel URL) so the
 * app always matches your latest deploy, change LOAD_URL below.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
        private const val LOCAL_URL = "file:///android_asset/www/index.html"
        // private const val REMOTE_URL = "https://your-app.vercel.app/"
        private const val LOAD_URL = LOCAL_URL
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
        settings.allowFileAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(LOAD_URL)

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
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
