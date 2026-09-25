package com.aliaspaces.social.local

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle

class LocalLauncherActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        startActivity(
            Intent(this, MainActivity::class.java)
                .setData(Uri.parse("aliaspaces://local"))
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        )
        finish()
    }
}
