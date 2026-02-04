package com.audixa

import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.SeekParameters
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native Player Module for Android
 *
 * Provides high-performance media playback using ExoPlayer (Media3) with:
 * - Precise seeking (ms-level accuracy)
 * - A-B loop support
 * - Background audio playback
 * - Media session integration
 */
class NativePlayerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var player: ExoPlayer? = null
    private var handler: Handler? = null
    private var timeUpdateRunnable: Runnable? = null

    private var loopEnabled = false
    private var loopStartMs: Long = 0
    private var loopEndMs: Long = 0

    private var currentStatus = "idle"

    // Time update frequency (50ms = 20Hz)
    private val timeUpdateIntervalMs = 50L

    override fun getName(): String = "NativePlayerModule"

    override fun initialize() {
        super.initialize()
        reactContext.addLifecycleEventListener(this)
        handler = Handler(Looper.getMainLooper())
    }

    // MARK: - Player Management

    @ReactMethod
    fun load(uri: String, autoPlay: Boolean) {
        handler?.post {
            loadInternal(uri, autoPlay)
        }
    }

    private fun loadInternal(uri: String, autoPlay: Boolean) {
        // Clean up previous player
        cleanup()

        // Create ExoPlayer with precise seeking
        player = ExoPlayer.Builder(reactContext)
            .setSeekParameters(SeekParameters.EXACT)
            .build()
            .apply {
                // Set up event listener
                addListener(playerListener)

                // Create and set media item
                val mediaItem = MediaItem.fromUri(Uri.parse(uri))
                setMediaItem(mediaItem)

                // Prepare and optionally play
                prepare()
                playWhenReady = autoPlay
            }

        // Start time updates
        startTimeUpdates()

        updateStatus("loading")
    }

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_READY -> {
                    if (player?.isPlaying == true) {
                        updateStatus("playing")
                    } else {
                        updateStatus("paused")
                    }
                }
                Player.STATE_ENDED -> {
                    if (loopEnabled) {
                        seekToInternal(loopStartMs)
                        player?.play()
                    } else {
                        updateStatus("ended")
                        sendEvent("onEnded", Arguments.createMap())
                    }
                }
                Player.STATE_BUFFERING -> {
                    sendEvent("onBuffering", Arguments.createMap().apply {
                        putBoolean("isBuffering", true)
                    })
                }
                Player.STATE_IDLE -> {}
            }
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
            if (player?.playbackState == Player.STATE_READY) {
                updateStatus(if (isPlaying) "playing" else "paused")
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            sendError(
                code = error.errorCode.toString(),
                message = error.message ?: "Playback error"
            )
        }
    }

    private fun startTimeUpdates() {
        timeUpdateRunnable = object : Runnable {
            override fun run() {
                sendTimeUpdate()
                handler?.postDelayed(this, timeUpdateIntervalMs)
            }
        }
        handler?.post(timeUpdateRunnable!!)
    }

    private fun stopTimeUpdates() {
        timeUpdateRunnable?.let { handler?.removeCallbacks(it) }
        timeUpdateRunnable = null
    }

    private fun sendTimeUpdate() {
        val player = player ?: return

        val currentTimeMs = player.currentPosition
        val durationMs = player.duration.takeIf { it > 0 } ?: 0L
        val bufferedMs = player.bufferedPosition

        // Handle A-B loop
        if (loopEnabled && currentTimeMs >= loopEndMs) {
            seekToInternal(loopStartMs)
            return
        }

        sendEvent("onTimeUpdate", Arguments.createMap().apply {
            putDouble("currentTimeMs", currentTimeMs.toDouble())
            putDouble("durationMs", durationMs.toDouble())
            putDouble("bufferedMs", bufferedMs.toDouble())
        })
    }

    // MARK: - Playback Control

    @ReactMethod
    fun play() {
        handler?.post {
            player?.play()
        }
    }

    @ReactMethod
    fun pause() {
        handler?.post {
            player?.pause()
        }
    }

    @ReactMethod
    fun stop() {
        handler?.post {
            cleanup()
            updateStatus("idle")
        }
    }

    @ReactMethod
    fun seekTo(timeMs: Double) {
        handler?.post {
            seekToInternal(timeMs.toLong())
        }
    }

    private fun seekToInternal(timeMs: Long) {
        player?.seekTo(timeMs)
    }

    @ReactMethod
    fun setRate(rate: Double) {
        handler?.post {
            player?.setPlaybackSpeed(rate.toFloat())
        }
    }

    @ReactMethod
    fun setLoop(startMs: Double, endMs: Double, enabled: Boolean) {
        loopStartMs = startMs.toLong()
        loopEndMs = endMs.toLong()
        loopEnabled = enabled
    }

    @ReactMethod
    fun setVolume(volume: Double) {
        handler?.post {
            player?.volume = volume.toFloat().coerceIn(0f, 1f)
        }
    }

    // MARK: - Synchronous Getters

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getCurrentTimeMs(): Double {
        return player?.currentPosition?.toDouble() ?: 0.0
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getDurationMs(): Double {
        val duration = player?.duration ?: 0L
        return if (duration > 0) duration.toDouble() else 0.0
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getStatus(): String {
        return currentStatus
    }

    // MARK: - Event Emission

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun updateStatus(status: String) {
        currentStatus = status
        sendEvent("onStatusChange", Arguments.createMap().apply {
            putString("status", status)
        })
    }

    private fun sendError(code: String, message: String) {
        currentStatus = "error"
        sendEvent("onStatusChange", Arguments.createMap().apply {
            putString("status", "error")
            putString("error", message)
        })
        sendEvent("onError", Arguments.createMap().apply {
            putString("code", code)
            putString("message", message)
        })
    }

    // MARK: - Lifecycle

    override fun onHostResume() {}

    override fun onHostPause() {}

    override fun onHostDestroy() {
        cleanup()
    }

    private fun cleanup() {
        stopTimeUpdates()
        player?.removeListener(playerListener)
        player?.release()
        player = null
        loopEnabled = false
        loopStartMs = 0
        loopEndMs = 0
    }

    // Required for event emitter
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
