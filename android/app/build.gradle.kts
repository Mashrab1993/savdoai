// SavdoAI v25.5.0 — build.gradle.kts
// Jetpack Compose Material 3 Expressive + Room + Retrofit + WorkManager + CameraX
import java.io.File

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")  // Room annotation processor
}

android {
    namespace = "uz.savdoai.print"
    compileSdk = 34

    defaultConfig {
        applicationId = "uz.savdoai.print"
        minSdk = 26
        targetSdk = 34
        versionCode = 5
        versionName = "2.1.0"  // v25.5.0 premium UI upgrade
        vectorDrawables { useSupportLibrary = true }
    }

    signingConfigs {
        create("release") {
            val ks = System.getenv("KEYSTORE_PATH")
            if (ks != null) {
                storeFile = file(ks)
                storePassword = System.getenv("KEYSTORE_PASS") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: "savdoai"
                keyPassword = System.getenv("KEY_PASS") ?: ""
            }
        }
    }

    buildTypes {
        debug { isMinifyEnabled = false }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            val ks = System.getenv("KEYSTORE_PATH")
            if (ks != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.8" }
    packaging {
        resources.excludes += setOf(
            "/META-INF/{AL2.0,LGPL2.1}",
            "/META-INF/DEPENDENCIES",
        )
    }
}

dependencies {
    // ═══ ANDROID CORE ═══
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // ═══ JETPACK COMPOSE (Material 3 Expressive) ═══
    val composeBom = platform("androidx.compose:compose-bom:2024.02.02")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.compose.material3:material3-window-size-class:1.2.1")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.animation:animation")
    implementation("androidx.compose.foundation:foundation")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // ═══ ROOM DATABASE (Offline-first) ═══
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // ═══ RETROFIT (API client) ═══
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // ═══ WORKMANAGER (Background sync) ═══
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // ═══ LOCATION (GPS) ═══
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // ═══ CAMERAX (Barcode scan) ═══
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
    implementation("com.google.mlkit:barcode-scanning:17.2.0")

    // ═══ GSON ═══
    implementation("com.google.code.gson:gson:2.10.1")
}

/** OneDrive / sinxron papkalarda Gradle `Unable to delete directory` — chiqishni LocalAppData ga. */
val savdoaiExternalBuild = System.getenv("SAVDOAI_EXTERNAL_BUILD") != "0"
if (savdoaiExternalBuild && System.getProperty("os.name").orEmpty().lowercase().contains("win")) {
    System.getenv("LOCALAPPDATA")?.let { lad ->
        layout.buildDirectory.set(file(File(lad, "SavdoAI-Print-gradle/app")))
    }
}
