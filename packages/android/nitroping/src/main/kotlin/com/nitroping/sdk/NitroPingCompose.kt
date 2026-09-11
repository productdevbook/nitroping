package com.nitroping.sdk

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

/** A ready-to-embed Jetpack Compose feedback form. */
@Composable
fun NitroPingFeedback(
    client: NitroPingClient,
    modifier: Modifier = Modifier,
    type: FeedbackType = FeedbackType.SUGGESTION,
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Card(modifier = modifier) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Share feedback", style = MaterialTheme.typography.headlineSmall)
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Title") },
                singleLine = true,
            )
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Description") },
                minLines = 4,
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Email (optional)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
            )
            Button(
                onClick = {
                    sending = true
                    scope.launch {
                        try {
                            client.submit(
                                Feedback(
                                    type = type,
                                    title = title.trim(),
                                    body = description.trim(),
                                    email = email.trim().ifEmpty { null },
                                ),
                            )
                            title = ""
                            description = ""
                            email = ""
                            status = "Thanks — your feedback was sent."
                        } catch (_: NitroPingQueuedException) {
                            status = "Saved locally and will retry when online."
                        } catch (_: Exception) {
                            status = "Unable to send feedback."
                        } finally {
                            sending = false
                        }
                    }
                },
                enabled = !sending && title.trim().length >= 3 && description.trim().length >= 3,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (sending) "Sending…" else "Submit feedback")
            }
            if (status.isNotEmpty()) Text(status, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
