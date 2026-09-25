package com.aliaspaces.social.local

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat

object ShortcutHelper {
    fun requestPins(context: Context) {
        val icon = IconCompat.createWithResource(context, R.drawable.ic_launcher_foreground)
        val published = listOf(
            shortcut(context, "check", context.getString(R.string.app_name), Intent(context, MainActivity::class.java).setData(Uri.parse("aliaspaces://check")), icon),
            shortcut(context, "website", context.getString(R.string.website_app_name), WebsiteActivity.intent(context), icon),
            shortcut(context, "social", context.getString(R.string.social_app_name), Intent(context, MainActivity::class.java).setData(Uri.parse("aliaspaces://social")), icon),
            shortcut(context, "local", context.getString(R.string.local_app_name), Intent(context, MainActivity::class.java).setData(Uri.parse("aliaspaces://local")), icon),
        )
        ShortcutManagerCompat.setDynamicShortcuts(context, published)

        val prefs = context.getSharedPreferences("aliaspaces.mobile", Context.MODE_PRIVATE)
        if (prefs.getBoolean("websiteShortcutOffered", false)) return
        prefs.edit().putBoolean("websiteShortcutOffered", true).apply()
        if (!ShortcutManagerCompat.isRequestPinShortcutSupported(context)) return
        ShortcutManagerCompat.requestPinShortcut(context, published[1], null)
    }

    private fun shortcut(
        context: Context,
        id: String,
        label: String,
        intent: Intent,
        icon: IconCompat
    ): ShortcutInfoCompat {
        intent.action = Intent.ACTION_VIEW
        return ShortcutInfoCompat.Builder(context, id)
            .setShortLabel(label)
            .setIcon(icon)
            .setIntent(intent)
            .build()
    }
}
