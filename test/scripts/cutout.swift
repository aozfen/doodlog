// Remove the background of an image with Apple's Vision "lift subject" mask.
// Usage: swift test/scripts/cutout.swift in.png out.png
// Writes a PNG with transparent background. Same API is available on iOS 17+.
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: cutout in.png out.png"); exit(2) }
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])

guard let input = CIImage(contentsOf: inURL) else { print("cannot read \(inURL.path)"); exit(1) }
let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: input)
do { try handler.perform([request]) } catch { print("vision error: \(error)"); exit(1) }
guard let result = request.results?.first, !result.allInstances.isEmpty else {
    print("no subject found"); exit(3)
}
// Keep every detected subject (people, pets, objects) together.
let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let output = CIImage(cvPixelBuffer: buffer)
let ctx = CIContext()
guard let cg = ctx.createCGImage(output, from: output.extent),
      let dest = CGImageDestinationCreateWithURL(outURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    print("cannot write"); exit(1)
}
CGImageDestinationAddImage(dest, cg, nil)
CGImageDestinationFinalize(dest)
print("ok \(result.allInstances.count) subject(s)")
