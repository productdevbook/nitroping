plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
}

group = "dev.nitroping"
version = "0.1.0"

android {
    namespace = "com.nitroping.sdk"
    compileSdk = providers.gradleProperty("nitropingCompileSdk").orElse("37").get().toInt()

    buildFeatures { compose = true }
}

dependencies {
    val composeBomVersion = providers.gradleProperty("nitropingComposeBom").orElse("2026.09.00").get()
    val composeBom = platform("androidx.compose:compose-bom:$composeBomVersion")
    implementation(composeBom)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.13.0")
}
