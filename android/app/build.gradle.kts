plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
    namespace = "uz.savdoai.print"; compileSdk = 34
    defaultConfig {
        applicationId = "uz.savdoai.print"; minSdk = 26; targetSdk = 34
        versionCode = 1; versionName = "1.0.0"
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
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            val ks = System.getenv("KEYSTORE_PATH")
            if (ks != null) signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_1_8; targetCompatibility = JavaVersion.VERSION_1_8 }
    kotlinOptions { jvmTarget = "1.8" }
}
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
