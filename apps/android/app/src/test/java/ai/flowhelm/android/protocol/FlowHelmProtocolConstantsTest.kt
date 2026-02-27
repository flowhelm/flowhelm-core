package ai.flowhelm.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class FlowHelmProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", FlowHelmCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", FlowHelmCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", FlowHelmCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", FlowHelmCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", FlowHelmCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", FlowHelmCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", FlowHelmCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", FlowHelmCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", FlowHelmCapability.Canvas.rawValue)
    assertEquals("camera", FlowHelmCapability.Camera.rawValue)
    assertEquals("screen", FlowHelmCapability.Screen.rawValue)
    assertEquals("voiceWake", FlowHelmCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", FlowHelmScreenCommand.Record.rawValue)
  }
}
