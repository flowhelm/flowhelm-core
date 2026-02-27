import Foundation

public enum FlowHelmCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum FlowHelmCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum FlowHelmCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum FlowHelmCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct FlowHelmCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: FlowHelmCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: FlowHelmCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: FlowHelmCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: FlowHelmCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct FlowHelmCameraClipParams: Codable, Sendable, Equatable {
    public var facing: FlowHelmCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: FlowHelmCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: FlowHelmCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: FlowHelmCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
