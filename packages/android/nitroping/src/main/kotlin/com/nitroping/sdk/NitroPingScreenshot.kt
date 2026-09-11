package com.nitroping.sdk

import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import java.io.ByteArrayOutputStream

/** Captures a rendered Android View as a PNG attachment for feedback submissions. */
object NitroPingScreenshot {
    fun attachment(view: View): NitroPingAttachment? {
        if (view.width <= 0 || view.height <= 0) return null
        val bitmap = Bitmap.createBitmap(view.width, view.height, Bitmap.Config.ARGB_8888)
        return try {
            view.draw(Canvas(bitmap))
            val output = ByteArrayOutputStream()
            if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)) return null
            NitroPingAttachment(output.toByteArray(), "image/png")
        } finally {
            bitmap.recycle()
        }
    }
}
