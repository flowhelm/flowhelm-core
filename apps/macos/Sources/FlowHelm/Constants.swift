import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-flowhelm writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.flowhelm.mac"
let gatewayLaunchdLabel = "ai.flowhelm.gateway"
let onboardingVersionKey = "flowhelm.onboardingVersion"
let onboardingSeenKey = "flowhelm.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "flowhelm.pauseEnabled"
let iconAnimationsEnabledKey = "flowhelm.iconAnimationsEnabled"
let swabbleEnabledKey = "flowhelm.swabbleEnabled"
let swabbleTriggersKey = "flowhelm.swabbleTriggers"
let voiceWakeTriggerChimeKey = "flowhelm.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "flowhelm.voiceWakeSendChime"
let showDockIconKey = "flowhelm.showDockIcon"
let defaultVoiceWakeTriggers = ["flowhelm"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "flowhelm.voiceWakeMicID"
let voiceWakeMicNameKey = "flowhelm.voiceWakeMicName"
let voiceWakeLocaleKey = "flowhelm.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "flowhelm.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "flowhelm.voicePushToTalkEnabled"
let talkEnabledKey = "flowhelm.talkEnabled"
let iconOverrideKey = "flowhelm.iconOverride"
let connectionModeKey = "flowhelm.connectionMode"
let remoteTargetKey = "flowhelm.remoteTarget"
let remoteIdentityKey = "flowhelm.remoteIdentity"
let remoteProjectRootKey = "flowhelm.remoteProjectRoot"
let remoteCliPathKey = "flowhelm.remoteCliPath"
let canvasEnabledKey = "flowhelm.canvasEnabled"
let cameraEnabledKey = "flowhelm.cameraEnabled"
let systemRunPolicyKey = "flowhelm.systemRunPolicy"
let systemRunAllowlistKey = "flowhelm.systemRunAllowlist"
let systemRunEnabledKey = "flowhelm.systemRunEnabled"
let locationModeKey = "flowhelm.locationMode"
let locationPreciseKey = "flowhelm.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "flowhelm.peekabooBridgeEnabled"
let deepLinkKeyKey = "flowhelm.deepLinkKey"
let modelCatalogPathKey = "flowhelm.modelCatalogPath"
let modelCatalogReloadKey = "flowhelm.modelCatalogReload"
let cliInstallPromptedVersionKey = "flowhelm.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "flowhelm.heartbeatsEnabled"
let debugPaneEnabledKey = "flowhelm.debugPaneEnabled"
let debugFileLogEnabledKey = "flowhelm.debug.fileLogEnabled"
let appLogLevelKey = "flowhelm.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
