package com.nitroping.sdk

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
    var categoryId by remember { mutableStateOf("") }
    var categoryMenuOpen by remember { mutableStateOf(false) }
    var publicConfig by remember { mutableStateOf<NitroPingPublicConfig?>(null) }
    var status by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    LaunchedEffect(client) { publicConfig = runCatching { client.fetchPublicConfig() }.getOrNull() }
    val primaryColor = publicConfig?.theme?.colors?.get("primary")?.let { value ->
        try { Color(android.graphics.Color.parseColor(value)) } catch (_: IllegalArgumentException) { null }
    }
    val primaryButtonColors = primaryColor?.let { ButtonDefaults.buttonColors(containerColor = it) } ?: ButtonDefaults.buttonColors()

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
            if ((publicConfig?.theme?.fields.isNullOrEmpty() || publicConfig?.theme?.fields?.contains("category") == true) && !publicConfig?.categories.isNullOrEmpty()) {
                Box {
                    Button(onClick = { categoryMenuOpen = true }, colors = primaryButtonColors) {
                        val selected = publicConfig?.categories?.firstOrNull { it.id == categoryId }?.name
                        Text(selected ?: "Select category")
                    }
                    DropdownMenu(expanded = categoryMenuOpen, onDismissRequest = { categoryMenuOpen = false }) {
                        DropdownMenuItem(text = { Text("No category") }, onClick = { categoryId = ""; categoryMenuOpen = false })
                        publicConfig?.categories.orEmpty().forEach { category ->
                            DropdownMenuItem(text = { Text(category.name) }, onClick = { categoryId = category.id; categoryMenuOpen = false })
                        }
                    }
                }
            }
            if (publicConfig?.theme?.fields.isNullOrEmpty() || publicConfig?.theme?.fields?.contains("email") == true) {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Email (optional)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                )
            }
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
                                    categoryId = categoryId.ifEmpty { null },
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
                colors = primaryButtonColors,
            ) {
                Text(if (sending) "Sending…" else publicConfig?.theme?.buttonLabel ?: "Submit feedback")
            }
            if (status.isNotEmpty()) Text(status, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/** A scoped status screen for a user's magic-link follow-up token. */
@Composable
fun NitroPingFollowUp(
    client: NitroPingClient,
    token: String,
    modifier: Modifier = Modifier,
) {
    var snapshot by remember(token) { mutableStateOf<FollowUpSnapshot?>(null) }
    var error by remember(token) { mutableStateOf("") }
    LaunchedEffect(token) {
        try { snapshot = client.fetchFollowUp(token) }
        catch (_: Exception) { error = "This follow-up link is invalid or expired." }
    }
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (snapshot != null) {
                Text(snapshot!!.title, style = MaterialTheme.typography.headlineSmall)
                Text(snapshot!!.body)
                Text("Status: ${snapshot!!.status.replace('_', ' ')}", color = MaterialTheme.colorScheme.primary)
                Text("Replies", style = MaterialTheme.typography.titleMedium)
                if (snapshot!!.comments.isEmpty()) Text("No public replies yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                snapshot!!.comments.forEach { comment ->
                    Text(comment.body)
                    Text(comment.createdAt, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else if (error.isNotEmpty()) Text(error, color = MaterialTheme.colorScheme.error)
            else Text("Loading feedback…")
        }
    }
}
