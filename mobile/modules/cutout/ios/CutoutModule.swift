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
      guard let cg = CIContext().createCGImage(masked, from: masked.extent),
        let dest = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil)
      else { throw CutoutError("Cannot write \(output.path)") }
      CGImageDestinationAddImage(dest, cg, nil)
      guard CGImageDestinationFinalize(dest) else { throw CutoutError("Cannot write \(output.path)") }
      return true
    }
  }
}

struct CutoutError: Error, CustomStringConvertible {
  let description: String
  init(_ description: String) { self.description = description }
}
