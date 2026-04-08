package uz.savdoai.scanner

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

/**
 * SavdoAI — Barcode/QR Scanner
 *
 * Google MLKit bilan real-time barcode/QR scan.
 * SD Agent barcode_scan + Smartup barcode analog.
 *
 * Qo'llab-quvvatlangan formatlar:
 * - EAN-13, EAN-8 (O'zbekiston tovar barcode)
 * - UPC-A, UPC-E
 * - Code 128, Code 39
 * - QR Code
 * - Data Matrix
 */
class BarcodeScanner(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
    private val previewView: PreviewView,
    private val onBarcodeDetected: (String, String) -> Unit, // (value, format)
    private val onError: (String) -> Unit = {}
) {
    companion object {
        private const val TAG = "SavdoAI_Scanner"
    }

    private val cameraExecutor = Executors.newSingleThreadExecutor()
    private val scanner = BarcodeScanning.getClient()
    private var isScanning = true

    fun start() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            onError("Kamera ruxsati yo'q")
            return
        }

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()
                bindCamera(cameraProvider)
            } catch (e: Exception) {
                Log.e(TAG, "Kamera xato: ${e.message}")
                onError("Kamera ishga tushmadi: ${e.message}")
            }
        }, ContextCompat.getMainExecutor(context))
    }

    private fun bindCamera(cameraProvider: ProcessCameraProvider) {
        val preview = Preview.Builder().build().also {
            it.surfaceProvider = previewView.surfaceProvider
        }

        val imageAnalyzer = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { analysis ->
                analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    processImage(imageProxy)
                }
            }

        try {
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                CameraSelector.DEFAULT_BACK_CAMERA,
                preview,
                imageAnalyzer
            )
        } catch (e: Exception) {
            Log.e(TAG, "Camera bind xato: ${e.message}")
        }
    }

    @androidx.annotation.OptIn(ExperimentalGetImage::class)
    private fun processImage(imageProxy: ImageProxy) {
        if (!isScanning) {
            imageProxy.close()
            return
        }

        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)

            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    for (barcode in barcodes) {
                        barcode.rawValue?.let { value ->
                            isScanning = false // Bir marta aniqlash
                            val format = when (barcode.format) {
                                Barcode.FORMAT_EAN_13 -> "EAN-13"
                                Barcode.FORMAT_EAN_8 -> "EAN-8"
                                Barcode.FORMAT_UPC_A -> "UPC-A"
                                Barcode.FORMAT_QR_CODE -> "QR"
                                Barcode.FORMAT_CODE_128 -> "Code128"
                                Barcode.FORMAT_CODE_39 -> "Code39"
                                else -> "Unknown"
                            }
                            Log.d(TAG, "Barcode: $value ($format)")
                            onBarcodeDetected(value, format)
                        }
                    }
                }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    fun resume() { isScanning = true }

    fun stop() {
        isScanning = false
        cameraExecutor.shutdown()
    }
}
