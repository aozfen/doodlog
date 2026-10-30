// Removes the background of an image with Apple's Vision "lift subject" mask (iOS 17+).
// Same as test/scripts/cutout.swift, which the drawing prompt was tuned with.
import CoreImage
import ExpoModulesCore
import ImageIO
import UniformTypeIdentifiers
import Vision

public class CutoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Cutout")

    // Writes a PNG with a transparent background to `output`. Returns false when
    // there is nothing to cut (older iOS, no subject found); `output` is then not written.
    AsyncFunction("cutout") { (input: URL, output: URL) -> Bool in
      guard #available(iOS 17.0, *) else { return false }
      guard let image = CIImage(contentsOf: input) else { throw CutoutError("Cannot read \(input.path)") }
      let request = VNGenerateForegroundInstanceMaskRequest()
      let handler = VNImageRequestHandler(ciImage: image)
      try handler.perform([request])
      guard let result = request.results?.first, !result.allInstances.isEmpty else { return false }
      // Keep every subject (people, pets, objects) together, in the full frame.
      let buffer = try result.generateMaskedImage(
        ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
      let masked = CIImage(cvPixelBuffer: buffer)
      guard let cut = CIContext().createCGImage(masked, from: masked.extent),
        let cg = clearWhiteEdge(cut),
        let dest = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)
      else { throw CutoutError("Cannot write \(output.path)") }
      CGImageDestinationAddImage(dest, cg, nil)
      guard CGImageDestinationFinalize(dest) else { throw CutoutError("Cannot write \(output.path)") }
      return true
    }
  }
}

// The drawing is on white paper. Vision sometimes keeps white paper next to a figure, for
// example inside faint sketch lines around it, and the sticker gets a white halo.
// This clears near-white pixels that touch the transparent background, step by step inward.
// A dark crayon outline stops it, so white clothes inside the outline stay. The depth is
// capped, so a gap in an outline can only cost a thin strip.
private let whiteMin = 236 // every channel at least this (0-255) counts as paper
private let maxDepthShare = 0.04 // of the long side

private func clearWhiteEdge(_ image: CGImage) -> CGImage? {
  let width = image.width, height = image.height
  let bytesPerRow = width * 4
  var pixels = [UInt8](repeating: 0, count: bytesPerRow * height)
  guard
    let ctx = CGContext(
      data: &pixels, width: width, height: height, bitsPerComponent: 8, bytesPerRow: bytesPerRow,
      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
  else { return nil }
  ctx.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

  let count = width * height
  // Premultiplied: a pixel is paper when each channel is near its alpha.
  func isPaper(_ i: Int) -> Bool {
    let o = i * 4, a = Int(pixels[o + 3])
    if a == 0 { return false }
    let min = a * whiteMin / 255
    return Int(pixels[o]) >= min && Int(pixels[o + 1]) >= min && Int(pixels[o + 2]) >= min
  }
  var cleared = [Bool](repeating: false, count: count)
  var front: [Int] = []
  for i in 0..<count where pixels[i * 4 + 3] == 0 { cleared[i] = true; front.append(i) }

  let maxDepth = max(1, Int(Double(max(width, height)) * maxDepthShare))
  var depth = 0
  while !front.isEmpty && depth < maxDepth {
    var next: [Int] = []
    for i in front {
      let x = i % width, y = i / width
      for (nx, ny) in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
      where nx >= 0 && ny >= 0 && nx < width && ny < height {
        let n = ny * width + nx
        if cleared[n] || !isPaper(n) { continue }
        cleared[n] = true
        let o = n * 4
        pixels[o] = 0; pixels[o + 1] = 0; pixels[o + 2] = 0; pixels[o + 3] = 0
        next.append(n)
      }
    }
    front = next
    depth += 1
  }
  return ctx.makeImage()
}

struct CutoutError: Error, CustomStringConvertible {
  let description: String
  init(_ description: String) { self.description = description }
}
