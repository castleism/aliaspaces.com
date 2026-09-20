package com.aliaspaces.social.local

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.webkit.WebViewAssetLoader
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var modeLabel: TextView
    private lateinit var liveButton: Button
    private lateinit var localButton: Button
    private var liveMode = true
    private var pendingExport: String? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var liveShellJs: String
    private lateinit var assetLoader: WebViewAssetLoader

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)
        modeLabel = findViewById(R.id.modeLabel)
        liveButton = findViewById(R.id.liveButton)
        localButton = findViewById(R.id.localButton)
        liveShellJs = assets.open("www/src/live/social-shell.js").bufferedReader().use { it.readText() } +
            "\nwindow.AliaSpacesLiveShell.watch();"

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val cookies = CookieManager.getInstance()
        cookies.setAcceptCookie(true)
        cookies.setAcceptThirdPartyCookies(webView, true)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        webView.settings.userAgentString = webView.settings.userAgentString.replace("; wv", "")
        webView.addJavascriptInterface(Bridge(), "AliaSpacesAndroid")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return if (request.url.host == ASSET_HOST) assetLoader.shouldInterceptRequest(request.url) else null
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                if (isAllowed(url)) return false
                openChrome(url)
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                if (liveMode && isProductUrl(url)) {
                    view.evaluateJavascript(liveShellJs, null)
                }
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                val intent = params?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                }
                startActivityForResult(intent, REQUEST_FILE)
                return true
            }
        }

        liveButton.setOnClickListener { showLive() }
        localButton.setOnClickListener { showLocal() }
        findViewById<Button>(R.id.browserButton).setOnClickListener {
            openChrome(if (liveMode) webView.url ?: LIVE_URL else LIVE_URL)
            Toast.makeText(this, getString(R.string.google_login_hint), Toast.LENGTH_LONG).show()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState != null) {
            liveMode = savedInstanceState.getBoolean(STATE_LIVE, true)
            webView.restoreState(savedInstanceState)
            renderMode()
        } else {
            showLive()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putBoolean(STATE_LIVE, liveMode)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    private fun showLive() {
        liveMode = true
        renderMode()
        webView.loadUrl(LIVE_URL)
    }

    private fun showLocal() {
        liveMode = false
        renderMode()
        webView.loadUrl(LOCAL_URL)
    }

    private fun renderMode() {
        modeLabel.setText(if (liveMode) R.string.live_mode_hint else R.string.local_mode_hint)
        liveButton.isEnabled = !liveMode
        localButton.isEnabled = liveMode
    }

    private fun openChrome(url: String) {
        CustomTabsIntent.Builder().build().launchUrl(this, Uri.parse(url))
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_FILE) {
            val uris = if (resultCode == Activity.RESULT_OK && data?.data != null) arrayOf(data.data!!) else null
            fileCallback?.onReceiveValue(uris)
            fileCallback = null
            return
        }
        if (resultCode != Activity.RESULT_OK || data?.data == null) return
        val uri = data.data ?: return
        if (requestCode == REQUEST_EXPORT) writeExport(uri)
        if (requestCode == REQUEST_IMPORT) readImport(uri)
    }

    private fun writeExport(uri: Uri) {
        val payload = pendingExport ?: return
        contentResolver.openOutputStream(uri)?.use { stream ->
            stream.write(payload.toByteArray(StandardCharsets.UTF_8))
        }
        pendingExport = null
        Toast.makeText(this, "Local demo export saved. Not an online backup.", Toast.LENGTH_LONG).show()
    }

    private fun readImport(uri: Uri) {
        val text = contentResolver.openInputStream(uri)?.use { stream ->
            BufferedReader(InputStreamReader(stream, StandardCharsets.UTF_8)).readText()
        } ?: return
        val escaped = org.json.JSONObject.quote(text)
        webView.evaluateJavascript("window.AliaSpacesLocalApp && window.AliaSpacesLocalApp.replaceFromAndroid($escaped)", null)
    }

    inner class Bridge {
        @JavascriptInterface
        fun exportJson(payload: String) {
            pendingExport = payload
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                putExtra(Intent.EXTRA_TITLE, "aliaspaces-local-demo.json")
            }
            startActivityForResult(intent, REQUEST_EXPORT)
        }

        @JavascriptInterface
        fun importJson() {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
            }
            startActivityForResult(intent, REQUEST_IMPORT)
        }
    }

    companion object {
        private const val LIVE_URL = "https://mypersonas.online/"
        private const val LOCAL_URL = "https://appassets.androidplatform.net/assets/www/index.html"
        private const val ASSET_HOST = "appassets.androidplatform.net"
        private const val REQUEST_EXPORT = 41
        private const val REQUEST_IMPORT = 42
        private const val REQUEST_FILE = 43
        private const val STATE_LIVE = "liveMode"

        fun isProductUrl(url: String): Boolean {
            val host = Uri.parse(url).host ?: return false
            return host == "mypersonas.online" || host == "www.mypersonas.online" ||
                host == "aliaspaces.com" || host == "www.aliaspaces.com"
        }

        fun isAllowed(url: String): Boolean {
            val host = (Uri.parse(url).host ?: return false).lowercase()
            if (isProductUrl(url) || host == ASSET_HOST) return true
            if (host.endsWith(".supabase.co") || host.endsWith(".googleusercontent.com") || host.endsWith(".gstatic.com")) return true
            return host in setOf(
                "nwsqyuucwzihruszocge.supabase.co",
                "accounts.google.com",
                "accounts.youtube.com",
                "appleid.apple.com",
                "cdn.jsdelivr.net",
                "cdnjs.cloudflare.com",
                "challenges.cloudflare.com",
                "www.youtube.com",
                "player.twitch.tv",
                "player.kick.com",
                "w.soundcloud.com",
            )
        }
    }
}
