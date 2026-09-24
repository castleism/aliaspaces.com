package com.aliaspaces.social.local

import android.net.Uri

object NavigationPolicy {
    const val ASSET_HOST = "appassets.androidplatform.net"
    const val LIVE_URL = "https://mypersonas.online/"
    const val HUB_URL = "https://appassets.androidplatform.net/assets/www/hub.html"
    const val SOCIAL_URL = "https://appassets.androidplatform.net/assets/www/live.html"
    const val LOCAL_URL = "https://appassets.androidplatform.net/assets/www/index.html"
    const val PERSONA_URL = "https://appassets.androidplatform.net/assets/www/persona.html"
    const val ERROR_URL = "https://appassets.androidplatform.net/assets/www/error.html"

    private val PRODUCT_HOSTS = setOf(
        "mypersonas.online",
        "www.mypersonas.online",
        "aliaspaces.com",
        "www.aliaspaces.com",
    )
    private val EXACT_HOSTS = PRODUCT_HOSTS + setOf(
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
        ASSET_HOST,
    )

    fun parseSafeHttps(url: String): Uri? {
        val uri = Uri.parse(url) ?: return null
        if (!"https".equals(uri.scheme, ignoreCase = true)) return null
        if (!uri.userInfo.isNullOrEmpty()) return null
        if (uri.host.isNullOrBlank()) return null
        return uri
    }

    fun hostOf(url: String): String? = parseSafeHttps(url)?.host?.lowercase()

    fun isProductUrl(url: String): Boolean {
        val host = hostOf(url) ?: return false
        return host in PRODUCT_HOSTS
    }

    fun isLocalAssetUrl(url: String): Boolean = hostOf(url) == ASSET_HOST

    fun isAllowed(url: String): Boolean {
        val host = hostOf(url) ?: return false
        return host in EXACT_HOSTS
    }

    fun isSocialAllowed(url: String): Boolean {
        val host = hostOf(url) ?: return false
        return host == ASSET_HOST || host == "nwsqyuucwzihruszocge.supabase.co"
    }

    fun chooserMime(mode: String): String = when (mode) {
        MainActivity.MODE_LOCAL -> "application/json"
        MainActivity.MODE_SOCIAL -> "image/*"
        else -> "image/*"
    }
}
