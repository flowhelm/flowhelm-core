import Foundation

public enum FlowHelmRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum FlowHelmReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct FlowHelmRemindersListParams: Codable, Sendable, Equatable {
    public var status: FlowHelmReminderStatusFilter?
    public var limit: Int?

    public init(status: FlowHelmReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct FlowHelmRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct FlowHelmReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct FlowHelmRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [FlowHelmReminderPayload]

    public init(reminders: [FlowHelmReminderPayload]) {
        self.reminders = reminders
    }
}

public struct FlowHelmRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: FlowHelmReminderPayload

    public init(reminder: FlowHelmReminderPayload) {
        self.reminder = reminder
    }
}
