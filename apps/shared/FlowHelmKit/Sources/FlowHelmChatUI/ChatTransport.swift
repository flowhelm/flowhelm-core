import Foundation

public enum FlowHelmChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(FlowHelmChatEventPayload)
    case agent(FlowHelmAgentEventPayload)
    case seqGap
}

public protocol FlowHelmChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> FlowHelmChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [FlowHelmChatAttachmentPayload]) async throws -> FlowHelmChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> FlowHelmChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<FlowHelmChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension FlowHelmChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "FlowHelmChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> FlowHelmChatSessionsListResponse {
        throw NSError(
            domain: "FlowHelmChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
