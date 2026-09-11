plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.plugin.compose")
    `maven-publish`
}

group = "dev.nitroping"
version = "0.1.0"

android {
    namespace = "com.nitroping.sdk"
    compileSdk = providers.gradleProperty("nitropingCompileSdk").orElse("37").get().toInt()

    buildFeatures { compose = true }
    publishing {
        singleVariant("release") {
            withSourcesJar()
        }
    }
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

publishing {
    publications {
        register<MavenPublication>("release") {
            from(components["release"])
            pom {
                name.set("NitroPing Android SDK")
                description.set("Open-source Android SDK for collecting NitroPing feedback.")
                url.set("https://github.com/productdevbook/nitroping")
                licenses {
                    license {
                        name.set("Apache-2.0")
                        url.set("https://www.apache.org/licenses/LICENSE-2.0.txt")
                    }
                }
            }
        }
    }
}
