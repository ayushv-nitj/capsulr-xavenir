const model = require("../config/gemini");

/**
 * Generate personalized memory prompts based on user context
 */
async function generateMemoryPrompts(userContext) {
  try {
    const { userName, lastCapsuleDate, capsuleCount, recentThemes, currentSeason } = userContext;

    const prompt = `You are a thoughtful memory curator helping users create meaningful time capsules.

Generate 5 personalized, creative prompts for time capsule memories based on the user's context.

User Context:
- Name: ${userName || "the user"}
- Last capsule created: ${lastCapsuleDate || "Never"}
- Total capsules: ${capsuleCount || 0}
- Recent themes: ${recentThemes?.join(", ") || "None"}
- Current season: ${currentSeason}

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "prompts": [
    {
      "title": "Short catchy title",
      "description": "Detailed prompt description",
      "icon": "emoji icon",
      "suggestedTheme": "theme name"
    }
  ]
}

Generate 5 prompts that are inspiring, specific, and encourage reflection.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response (remove markdown code blocks if present)
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return parsed.prompts || parsed;
  } catch (error) {
    console.error("AI Prompt Generation Error:", error);
    // Return fallback prompts
    return [
      {
        title: "Future Self Letter",
        description: "Write a letter to yourself one year from now. What do you hope to achieve?",
        icon: "✉️",
        suggestedTheme: "Personal Growth"
      },
      {
        title: "Today's Gratitude",
        description: "Capture three things you're grateful for today and why they matter.",
        icon: "🙏",
        suggestedTheme: "Gratitude"
      },
      {
        title: "Current Goals",
        description: "Document your current goals and dreams. Revisit them in 6 months.",
        icon: "🎯",
        suggestedTheme: "Goals"
      },
      {
        title: "Favorite Memory",
        description: "Describe your favorite memory from this month in vivid detail.",
        icon: "⭐",
        suggestedTheme: "Memories"
      },
      {
        title: "Life Snapshot",
        description: "Capture what a typical day looks like for you right now.",
        icon: "📸",
        suggestedTheme: "Daily Life"
      }
    ];
  }
}

/**
 * Enhance user-written memory content with AI suggestions
 */
async function enhanceMemoryContent(content, capsuleTheme) {
  try {
    const prompt = `You are a memory enhancement assistant. Help users enrich their time capsule memories.

Analyze this memory content and provide enhancement suggestions:

Content: "${content}"
Capsule Theme: "${capsuleTheme}"

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "suggestions": [
    "Specific suggestion 1",
    "Specific suggestion 2",
    "Specific suggestion 3"
  ],
  "recommendedTags": ["tag1", "tag2", "tag3"],
  "unlockDateSuggestion": {
    "duration": "6 months",
    "reason": "Brief explanation why"
  },
  "reflectionPrompts": [
    "Question 1?",
    "Question 2?"
  ],
  "sentiment": "positive"
}

Provide:
1. Three specific suggestions to make the memory more vivid and detailed
2. Three relevant tags for categorization
3. An optimal unlock date suggestion with reasoning
4. Two thoughtful reflection prompts
5. Sentiment analysis (choose: positive, neutral, nostalgic, or hopeful)

Be encouraging and preserve the user's original voice.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return parsed;
  } catch (error) {
    console.error("AI Content Enhancement Error:", error);
    // Return fallback suggestions
    return {
      suggestions: [
        "Consider adding more sensory details (sights, sounds, feelings)",
        "Include specific dates or locations to make it more memorable",
        "Describe the emotions you felt during this moment"
      ],
      recommendedTags: ["memory", capsuleTheme.toLowerCase()],
      unlockDateSuggestion: {
        duration: "1 year",
        reason: "A year gives enough time for reflection and growth"
      },
      reflectionPrompts: [
        "How do you think you'll feel when you read this in the future?",
        "What would you tell your future self about this moment?"
      ],
      sentiment: "neutral"
    };
  }
}

/**
 * Generate smart title suggestions based on content
 */
async function generateTitleSuggestions(content, theme) {
  try {
    const prompt = `Generate 3 creative, concise title suggestions for a time capsule.

Content: "${content}"
Theme: "${theme}"

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "titles": ["Title 1", "Title 2", "Title 3"]
}

Make the titles catchy, memorable, and relevant to the content and theme.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    return parsed.titles || parsed;
  } catch (error) {
    console.error("AI Title Generation Error:", error);
    return [`${theme} Memories`, `${theme} Time Capsule`, `My ${theme} Journey`];
  }
}

module.exports = {
  generateMemoryPrompts,
  enhanceMemoryContent,
  generateTitleSuggestions
};
