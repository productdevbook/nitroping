package com.nitroping.sdk

import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** A ready-to-embed Android Views feedback form. */
class NitroPingFeedbackView(
    context: Context,
    private val client: NitroPingClient,
    private val scope: CoroutineScope = CoroutineScope(Dispatchers.Main),
) : LinearLayout(context) {
    private val titleField = EditText(context).apply { hint = "Title" }
    private val bodyField = EditText(context).apply { hint = "Description"; minLines = 4; gravity = android.view.Gravity.TOP }
    private val categoryField = Spinner(context)
    private val emailField = EditText(context).apply { hint = "Email (optional)" }
    private var categoryId = ""
    private val status = TextView(context).apply { setTextColor(Color.GRAY) }
    private val submit = Button(context).apply { text = "Submit feedback" }

    init {
        orientation = VERTICAL; setPadding(24, 24, 24, 24)
        categoryField.adapter = ArrayAdapter(context, android.R.layout.simple_spinner_dropdown_item, listOf("No category"))
        categoryField.visibility = GONE
        categoryField.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) { categoryId = "" }
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, position: Int, id: Long) { categoryId = parent?.getItemAtPosition(position)?.let { (it as? CategoryOption)?.id } ?: "" }
        }
        listOf(titleField, bodyField, categoryField, emailField, submit, status).forEach { addView(it, LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { bottomMargin = 12 }) }
        submit.setOnClickListener { send() }
        scope.launch {
            val config = runCatching { client.fetchPublicConfig() }.getOrNull()
            config?.theme?.buttonLabel?.let { submit.text = it }
            config?.theme?.colors?.get("primary")?.let { color -> runCatching { submit.setBackgroundColor(Color.parseColor(color)) } }
            if ((config?.theme?.fields.isNullOrEmpty() || config?.theme?.fields?.contains("category") == true) && !config.categories.isNullOrEmpty()) {
                val options = listOf(CategoryOption("", "No category")) + config!!.categories.map { CategoryOption(it.id, it.name) }
                categoryField.adapter = ArrayAdapter(context, android.R.layout.simple_spinner_dropdown_item, options)
                categoryField.visibility = VISIBLE
            }
        }
    }

    private fun send() {
        val title = titleField.text.toString().trim(); val body = bodyField.text.toString().trim()
        if (title.length < 3 || body.length < 3) { status.text = "Please enter a title and description."; return }
        submit.isEnabled = false
        scope.launch {
            try {
                client.submit(Feedback(FeedbackType.SUGGESTION, title, body, categoryId = categoryId.ifEmpty { null }, email = emailField.text.toString().trim().ifEmpty { null }))
                status.text = "Thanks — your feedback was sent."; titleField.text.clear(); bodyField.text.clear(); emailField.text.clear()
            } catch (_: NitroPingQueuedException) { status.text = "Saved locally and will retry when online." }
            catch (_: Exception) { status.text = "Unable to send feedback." }
            finally { submit.isEnabled = true }
        }
    }

    private data class CategoryOption(val id: String, val label: String) {
        override fun toString(): String = label
    }
}
