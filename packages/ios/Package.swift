// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NitroPing",
    platforms: [.iOS(.v15), .macOS(.v12)],
    products: [
        .library(name: "NitroPing", targets: ["NitroPing"]),
        .library(name: "NitroPingOpenAPIGenerated", targets: ["NitroPingOpenAPIGenerated"]),
    ],
    targets: [
        .target(name: "NitroPingOpenAPIGenerated", path: ".generated-openapi"),
        .target(name: "NitroPing", dependencies: ["NitroPingOpenAPIGenerated"]),
    ]
)
