import type { SessionMode } from '../../shared/types/index.js';

/**
 * Get the system prompt for communication analysis based on mode
 */
export function getCommunicationAnalysisPrompt(mode: SessionMode): string {
  const basePrompt = `You are an expert English communication coach specializing in helping non-native speakers sound more professional and natural.

Your role is to provide constructive, actionable feedback that helps users improve their spoken English.

Guidelines:
- Be encouraging but honest
- Focus on 2-3 most impactful improvements, not everything
- Make suggestions specific and actionable
- Consider American workplace communication norms (direct, concise, structured)
- The polished version should feel achievable, not dramatically different
- Identify strengths to build confidence`;

  const modeSpecificPrompts: Record<SessionMode, string> = {
    professional: `${basePrompt}

For PROFESSIONAL communication, focus on:
- Clarity and conciseness
- Logical structure (problem → solution → outcome)
- Confident tone without hedging
- Professional vocabulary choices
- Reducing filler words and hedging language
- Leading with the main point`,

    casual: `${basePrompt}

For CASUAL conversation, focus on:
- Natural, flowing speech
- Conversational expressions and idioms
- Appropriate informality
- Storytelling flow
- Engagement and relatability
- Don't over-correct - casual speech has different norms`,

    free_talk: `${basePrompt}

For FREE TALK, provide balanced feedback on:
- Overall clarity and naturalness
- Grammar and phrasing
- Speaking pace and flow
- Any notable pronunciation patterns
- Be flexible - topic could be anything`,

    read_aloud: `${basePrompt}

For READ ALOUD practice:
- Focus primarily on pronunciation clarity
- Note any words that were difficult
- Comment on pacing and rhythm
- Less focus on content/structure (they're reading given text)`,

    read_practice: `${basePrompt}

For READ PRACTICE mode:
- Focus primarily on pronunciation accuracy
- Note any mispronounced words
- Comment on clarity and articulation
- Skip OpenAI analysis - handled by pronunciation scoring`,
  };

  return modeSpecificPrompts[mode];
}

/**
 * Get the user prompt for analysis
 */
export function getAnalysisUserPrompt(
  transcript: string,
  context: {
    mode: SessionMode;
    promptText?: string;
    nativeLanguage?: string;
    profession?: string;
  }
): string {
  let contextInfo = `MODE: ${context.mode}`;

  if (context.promptText) {
    contextInfo += `\nPROMPT THEY WERE RESPONDING TO: "${context.promptText}"`;
  }

  if (context.nativeLanguage) {
    contextInfo += `\nNATIVE LANGUAGE: ${context.nativeLanguage}`;
  }

  if (context.profession) {
    contextInfo += `\nPROFESSION: ${context.profession}`;
  }

  return `Analyze the following spoken transcript and provide feedback.

${contextInfo}

TRANSCRIPT:
"""
${transcript}
"""

Respond with a JSON object in this exact format:
{
  "filler_words": {
    "total": <number>,
    "breakdown": {"um": <count>, "uh": <count>, ...}
  },
  "pace": {
    "wpm": <estimated words per minute>,
    "assessment": "too_slow" | "good" | "slightly_fast" | "too_fast",
    "suggestion": "<optional suggestion>"
  },
  "grammar_issues": [
    {
      "original": "<exact phrase>",
      "corrected": "<improved version>",
      "type": "<issue type: tense/article/preposition/etc>",
      "explanation": "<brief explanation>"
    }
  ],
  "structure": {
    "score": <0-100>,
    "feedback": "<main structural observation>"
  },
  "polished_version": "<rewritten version that sounds professional and natural, similar length>",
  "coaching_tip": "<ONE specific, actionable tip for next time>",
  "strengths": ["<strength 1>", "<strength 2>"]
}

Important:
- Only include grammar_issues if there are actual issues (can be empty array)
- The polished_version should preserve the speaker's meaning
- The coaching_tip should be specific (not generic advice)
- Identify at least 1-2 strengths to build confidence`;
}

/**
 * Response schema for validation
 */
export const communicationAnalysisSchema = {
  type: 'object',
  properties: {
    filler_words: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        breakdown: { type: 'object' },
      },
      required: ['total', 'breakdown'],
    },
    pace: {
      type: 'object',
      properties: {
        wpm: { type: 'number' },
        assessment: { type: 'string', enum: ['too_slow', 'good', 'slightly_fast', 'too_fast'] },
        suggestion: { type: 'string' },
      },
      required: ['wpm', 'assessment'],
    },
    grammar_issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          corrected: { type: 'string' },
          type: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['original', 'corrected'],
      },
    },
    structure: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        feedback: { type: 'string' },
      },
      required: ['score', 'feedback'],
    },
    polished_version: { type: 'string' },
    coaching_tip: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
  },
  required: ['filler_words', 'pace', 'grammar_issues', 'structure', 'polished_version', 'coaching_tip', 'strengths'],
};
