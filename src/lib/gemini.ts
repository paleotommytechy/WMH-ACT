
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function generateSocialPosts(submission: {
  task_name: string;
  time_spent: number;
  reflection: string;
}) {
  if (!ai) {
    // Fallback simple templates if no API key
    return {
      linkedin: `🚀 Today's Progress: Finished ${submission.task_name} in ${submission.time_spent} mins.\n\nReflection: ${submission.reflection}\n\n#LearningInPublic #Consistency #WMHACT`,
      whatsapp: `✅ *Mastery Hub Update*\nTask: ${submission.task_name}\nTime: ${submission.time_spent}m\nReflection: ${submission.reflection}`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert social media manager. Generate one LinkedIn post and one WhatsApp status update based on this learning progress submission:
      - Task: ${submission.task_name}
      - Time Spent: ${submission.time_spent} minutes
      - Reflection: ${submission.reflection}
      
      Requirements:
      - LinkedIn: Professional yet enthusiastic, focuses on growth and consistency. Use #LearningInPublic and #Mastery.
      - WhatsApp: Concise, uses emojis, lists the key achievement.
      
      Return as JSON with keys "linkedin" and "whatsapp".`,
      config: {
        systemInstruction: "Ensure your output is perfectly formatted JSON only, containing no HTML, DOCTYPE tags, markdown code blocks, or any other introductory text.",
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    try {
      return JSON.parse(responseText.trim());
    } catch (parseErr) {
      // Robust fallback processing for any potential markdown code fences or prefixes
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
      return JSON.parse(cleaned);
    }
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return {
      linkedin: `🚀 Today's Progress: Finished ${submission.task_name} in ${submission.time_spent} mins.\n\nReflection: ${submission.reflection}\n\n#LearningInPublic #Consistency #WMHACT`,
      whatsapp: `✅ *Mastery Hub Update*\nTask: ${submission.task_name}\nTime: ${submission.time_spent}m\nReflection: ${submission.reflection}`
    };
  }
}
