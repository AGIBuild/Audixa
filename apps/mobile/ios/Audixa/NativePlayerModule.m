/**
 * Objective-C Bridge for NativePlayerModule
 *
 * This file exposes the Swift NativePlayerModule to React Native.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NativePlayerModule, RCTEventEmitter)

RCT_EXTERN_METHOD(load:(NSString *)uri autoPlay:(BOOL)autoPlay)
RCT_EXTERN_METHOD(play)
RCT_EXTERN_METHOD(pause)
RCT_EXTERN_METHOD(stop)
RCT_EXTERN_METHOD(seekTo:(double)timeMs)
RCT_EXTERN_METHOD(setRate:(double)rate)
RCT_EXTERN_METHOD(setLoop:(double)startMs endMs:(double)endMs enabled:(BOOL)enabled)
RCT_EXTERN_METHOD(setVolume:(double)volume)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getCurrentTimeMs)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getDurationMs)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getStatus)

@end
