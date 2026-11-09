package com.kaisernoir.agent

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * On-device twin-mind engine. A Kotlin port of api/src/verdict.js and the mock minds,
 * so the agent runs on the Pixel with no server and no network.
 */
object OnDeviceTwins {
    val DEFAULT_OPTIONS = listOf("Do it now", "Wait and learn more first", "Don't do it")
    private const val SPLIT_THRESHOLD = 25
    private val WEIGHTS = mapOf("low" to (0.4 to 0.6), "medium" to (0.5 to 0.5), "high" to (0.7 to 0.3))
    private val CAUTIOUS = Regex("wait|later|test|safe|save|soft|small|pilot|don't|skip|no", RegexOption.IGNORE_CASE)

    private data class Mind(
        val name: String,
        val scores: List<Int>,
        val argument: String,
        val strike: String,
        val vetoes: Set<Int> = emptySet(),
        val wildcard: String? = null,
    )

    private fun mock(name: String, options: List<String>, stakes: String): Mind {
        val n = options.size
        val isZero = name == "Kaiser Zero"
        val scores = options.mapIndexed { i, o ->
            val t = i.toDouble() / max(1, n - 1)
            val base = if (isZero) 40 + (t * 30).roundToInt() else 80 - (t * 30).roundToInt()
            val cautious = CAUTIOUS.containsMatchIn(o)
            val lean = if (cautious) (if (isZero) 15 else -10) else (if (isZero) -5 else 10)
            min(100, max(0, base + lean))
        }
        return if (isZero) Mind(
            name, scores,
            "Protect the downside first. The option that can be undone wins ties.",
            "Feedback from a broken experience is noise.",
            vetoes = if (stakes == "high") options.indices.filter { scores[it] < 30 }.toSet() else emptySet(),
        ) else Mind(
            name, scores,
            "Momentum compounds. Move now and learn from real feedback.",
            "So make the first move small, not slow.",
            wildcard = "Pilot \"${options.first()}\" small first",
        )
    }

    fun decide(question: String, rawOptions: List<String>, stakes: String): Verdict {
        val options = rawOptions.map { it.trim() }.filter { it.isNotEmpty() }.take(6).ifEmpty { DEFAULT_OPTIONS }
        val s = if (stakes in WEIGHTS) stakes else "medium"
        val zero = mock("Kaiser Zero", options, s)
        val xks = mock("XKSÖSEVX", options, s)
        val (wz, wx) = WEIGHTS.getValue(s)

        data class Row(val option: String, val z: Int, val x: Int, val weighted: Double, val vetoed: Boolean)
        val rows = options.mapIndexed { i, o ->
            Row(o, zero.scores[i], xks.scores[i], zero.scores[i] * wz + xks.scores[i] * wx, i in zero.vetoes)
        }
        val eligible = rows.filter { !it.vetoed }
        if (eligible.isEmpty()) return Verdict(
            "None of these. Kaiser Zero vetoed every option.",
            "Every option was judged unsafe or irreversible at high stakes.",
            "XKSÖSEVX: ${xks.argument}", "high",
            "Reframe the decision with a safer, reversible option.", false,
        )
        val ranked = eligible.sortedByDescending { it.weighted }
        val winner = ranked[0]
        val runnerUp = ranked.getOrNull(1)
        val zeroTop = eligible.maxBy { it.z }
        val xksTop = eligible.maxBy { it.x }
        val gap = abs(winner.z - winner.x)
        val split = zeroTop.option != xksTop.option && gap > SPLIT_THRESHOLD
        val margin = runnerUp?.let { winner.weighted - it.weighted } ?: 100.0
        val confidence = when {
            split -> "low"
            margin >= 20 && gap <= 15 -> "high"
            margin >= 8 -> "medium"
            else -> "low"
        }
        val leader = if (winner.z >= winner.x) zero else xks
        val loser = if (leader === zero) xks else zero
        return Verdict(
            verdict = if (split) "Split decision: Kaiser Zero picks \"${zeroTop.option}\", XKSÖSEVX picks \"${xksTop.option}\". Your call."
            else winner.option,
            why = leader.argument,
            dissent = "${loser.name}: ${loser.strike}",
            confidence = confidence,
            nextMove = if (split) "Choose a side, or try XKSÖSEVX's wildcard: ${xks.wildcard}."
            else "Take the first concrete step toward: ${winner.option}.",
            split = split,
        )
    }
}
