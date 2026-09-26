plugins {
    id("com.android.application")
<<<<<<< HEAD
    id("org.jetbrains.kotlin.android")
=======
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
}

android {
    namespace = "com.melofy.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.melofy.app"
<<<<<<< HEAD
=======
        // minSdk 26 (Android 8.0+) lets us use modern adaptive launcher icons
        // with no legacy PNG assets, and covers the very large majority of
        // active devices as of 2026.
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
<<<<<<< HEAD

    kotlinOptions {
        jvmTarget = "17"
=======
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
<<<<<<< HEAD
    // Chrome Custom Tabs — Google Sign-In is blocked inside a plain WebView,
    // so the OAuth screens open here instead. See MainActivity.kt.
    implementation("androidx.browser:browser:1.8.0")
=======
>>>>>>> 642a149240c8efabed4ba9732a0e6c1036e900b3
}
