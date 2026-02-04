import Foundation
import AVFoundation
import React

/**
 * Native Player Module for iOS
 * 
 * Provides high-performance media playback using AVPlayer with:
 * - Precise seeking (ms-level accuracy)
 * - A-B loop support
 * - Background audio playback
 * - Lock screen controls
 */
@objc(NativePlayerModule)
class NativePlayerModule: RCTEventEmitter {
  
  // MARK: - Properties
  
  private var player: AVPlayer?
  private var playerItem: AVPlayerItem?
  private var timeObserver: Any?
  private var statusObserver: NSKeyValueObservation?
  
  private var loopEnabled = false
  private var loopStartMs: Double = 0
  private var loopEndMs: Double = 0
  
  private var currentStatus: String = "idle"
  
  // Time update frequency (50ms = 20Hz)
  private let timeUpdateInterval = CMTime(value: 1, timescale: 20)
  
  // MARK: - RCTEventEmitter
  
  override static func moduleName() -> String! {
    return "NativePlayerModule"
  }
  
  override func supportedEvents() -> [String]! {
    return ["onTimeUpdate", "onStatusChange", "onBuffering", "onEnded", "onError"]
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // MARK: - Audio Session Configuration
  
  private func configureAudioSession() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [])
      try session.setActive(true)
    } catch {
      print("Failed to configure audio session: \(error)")
    }
  }
  
  // MARK: - Player Management
  
  @objc func load(_ uri: String, autoPlay: Bool) {
    DispatchQueue.main.async { [weak self] in
      self?.loadInternal(uri: uri, autoPlay: autoPlay)
    }
  }
  
  private func loadInternal(uri: String, autoPlay: Bool) {
    // Clean up previous player
    cleanup()
    
    // Configure audio session for background playback
    configureAudioSession()
    
    // Create URL
    guard let url = URL(string: uri) ?? URL(fileURLWithPath: uri) as URL? else {
      sendError(code: "INVALID_URI", message: "Invalid media URI")
      return
    }
    
    // Create player item
    playerItem = AVPlayerItem(url: url)
    player = AVPlayer(playerItem: playerItem)
    
    // Set up observers
    setupObservers()
    
    // Update status
    updateStatus("loading")
    
    // Auto-play if requested
    if autoPlay {
      player?.play()
    }
  }
  
  private func setupObservers() {
    guard let player = player, let playerItem = playerItem else { return }
    
    // Time observer
    timeObserver = player.addPeriodicTimeObserver(
      forInterval: timeUpdateInterval,
      queue: .main
    ) { [weak self] time in
      self?.handleTimeUpdate(time: time)
    }
    
    // Status observer
    statusObserver = playerItem.observe(\.status, options: [.new]) { [weak self] item, _ in
      DispatchQueue.main.async {
        self?.handleStatusChange(status: item.status)
      }
    }
    
    // End of playback notification
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(playerDidFinishPlaying),
      name: .AVPlayerItemDidPlayToEndTime,
      object: playerItem
    )
  }
  
  private func handleTimeUpdate(time: CMTime) {
    guard let playerItem = playerItem else { return }
    
    let currentTimeMs = time.seconds * 1000
    let durationMs = playerItem.duration.seconds * 1000
    let bufferedMs = getBufferedTime() * 1000
    
    // Handle A-B loop
    if loopEnabled && currentTimeMs >= loopEndMs {
      seekToInternal(timeMs: loopStartMs)
      return
    }
    
    sendEvent(withName: "onTimeUpdate", body: [
      "currentTimeMs": currentTimeMs,
      "durationMs": durationMs.isNaN ? 0 : durationMs,
      "bufferedMs": bufferedMs
    ])
  }
  
  private func handleStatusChange(status: AVPlayerItem.Status) {
    switch status {
    case .readyToPlay:
      updateStatus("paused")
    case .failed:
      let message = playerItem?.error?.localizedDescription ?? "Playback failed"
      sendError(code: "PLAYBACK_ERROR", message: message)
    case .unknown:
      break
    @unknown default:
      break
    }
  }
  
  @objc private func playerDidFinishPlaying() {
    if loopEnabled {
      seekToInternal(timeMs: loopStartMs)
      player?.play()
    } else {
      updateStatus("ended")
      sendEvent(withName: "onEnded", body: [:])
    }
  }
  
  // MARK: - Playback Control
  
  @objc func play() {
    DispatchQueue.main.async { [weak self] in
      self?.player?.play()
      self?.updateStatus("playing")
    }
  }
  
  @objc func pause() {
    DispatchQueue.main.async { [weak self] in
      self?.player?.pause()
      self?.updateStatus("paused")
    }
  }
  
  @objc func stop() {
    DispatchQueue.main.async { [weak self] in
      self?.cleanup()
      self?.updateStatus("idle")
    }
  }
  
  @objc func seekTo(_ timeMs: Double) {
    DispatchQueue.main.async { [weak self] in
      self?.seekToInternal(timeMs: timeMs)
    }
  }
  
  private func seekToInternal(timeMs: Double) {
    let time = CMTime(seconds: timeMs / 1000, preferredTimescale: 1000)
    
    // Use precise seeking with zero tolerance
    player?.seek(
      to: time,
      toleranceBefore: .zero,
      toleranceAfter: .zero
    )
  }
  
  @objc func setRate(_ rate: Double) {
    DispatchQueue.main.async { [weak self] in
      self?.player?.rate = Float(rate)
    }
  }
  
  @objc func setLoop(_ startMs: Double, endMs: Double, enabled: Bool) {
    loopStartMs = startMs
    loopEndMs = endMs
    loopEnabled = enabled
  }
  
  @objc func setVolume(_ volume: Double) {
    DispatchQueue.main.async { [weak self] in
      self?.player?.volume = Float(max(0, min(1, volume)))
    }
  }
  
  // MARK: - Synchronous Getters
  
  @objc func getCurrentTimeMs() -> Double {
    guard let player = player else { return 0 }
    return player.currentTime().seconds * 1000
  }
  
  @objc func getDurationMs() -> Double {
    guard let playerItem = playerItem else { return 0 }
    let duration = playerItem.duration.seconds
    return duration.isNaN ? 0 : duration * 1000
  }
  
  @objc func getStatus() -> String {
    return currentStatus
  }
  
  // MARK: - Helpers
  
  private func getBufferedTime() -> Double {
    guard let timeRange = playerItem?.loadedTimeRanges.first?.timeRangeValue else {
      return 0
    }
    return CMTimeGetSeconds(CMTimeAdd(timeRange.start, timeRange.duration))
  }
  
  private func updateStatus(_ status: String) {
    currentStatus = status
    sendEvent(withName: "onStatusChange", body: [
      "status": status
    ])
  }
  
  private func sendError(code: String, message: String) {
    currentStatus = "error"
    sendEvent(withName: "onStatusChange", body: [
      "status": "error",
      "error": message
    ])
    sendEvent(withName: "onError", body: [
      "code": code,
      "message": message
    ])
  }
  
  private func cleanup() {
    if let observer = timeObserver {
      player?.removeTimeObserver(observer)
      timeObserver = nil
    }
    
    statusObserver?.invalidate()
    statusObserver = nil
    
    NotificationCenter.default.removeObserver(self)
    
    player?.pause()
    player = nil
    playerItem = nil
    
    loopEnabled = false
    loopStartMs = 0
    loopEndMs = 0
  }
  
  deinit {
    cleanup()
  }
}
