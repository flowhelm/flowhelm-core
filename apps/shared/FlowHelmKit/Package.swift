// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "FlowHelmKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "FlowHelmProtocol", targets: ["FlowHelmProtocol"]),
        .library(name: "FlowHelmKit", targets: ["FlowHelmKit"]),
        .library(name: "FlowHelmChatUI", targets: ["FlowHelmChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "FlowHelmProtocol",
            path: "Sources/FlowHelmProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FlowHelmKit",
            dependencies: [
                "FlowHelmProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/FlowHelmKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FlowHelmChatUI",
            dependencies: [
                "FlowHelmKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/FlowHelmChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "FlowHelmKitTests",
            dependencies: ["FlowHelmKit", "FlowHelmChatUI"],
            path: "Tests/FlowHelmKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
