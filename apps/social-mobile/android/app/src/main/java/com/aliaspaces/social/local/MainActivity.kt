package com.aliaspaces.social.local

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.View
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
    private lateinit var offlineBanner: TextView
    private lateinit var liveButton: Button
    private lateinit var socialButton: Button
    private lateinit var localButton: Button
    private var appMode = MODE_WEBSITE
    private var pendingExport: String? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var liveShellJs: String
    private lateinit var assetLoader: WebViewAssetLoader
    private var connectivityCallback: ConnectivityManager.NetworkCallback? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webView)
        modeLabel = findViewById(R.id.modeLabel)
        offlineBanner = findViewById(R.id.offlineBanner)
        liveButton = findViewById(R.id.liveButton)
        socialButton = findViewById(R.id.socialButton)
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
                if (appMode == MODE_WEBSITE && isProductUrl(url)) {
                    view.evaluateJavascript(liveShellJs, null)
                }
                if (appMode == MODE_WEBSITE && isProductUrl(url)) {
                    prefs().edit().putString(PREF_WEBSITE_URL, url).apply()
                }
                updateOfflineBanner()
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (!request.isForMainFrame) return
                if (appMode == MODE_LOCAL) return
                view.loadUrl(ERROR_URL)
                Toast.makeText(this@MainActivity, getString(R.string.load_error_hint), Toast.LENGTH_LONG).show()
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

        liveButton.setOnClickListener { showMode(MODE_WEBSITE) }
        socialButton.setOnClickListener { showMode(MODE_SOCIAL) }
        localButton.setOnClickListener { showMode(MODE_LOCAL) }
        findViewById<Button>(R.id.browserButton).setOnClickListener {
            openChrome(if (appMode == MODE_WEBSITE) webView.url ?: LIVE_URL else LIVE_URL)
            Toast.makeText(this, getString(R.string.google_login_hint), Toast.LENGTH_LONG).show()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState != null) {
            appMode = savedInstanceState.getString(STATE_MODE, MODE_WEBSITE) ?: MODE_WEBSITE
            webView.restoreState(savedInstanceState)
            renderMode()
        } else if (!openIntent(intent)) {
            showMode(prefs().getString(PREF_MODE, MODE_WEBSITE) ?: MODE_WEBSITE, restoreWebsite = true)
        }
        registerConnectivity()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        openIntent(intent)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(STATE_MODE, appMode)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onDestroy() {
        connectivityCallback?.let { callback ->
            connectivityManager()?.unregisterNetworkCallback(callback)
        }
        super.onDestroy()
    }

    private fun showMode(mode: String, url: String? = null, restoreWebsite: Boolean = false) {
        appMode = mode
        prefs().edit().putString(PREF_MODE, mode).apply()
        renderMode()
        val target = when (mode) {
            MODE_SOCIAL -> SOCIAL_URL
            MODE_LOCAL -> LOCAL_URL
            else -> url
                ?: if (restoreWebsite) prefs().getString(PREF_WEBSITE_URL, LIVE_URL) else LIVE_URL
        }
        webView.loadUrl(target ?: LIVE_URL)
        updateOfflineBanner()
    }

    private fun renderMode() {
        modeLabel.setText(
            when (appMode) {
                MODE_SOCIAL -> R.string.social_mode_hint
                MODE_LOCAL -> R.string.local_mode_hint
                else -> R.string.website_mode_hint
            }
        )
        liveButton.isEnabled = appMode != MODE_WEBSITE
        socialButton.isEnabled = appMode != MODE_SOCIAL
        localButton.isEnabled = appMode != MODE_LOCAL
    }

    private fun openIntent(intent: Intent?): Boolean {
        val uri = intent?.data ?: return false
        when {
            uri.scheme == "aliaspaces" && uri.host == MODE_SOCIAL -> showMode(MODE_SOCIAL)
            uri.scheme == "aliaspaces" && uri.host == MODE_LOCAL -> showMode(MODE_LOCAL)
            uri.scheme == "aliaspaces" -> showMode(MODE_WEBSITE)
            isProductUrl(uri.toString()) -> showMode(MODE_WEBSITE, uri.toString())
            else -> return false
        }
        return true
    }

    private fun openChrome(url: String) {
        CustomTabsIntent.Builder().build().launchUrl(this, Uri.parse(url))
    }

    private fun prefs() = getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun connectivityManager() =
        getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager

    private fun isOnline(): Boolean {
        val manager = connectivityManager() ?: return true
        val network = manager.activeNetwork ?: return false
        val capabilities = manager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun updateOfflineBanner() {
        offlineBanner.visibility = if (appMode != MODE_LOCAL && !isOnline()) View.VISIBLE else View.GONE
    }

    private fun registerConnectivity() {
        val manager = connectivityManager() ?: return
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                runOnUiThread { updateOfflineBanner() }
            }

            override fun onLost(network: Network) {
                runOnUiThread { updateOfflineBanner() }
            }
        }
        connectivityCallback = callback
        manager.registerDefaultNetworkCallback(callback)
        updateOfflineBanner()
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
        const val MODE_WEBSITE = "website"
        const val MODE_SOCIAL = "social"
        const val MODE_LOCAL = "local"
        private const val LIVE_URL = "https://mypersonas.online/"
        private const val SOCIAL_URL = "https://appassets.androidplatform.net/assets/www/live.html"
        private const val LOCAL_URL = "https://appassets.androidplatform.net/assets/www/index.html"
        private const val ERROR_URL = "https://appassets.androidplatform.net/assets/www/error.html"
        private const val ASSET_HOST = "appassets.androidplatform.net"
        private const val REQUEST_EXPORT = 41
        private const val REQUEST_IMPORT = 42
        private const val REQUEST_FILE = 43
        private const val STATE_MODE = "appMode"
        private const val PREFS = "aliaspaces.mobile"
        private const val PREF_MODE = "lastMode"
        private const val PREF_WEBSITE_URL = "lastWebsiteUrl"

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
