// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "NitroPingClient",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "NitroPingClient",
            targets: ["NitroPingClient"]),
    ],
    dependencies: [
        // Add dependencies here if needed
    ],
    targets: [
        .target(
            name: "NitroPingClient",
            dependencies: []),
        .testTarget(
            name: "NitroPingClientTests",
            dependencies: ["NitroPingClient"]),
    ]
)