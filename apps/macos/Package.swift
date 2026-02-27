// swift-tools-version: 6.2
// Package manifest for the FlowHelm macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "FlowHelm",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "FlowHelmIPC", targets: ["FlowHelmIPC"]),
        .library(name: "FlowHelmDiscovery", targets: ["FlowHelmDiscovery"]),
        .executable(name: "FlowHelm", targets: ["FlowHelm"]),
        .executable(name: "flowhelm-mac", targets: ["FlowHelmMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/FlowHelmKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "FlowHelmIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "FlowHelmDiscovery",
            dependencies: [
                .product(name: "FlowHelmKit", package: "FlowHelmKit"),
            ],
            path: "Sources/FlowHelmDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "FlowHelm",
            dependencies: [
                "FlowHelmIPC",
                "FlowHelmDiscovery",
                .product(name: "FlowHelmKit", package: "FlowHelmKit"),
                .product(name: "FlowHelmChatUI", package: "FlowHelmKit"),
                .product(name: "FlowHelmProtocol", package: "FlowHelmKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/FlowHelm.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "FlowHelmMacCLI",
            dependencies: [
                "FlowHelmDiscovery",
                .product(name: "FlowHelmKit", package: "FlowHelmKit"),
                .product(name: "FlowHelmProtocol", package: "FlowHelmKit"),
            ],
            path: "Sources/FlowHelmMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "FlowHelmIPCTests",
            dependencies: [
                "FlowHelmIPC",
                "FlowHelm",
                "FlowHelmDiscovery",
                .product(name: "FlowHelmProtocol", package: "FlowHelmKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
