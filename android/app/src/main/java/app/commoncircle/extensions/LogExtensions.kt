package app.CommonCircle.extensions

import android.util.Log
import app.CommonCircle.BuildConfig

fun Any.log(message: String?, keyValueMap: Map<String, Any> = emptyMap(), tag: String = this::class.java.simpleName) {
    if (BuildConfig.DEBUG) {
        Log.d("CommonCircle $tag", "$message $keyValueMap".trim())
    }
}
