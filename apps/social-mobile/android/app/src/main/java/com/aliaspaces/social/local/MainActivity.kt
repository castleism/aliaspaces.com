package com.aliaspaces.social.local

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.charset.StandardCharsets

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var pendingExport: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.addJavascriptInterface(Bridge(), "AliaSpacesAndroid")
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                return request.url.host != "appassets.androidplatform.net"
            }
        }
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
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
        webView.evaluateJavascript("window.AliaSpacesLocalApp.replaceFromAndroid($escaped)", null)
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
        private const val REQUEST_EXPORT = 41
        private const val REQUEST_IMPORT = 42
    }
}
