import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for running directly on the client side
  });
}

export async function generateSocialPosts(submission: {
  task_name: string;
  time_spent: number;
  reflection: string;
}) {
  const fallback = {
    linkedin: `🚀 Today's Progress: Finished ${submission.task_name} in ${submission.time_spent} mins.

Reflection: ${submission.reflection}

#LearningInPublic #Consistency #WMHACT`,
    whatsapp: `✅ *Mastery Hub Update*
Task: ${submission.task_name}
Time: ${submission.time_spent}m
Reflection: ${submission.reflection}`,
  };

  if (!openai) {
    console.warn("OPENAI_API_KEY not found. Using fallback content.");
    return fallback;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content:
            "You are an expert social media manager. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `
Generate one LinkedIn post and one WhatsApp status update based on this learning progress submission:

Task: ${submission.task_name}
Time Spent: ${submission.time_spent} minutes
Reflection: ${submission.reflection}

Requirements:
- LinkedIn: Professional, enthusiastic, focused on growth and consistency.
- Include #LearningInPublic and #Mastery.
- WhatsApp: Concise, emoji-friendly, highlights the achievement.

Return this exact JSON structure:

{
  "linkedin": "...",
  "whatsapp": "..."
}
          `,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI returned empty content");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI generation failed:", error);
    return fallback;
  }
}
