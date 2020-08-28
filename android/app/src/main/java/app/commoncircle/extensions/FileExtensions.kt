package app.CommonCircle.extensions

import java.io.File

fun File.cleanup() {
    try {
        deleteOnExit()
    } catch (_: Exception) {
    }
}
