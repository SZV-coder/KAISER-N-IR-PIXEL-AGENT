package com.kaisernoir.agent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

private val NoirColors = darkColorScheme(
    primary = Color(0xFFE6E6E6),
    onPrimary = Color.Black,
    background = Color.Black,
    surface = Color(0xFF111111),
    onSurface = Color(0xFFF2F2F2),
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = NoirColors) { TwinMindScreen() }
        }
    }
}

@Composable
fun TwinMindScreen() {
    var question by remember { mutableStateOf("") }
    var options by remember { mutableStateOf("") }
    var stakes by remember { mutableStateOf("medium") }
    var loading by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<Verdict?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text("K∆iiSER NØIR BL∆CK TUX", color = Color.White, fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.headlineSmall)
        Text("Kaiser Zero × XKSÖSEVX", color = Color.Gray)

        OutlinedTextField(question, { question = it }, label = { Text("Decision") },
            modifier = Modifier.fillMaxWidth())
        OutlinedTextField(options, { options = it }, label = { Text("Options, one per line (optional)") },
            minLines = 3, modifier = Modifier.fillMaxWidth())

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("low", "medium", "high").forEach { s ->
                FilterChip(selected = stakes == s, onClick = { stakes = s }, label = { Text(s) })
            }
        }

        Button(
            enabled = !loading && question.isNotBlank(),
            onClick = {
                loading = true; error = null; result = null
                scope.launch {
                    try {
                        val opts = options.lines().map { it.trim() }.filter { it.isNotEmpty() }
                        result = TwinMindClient.decide(question.trim(), opts, stakes)
                    } catch (e: Exception) {
                        error = e.message ?: "Something went wrong"
                    } finally {
                        loading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (loading) "The twins are debating…" else "Let them debate") }

        error?.let { Text(it, color = Color(0xFFFF6B6B)) }
        result?.let { VerdictCard(it) }
    }
}

@Composable
fun VerdictCard(v: Verdict) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (v.split) "SPLIT DECISION" else "VERDICT", color = Color.Gray)
            Text(v.verdict, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
            Text("Why: ${v.why}")
            Text("Dissent: ${v.dissent}", color = Color.LightGray)
            Text("Confidence: ${v.confidence}")
            Text("Next move: ${v.nextMove}")
            Text(when { v.onDevice -> "Debated on this phone (offline)"; v.liveAi -> "Live AI · Gemini"; else -> "Cloud · practice mode" }, color = Color.Gray)
        }
    }
}
