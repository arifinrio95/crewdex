// Puts an audio file under a video without re-encoding the picture.  usage: swift mux.swift <video.mp4> <audio.m4a> <out.mp4>
import AVFoundation
let a = CommandLine.arguments
let v = AVURLAsset(url: URL(fileURLWithPath: a[1])), s = AVURLAsset(url: URL(fileURLWithPath: a[2])), out = URL(fileURLWithPath: a[3])
try? FileManager.default.removeItem(at: out)
let comp = AVMutableComposition()
let vt = v.tracks(withMediaType: .video)[0], at = s.tracks(withMediaType: .audio)[0]
let range = CMTimeRange(start: .zero, duration: v.duration)
try comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!.insertTimeRange(range, of: vt, at: .zero)
try comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!.insertTimeRange(CMTimeRange(start: .zero, duration: min(v.duration, s.duration)), of: at, at: .zero)
let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetPassthrough)!
ex.outputURL = out; ex.outputFileType = .mp4; ex.shouldOptimizeForNetworkUse = true
let sem = DispatchSemaphore(value: 0); ex.exportAsynchronously { sem.signal() }; sem.wait()
print(ex.status == .completed ? "muxed \(CMTimeGetSeconds(v.duration))s" : "failed: \(String(describing: ex.error))")
