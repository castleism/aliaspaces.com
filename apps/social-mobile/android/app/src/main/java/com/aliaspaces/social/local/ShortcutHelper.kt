package com.aliaspaces.social.local

import android.content.Context
import android.content.Intent
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat

object ShortcutHelper {
    fun requestPins(context: Context) {
        val prefs = context.getSharedPreferences("aliaspaces.mobile", Context.MODE_PRIVATE)
        if (prefs.getBoolean("websiteShortcutOffered", false)) return
        prefs.edit().putBoolean("websiteShortcutOffered", true).apply()
        if (!ShortcutManagerCompat.isRequestPinShortcutSupported(context)) return
        val intent = WebsiteActivity.intent(context).setAction(Intent.ACTION_VIEW)
        val shortcut = ShortcutInfoCompat.Builder(context, "website-browser-app")
            .setShortLabel(context.getString(R.string.website_app_name))
            .setLongLabel(context.getString(R.string.website_app_hint))
            .setIcon(IconCompat.createWithResource(context, R.drawable.ic_launcher_foreground))
            .setIntent(intent)
            .build()
        ShortcutManagerCompat.requestPinShortcut(context, shortcut, null)
    }
}
