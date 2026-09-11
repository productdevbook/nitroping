plugins { id("com.android.library"); kotlin("android") }

android { namespace = "com.nitroping.sdk"; compileSdk = 35 }

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")
}
