// Draws the Crewdex app icon (Dex's face) into an .iconset.
import Cocoa
let out = CommandLine.arguments[1]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
func rr(_ r: NSRect, _ rad: CGFloat) -> NSBezierPath { NSBezierPath(roundedRect: r, xRadius: rad, yRadius: rad) }
for (px, name) in [(16,"16x16"),(32,"16x16@2x"),(32,"32x32"),(64,"32x32@2x"),(128,"128x128"),(256,"128x128@2x"),(256,"256x256"),(512,"256x256@2x"),(512,"512x512"),(1024,"512x512@2x")] {
  let s = CGFloat(px), u = s / 100
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let bg = rr(NSRect(x: 9*u, y: 9*u, width: 82*u, height: 82*u), 19*u)
  NSGradient(colors: [NSColor(red: 1.0, green: 0.93, blue: 0.80, alpha: 1), NSColor(red: 0.98, green: 0.84, blue: 0.62, alpha: 1)])!.draw(in: bg, angle: -90)
  let ink = NSColor(red: 0.17, green: 0.145, blue: 0.133, alpha: 1)
  // antenna
  ink.setStroke(); let ant = NSBezierPath(); ant.move(to: NSPoint(x: 50*u, y: 74*u)); ant.line(to: NSPoint(x: 50*u, y: 82*u)); ant.lineWidth = 2.6*u; ant.stroke()
  NSColor(red: 0.93, green: 0.46, blue: 0.34, alpha: 1).setFill(); NSBezierPath(ovalIn: NSRect(x: 46*u, y: 80*u, width: 8*u, height: 8*u)).fill()
  // ears
  ink.setFill(); NSBezierPath(ovalIn: NSRect(x: 16*u, y: 43*u, width: 10*u, height: 10*u)).fill(); NSBezierPath(ovalIn: NSRect(x: 74*u, y: 43*u, width: 10*u, height: 10*u)).fill()
  // head
  let head = rr(NSRect(x: 21*u, y: 24*u, width: 58*u, height: 50*u), 20*u)
  NSColor.white.setFill(); head.fill(); ink.setStroke(); head.lineWidth = 2.6*u; head.stroke()
  // cap
  NSColor(red: 0.93, green: 0.71, blue: 0.24, alpha: 1).setFill()
  let cap = NSBezierPath(); cap.move(to: NSPoint(x: 28*u, y: 66*u)); cap.curve(to: NSPoint(x: 72*u, y: 66*u), controlPoint1: NSPoint(x: 40*u, y: 82*u), controlPoint2: NSPoint(x: 60*u, y: 82*u)); cap.line(to: NSPoint(x: 74*u, y: 62*u)); cap.curve(to: NSPoint(x: 26*u, y: 62*u), controlPoint1: NSPoint(x: 60*u, y: 72*u), controlPoint2: NSPoint(x: 40*u, y: 72*u)); cap.close(); cap.fill()
  // visor + eyes
  ink.setFill(); rr(NSRect(x: 29*u, y: 34*u, width: 42*u, height: 27*u), 12*u).fill()
  NSColor(red: 0.62, green: 0.95, blue: 0.82, alpha: 1).setFill()
  rr(NSRect(x: 38*u, y: 42*u, width: 8*u, height: 11*u), 4*u).fill(); rr(NSRect(x: 54*u, y: 42*u, width: 8*u, height: 11*u), 4*u).fill()
  NSColor(red: 0.90, green: 0.49, blue: 0.67, alpha: 0.6).setFill()
  NSBezierPath(ovalIn: NSRect(x: 27*u, y: 28*u, width: 9*u, height: 5*u)).fill(); NSBezierPath(ovalIn: NSRect(x: 64*u, y: 28*u, width: 9*u, height: 5*u)).fill()
  NSGraphicsContext.restoreGraphicsState()
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(out)/icon_\(name).png"))
}
