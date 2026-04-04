import groq, { getGroqModel } from '../../config/groq.js'

/**
 * Generate a natural human-like AI interviewer response.
 *
 * cases:
 *   'silence'   – candidate said nothing for 7 seconds
 *   'unclear'   – answer was too short / incoherent, ask to elaborate (max 2 times)
 *   'good'      – answer was solid, acknowledge warmly before moving on
 */
export const generateAIResponse = async ({ question, answer, case: caseType, repeatCount = 0, role, roundType }) => {
  const systemPrompt = `You are Alex, a warm and professional human interviewer conducting a ${roundType} interview for a ${role} position.
Speak naturally, like a real person — use contractions, vary sentence length, and sound genuinely engaged.
Keep responses SHORT (1-3 sentences max). Never sound robotic or formal.
Do NOT repeat the question verbatim unless absolutely needed.
Do NOT say "Great question" or "Certainly" or use filler corporate phrases.`

  let userPrompt = ''

  if (caseType === 'silence') {
    userPrompt = `The candidate has been silent for several seconds after being asked: "${question}"
Generate a gentle, natural nudge to encourage them to start answering. Sound human and patient, not robotic.
Options: check if they need clarification, offer to rephrase, or just encourage them warmly.
Return ONLY the spoken response text, nothing else.`

  } else if (caseType === 'unclear') {
    const repeatNote = repeatCount >= 1 ? ' This is the second time you are asking for clarification, so be a bit more direct.' : ''
    userPrompt = `The candidate answered: "${answer}"
Their answer to "${question}" was unclear, too brief, or didn't address the question.${repeatNote}
Ask them to elaborate or clarify naturally, like a real interviewer would. Be encouraging, not critical.
Return ONLY the spoken response text, nothing else.`

  } else if (caseType === 'good') {
    userPrompt = `The candidate answered: "${answer}"
Their answer to "${question}" was solid and relevant.
Give a brief, natural acknowledgment (1-2 sentences) that sounds genuinely human — like "That makes sense" or "Yeah, that's a good approach".
Vary your responses, don't always start the same way. Then naturally transition to the next question without stating it.
Return ONLY the spoken acknowledgment text, nothing else.`
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: getGroqModel(),
      temperature: 0.85,
      max_tokens: 120,
    })
    const text = (completion.choices[0]?.message?.content || '').trim()
    // strip quotes if model wrapped in them
    return text.replace(/^["']|["']$/g, '').trim()
  } catch (err) {
    // fallback phrases so interview never breaks
    const fallbacks = {
      silence: "Take your time, there's no rush — just share whatever comes to mind.",
      unclear: "Could you expand on that a bit more? I'd love to hear more detail.",
      good: "That's a solid answer, thanks for that.",
    }
    return fallbacks[caseType] || "Okay, let's keep going."
  }
}