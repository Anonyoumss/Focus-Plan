// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "FocusPlan",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "FocusPlan",
            path: "Sources/FocusPlan"
        )
    ]
)
