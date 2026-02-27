package ai.flowhelm.android.node

import android.os.Build
import ai.flowhelm.android.BuildConfig
import ai.flowhelm.android.SecurePrefs
import ai.flowhelm.android.gateway.GatewayClientInfo
import ai.flowhelm.android.gateway.GatewayConnectOptions
import ai.flowhelm.android.gateway.GatewayEndpoint
import ai.flowhelm.android.gateway.GatewayTlsParams
import ai.flowhelm.android.protocol.FlowHelmCanvasA2UICommand
import ai.flowhelm.android.protocol.FlowHelmCanvasCommand
import ai.flowhelm.android.protocol.FlowHelmCameraCommand
import ai.flowhelm.android.protocol.FlowHelmLocationCommand
import ai.flowhelm.android.protocol.FlowHelmScreenCommand
import ai.flowhelm.android.protocol.FlowHelmSmsCommand
import ai.flowhelm.android.protocol.FlowHelmCapability
import ai.flowhelm.android.LocationMode
import ai.flowhelm.android.VoiceWakeMode

class ConnectionManager(
  private val prefs: SecurePrefs,
  private val cameraEnabled: () -> Boolean,
  private val locationMode: () -> LocationMode,
  private val voiceWakeMode: () -> VoiceWakeMode,
  private val smsAvailable: () -> Boolean,
  private val hasRecordAudioPermission: () -> Boolean,
  private val manualTls: () -> Boolean,
) {
  companion object {
    internal fun resolveTlsParamsForEndpoint(
      endpoint: GatewayEndpoint,
      storedFingerprint: String?,
      manualTlsEnabled: Boolean,
    ): GatewayTlsParams? {
      val stableId = endpoint.stableId
      val stored = storedFingerprint?.trim().takeIf { !it.isNullOrEmpty() }
      val isManual = stableId.startsWith("manual|")

      if (isManual) {
        if (!manualTlsEnabled) return null
        if (!stored.isNullOrBlank()) {
          return GatewayTlsParams(
            required = true,
            expectedFingerprint = stored,
            allowTOFU = false,
            stableId = stableId,
          )
        }
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = null,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      // Prefer stored pins. Never let discovery-provided TXT override a stored fingerprint.
      if (!stored.isNullOrBlank()) {
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = stored,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      val hinted = endpoint.tlsEnabled || !endpoint.tlsFingerprintSha256.isNullOrBlank()
      if (hinted) {
        // TXT is unauthenticated. Do not treat the advertised fingerprint as authoritative.
        return GatewayTlsParams(
          required = true,
          expectedFingerprint = null,
          allowTOFU = false,
          stableId = stableId,
        )
      }

      return null
    }
  }

  fun buildInvokeCommands(): List<String> =
    buildList {
      add(FlowHelmCanvasCommand.Present.rawValue)
      add(FlowHelmCanvasCommand.Hide.rawValue)
      add(FlowHelmCanvasCommand.Navigate.rawValue)
      add(FlowHelmCanvasCommand.Eval.rawValue)
      add(FlowHelmCanvasCommand.Snapshot.rawValue)
      add(FlowHelmCanvasA2UICommand.Push.rawValue)
      add(FlowHelmCanvasA2UICommand.PushJSONL.rawValue)
      add(FlowHelmCanvasA2UICommand.Reset.rawValue)
      add(FlowHelmScreenCommand.Record.rawValue)
      if (cameraEnabled()) {
        add(FlowHelmCameraCommand.Snap.rawValue)
        add(FlowHelmCameraCommand.Clip.rawValue)
      }
      if (locationMode() != LocationMode.Off) {
        add(FlowHelmLocationCommand.Get.rawValue)
      }
      if (smsAvailable()) {
        add(FlowHelmSmsCommand.Send.rawValue)
      }
      if (BuildConfig.DEBUG) {
        add("debug.logs")
        add("debug.ed25519")
      }
      add("app.update")
    }

  fun buildCapabilities(): List<String> =
    buildList {
      add(FlowHelmCapability.Canvas.rawValue)
      add(FlowHelmCapability.Screen.rawValue)
      if (cameraEnabled()) add(FlowHelmCapability.Camera.rawValue)
      if (smsAvailable()) add(FlowHelmCapability.Sms.rawValue)
      if (voiceWakeMode() != VoiceWakeMode.Off && hasRecordAudioPermission()) {
        add(FlowHelmCapability.VoiceWake.rawValue)
      }
      if (locationMode() != LocationMode.Off) {
        add(FlowHelmCapability.Location.rawValue)
      }
    }

  fun resolvedVersionName(): String {
    val versionName = BuildConfig.VERSION_NAME.trim().ifEmpty { "dev" }
    return if (BuildConfig.DEBUG && !versionName.contains("dev", ignoreCase = true)) {
      "$versionName-dev"
    } else {
      versionName
    }
  }

  fun resolveModelIdentifier(): String? {
    return listOfNotNull(Build.MANUFACTURER, Build.MODEL)
      .joinToString(" ")
      .trim()
      .ifEmpty { null }
  }

  fun buildUserAgent(): String {
    val version = resolvedVersionName()
    val release = Build.VERSION.RELEASE?.trim().orEmpty()
    val releaseLabel = if (release.isEmpty()) "unknown" else release
    return "FlowHelmAndroid/$version (Android $releaseLabel; SDK ${Build.VERSION.SDK_INT})"
  }

  fun buildClientInfo(clientId: String, clientMode: String): GatewayClientInfo {
    return GatewayClientInfo(
      id = clientId,
      displayName = prefs.displayName.value,
      version = resolvedVersionName(),
      platform = "android",
      mode = clientMode,
      instanceId = prefs.instanceId.value,
      deviceFamily = "Android",
      modelIdentifier = resolveModelIdentifier(),
    )
  }

  fun buildNodeConnectOptions(): GatewayConnectOptions {
    return GatewayConnectOptions(
      role = "node",
      scopes = emptyList(),
      caps = buildCapabilities(),
      commands = buildInvokeCommands(),
      permissions = emptyMap(),
      client = buildClientInfo(clientId = "flowhelm-android", clientMode = "node"),
      userAgent = buildUserAgent(),
    )
  }

  fun buildOperatorConnectOptions(): GatewayConnectOptions {
    return GatewayConnectOptions(
      role = "operator",
      scopes = listOf("operator.read", "operator.write", "operator.talk.secrets"),
      caps = emptyList(),
      commands = emptyList(),
      permissions = emptyMap(),
      client = buildClientInfo(clientId = "flowhelm-android", clientMode = "ui"),
      userAgent = buildUserAgent(),
    )
  }

  fun resolveTlsParams(endpoint: GatewayEndpoint): GatewayTlsParams? {
    val stored = prefs.loadGatewayTlsFingerprint(endpoint.stableId)
    return resolveTlsParamsForEndpoint(endpoint, storedFingerprint = stored, manualTlsEnabled = manualTls())
  }
}
