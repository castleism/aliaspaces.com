package com.aliaspaces.social.local

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent

class WebsiteActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var liveShellJs: String

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_website)
        webView = findViewById(R.id.webView)
        findViewById<TextView>(R.id.modeLabel).setText(R.string.website_app_hint)
        liveShellJs = assets.open("www/src/live/social-shell.js").bufferedReader().use { it.readText() } +
            "\nwindow.AliaSpacesLiveShell.watch();"

        val cookies = CookieManager.getInstance()
        cookies.setAcceptCookie(true)
        cookies.setAcceptThirdPartyCookies(webView, true)

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.settings.javaScriptCanOpenWindowsAutomatically = false
        webView.settings.userAgentString = webView.settings.userAgentString.replace("; wv", "")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                if (NavigationPolicy.isAllowed(url)) return false
                CustomTabsIntent.Builder().build().launchUrl(this@WebsiteActivity, request.url)
                return true
            }

            override fun onPageFinished(view: WebView, url: String) {
                if (NavigationPolicy.isProductUrl(url)) {
                    view.evaluateJavascript(liveShellJs, null)
                }
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    Toast.makeText(this@WebsiteActivity, getString(R.string.load_error_hint), Toast.LENGTH_LONG).show()
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
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }
                startActivityForResult(intent, REQUEST_FILE)
                return true
            }
        }

        findViewById<Button>(R.id.checkerButton).setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java).setData(Uri.parse("aliaspaces://check")))
        }
        findViewById<Button>(R.id.browserButton).setOnClickListener {
            CustomTabsIntent.Builder().build().launchUrl(this, Uri.parse(webView.url ?: NavigationPolicy.LIVE_URL))
            Toast.makeText(this, getString(R.string.google_login_hint), Toast.LENGTH_LONG).show()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        val target = intent?.data?.toString()?.takeIf { NavigationPolicy.isProductUrl(it) }
            ?: NavigationPolicy.LIVE_URL
        if (savedInstanceState != null) webView.restoreState(savedInstanceState) else webView.loadUrl(target)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_FILE) {
            val uris = if (resultCode == android.app.Activity.RESULT_OK && data?.data != null) arrayOf(data.data!!) else null
            fileCallback?.onReceiveValue(uris)
            fileCallback = null
        }
    }

    companion object {
        private const val REQUEST_FILE = 51

        fun intent(context: Context, url: String = NavigationPolicy.LIVE_URL): Intent {
            return Intent(context, WebsiteActivity::class.java).setData(Uri.parse(url))
        }
    }
}
