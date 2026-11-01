
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a helpful real estate assistant specializing in Pakistan's property market. Your role is to:

1. Answer questions about buying, selling, renting properties in Pakistan
2. Provide information about major cities: Lahore, Karachi, Islamabad, Multan, Faisalabad
3. Explain property types: houses, apartments, plots, commercial properties
4. Discuss housing societies like DHA, Bahria Town, Gulberg
5. Help with property investment advice
6. Explain legal procedures for property transactions in Pakistan
7. Discuss market trends and prices

Guidelines:
- Only answer questions related to Pakistan real estate
- If asked about other topics, politely redirect to real estate matters
- Provide accurate, helpful information
- Keep responses concise but informative
- Use PKR (Pakistani Rupees) for prices
- Mention that prices vary by location and time

If a question is completely unrelated to Pakistan real estate, respond with: "I'm specialized in Pakistan real estate matters. Please ask questions related to buying, selling, or renting properties in Pakistan."`;


export const chatWithBot = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
console.log("body",message,conversationHistory)
    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const historyText = conversationHistory
      .slice(-10)
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    const finalPrompt = `
${SYSTEM_PROMPT}

Conversation:
${historyText}

User: ${message}
Assistant:
`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      success: true,
      reply: text,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error: error.message,
    });
  }
};
