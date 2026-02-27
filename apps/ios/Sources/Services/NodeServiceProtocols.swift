import CoreLocation
import Foundation
import FlowHelmKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: FlowHelmCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: FlowHelmCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: FlowHelmLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: FlowHelmLocationGetParams,
        desiredAccuracy: FlowHelmLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: FlowHelmLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> FlowHelmDeviceStatusPayload
    func info() -> FlowHelmDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: FlowHelmPhotosLatestParams) async throws -> FlowHelmPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: FlowHelmContactsSearchParams) async throws -> FlowHelmContactsSearchPayload
    func add(params: FlowHelmContactsAddParams) async throws -> FlowHelmContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: FlowHelmCalendarEventsParams) async throws -> FlowHelmCalendarEventsPayload
    func add(params: FlowHelmCalendarAddParams) async throws -> FlowHelmCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: FlowHelmRemindersListParams) async throws -> FlowHelmRemindersListPayload
    func add(params: FlowHelmRemindersAddParams) async throws -> FlowHelmRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: FlowHelmMotionActivityParams) async throws -> FlowHelmMotionActivityPayload
    func pedometer(params: FlowHelmPedometerParams) async throws -> FlowHelmPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: FlowHelmWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
