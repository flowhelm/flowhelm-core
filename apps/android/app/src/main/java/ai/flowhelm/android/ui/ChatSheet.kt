package ai.flowhelm.android.ui

import androidx.compose.runtime.Composable
import ai.flowhelm.android.MainViewModel
import ai.flowhelm.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
