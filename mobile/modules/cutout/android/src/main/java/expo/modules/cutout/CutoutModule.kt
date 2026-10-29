// Removes the background of an image. Android counterpart of ios/CutoutModule.swift.
// First ML Kit subject segmentation (needs Google Play services). Where that is missing
// (Huawei) or fails, the white around the drawing is cleared from the edges inwards:
// the prompt asks Gemini for a plain pure white background, so this works on every phone.
package expo.modules.cutout

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

/** A channel at or above this counts as background white. */
private const val WHITE = 235
/** Below this the pixel is drawing; between SOFT and WHITE it fades, so edges are not jagged. */
private const val SOFT = 200
private const val SEGMENT_TIMEOUT_S = 20L

class CutoutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Cutout")

    // Writes a PNG with a transparent background to `output`. Always cuts something,
    // so it returns true; JS keeps the white drawing only if this throws.
    AsyncFunction("cutout") { input: String, output: String ->
      val bitmap = BitmapFactory.decodeFile(pathOf(input))
        ?: throw IllegalArgumentException("Cannot read $input")
      val cut = segment(bitmap) ?: clearWhite(bitmap)
      FileOutputStream(File(pathOf(output))).use { cut.compress(Bitmap.CompressFormat.PNG, 100, it) }
      true
    }
  }

  /** ML Kit foreground, or null when Play services, the model or a subject is missing. */
  private fun segment(bitmap: Bitmap): Bitmap? {
    return try {
      val segmenter = SubjectSegmentation.getClient(
        SubjectSegmenterOptions.Builder().enableForegroundBitmap().build()
      )
      try {
        // Runs on the module's background thread, so waiting here is fine.
        Tasks.await(
          segmenter.process(InputImage.fromBitmap(bitmap, 0)), SEGMENT_TIMEOUT_S, TimeUnit.SECONDS
        ).foregroundBitmap
      } finally {
        segmenter.close()
      }
    } catch (e: Exception) {
      null
    }
  }

  /**
   * Clears the near-white pixels connected to the image edges. White inside the
   * drawing (a white shirt inside its outline) stays, because the fill cannot reach it.
   */
  private fun clearWhite(src: Bitmap): Bitmap {
    val w = src.width
    val h = src.height
    val px = IntArray(w * h)
    src.getPixels(px, 0, w, 0, 0, w, h)

    val removed = BooleanArray(w * h)
    val queue = IntArray(w * h)
    var head = 0
    var tail = 0
    fun push(i: Int) {
      if (!removed[i] && minChannel(px[i]) >= WHITE) {
        removed[i] = true
        queue[tail++] = i
      }
    }
    for (x in 0 until w) { push(x); push((h - 1) * w + x) }
    for (y in 0 until h) { push(y * w); push(y * w + w - 1) }
    while (head < tail) {
      val i = queue[head++]
      val x = i % w
      if (x > 0) push(i - 1)
      if (x < w - 1) push(i + 1)
      if (i >= w) push(i - w)
      if (i < w * (h - 1)) push(i + w)
    }

    for (i in px.indices) {
      if (removed[i]) {
        px[i] = 0
        continue
      }
      // Light pixels next to the cleared area fade with their lightness.
      val x = i % w
      val nearRemoved = (x > 0 && removed[i - 1]) || (x < w - 1 && removed[i + 1]) ||
        (i >= w && removed[i - w]) || (i < w * (h - 1) && removed[i + w])
      val light = minChannel(px[i])
      if (nearRemoved && light > SOFT) {
        val alpha = 255 * (WHITE - light).coerceAtLeast(0) / (WHITE - SOFT)
        px[i] = (alpha shl 24) or (px[i] and 0x00FFFFFF)
      }
    }
    return Bitmap.createBitmap(px, w, h, Bitmap.Config.ARGB_8888)
  }

  private fun minChannel(c: Int) = minOf((c shr 16) and 0xFF, (c shr 8) and 0xFF, c and 0xFF)

  private fun pathOf(uri: String) = Uri.parse(uri).path ?: uri
}
