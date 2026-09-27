package com.aliaspaces.social.local

import org.junit.Assert.*
import org.junit.Test

class NavigationPolicyTest {
    @Test fun rejectsConfusedAndAttackerOrigins() {
        listOf(
            "https://attacker.supabase.co/", "https://cdn.jsdelivr.net/",
            "https://evil.googleusercontent.com/", "https://www.gstatic.com/",
            "http://mypersonas.online/", "javascript://mypersonas.online/a",
            "https://evil@mypersonas.online/", "https://mypersonas.online@evil.test/",
            "https://mypersonas.online:444/", "https://mypersonas.online.evil.test/",
            "https://mypersonas.online\\@evil.test/", "https://mypersonas.online./"
        ).forEach { assertFalse(it, NavigationPolicy.isAllowed(it, "website")) }
    }
    @Test fun keepsExplicitProductAndAuthOrigins() {
        listOf("https://mypersonas.online/#/owner", "https://aliaspaces.com/", "https://accounts.google.com/o/oauth2/auth", "https://nwsqyuucwzihruszocge.supabase.co/auth/v1/callback").forEach {
            assertTrue(it, NavigationPolicy.isAllowed(it, "website"))
            assertFalse(it, NavigationPolicy.isAllowed(it, "local"))
        }
    }
    @Test fun separatesLocalSocialAndWebsiteDocuments() {
        val local = "https://appassets.androidplatform.net/assets/www/index.html"
        val social = "https://appassets.androidplatform.net/assets/www/live.html"
        assertTrue(NavigationPolicy.isAllowed(local, "local"))
        assertFalse(NavigationPolicy.isAllowed(local, "website"))
        assertFalse(NavigationPolicy.isAllowed(social, "local"))
        assertTrue(NavigationPolicy.isAllowed(social, "social"))
        assertFalse(NavigationPolicy.isAllowed(local.replace("index.html", "../www/index.html"), "local"))
        assertEquals(listOf("application/json"), NavigationPolicy.fileTypes(local, "local"))
        assertEquals(listOf("image/*", "video/*"), NavigationPolicy.fileTypes("https://mypersonas.online/", "website"))
        assertTrue(NavigationPolicy.fileTypes(social, "social").isEmpty())
        assertTrue(NavigationPolicy.fileTypes("https://accounts.google.com/", "website").isEmpty())
    }
}
