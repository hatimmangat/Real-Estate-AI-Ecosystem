import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



export const generateInteriorDesign = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required",
            });
        }

        if (prompt.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Prompt must be less than 500 characters",
            });
        }

        console.log(
            `Generating interior design for user ${req.user._id} with prompt: "${prompt}"`
        );

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const enhancedPrompt = `
Create a professional, ultra-realistic interior design render.

Description: ${prompt}

Requirements:
- Photorealistic architectural rendering
- Realistic lighting (natural + artificial)
- High detail textures and materials
- Proper spatial proportions
- Modern elegant interior style
- Professional real estate photography
- Depth of field
- Balanced composition

IMPORTANT: Generate an IMAGE only. Do NOT return text.
`;

        const images = [];
        const errors = [];

        console.log("Starting image generation...");

        for (let i = 0; i < 3; i++) {
            try {
                const variationFocus = [
                    "Focus on ambiance and lighting mood",
                    "Focus on furniture layout and materials",
                    "Focus on colors and decorative details",
                ];

                const variedPrompt = `${enhancedPrompt}
Variation ${i + 1}: ${variationFocus[i]}
`;

                console.log(`Generating image ${i + 1} of 3...`);

                const result = await model.generateContent({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: variedPrompt }],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: "image/png", 
                    },
                });

                const response = await result.response;
                const candidate = response.candidates?.[0];

                if (candidate?.content?.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData?.data) {
                            const mimeType = part.inlineData.mimeType || "image/png";
                            const base64Image = `data:${mimeType};base64,${part.inlineData.data}`;
                            images.push(base64Image);
                            console.log(`Image ${i + 1} generated successfully`);
                            break;
                        }
                    }
                }

                if (i < 2) {
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                }
            } catch (error) {
                console.error(`Error generating image ${i + 1}:`, error.message);
                errors.push(`Image ${i + 1}: ${error.message}`);
            }
        }

        if (images.length === 0) {
            console.error("Failed to generate any images", { errors });
            return res.status(500).json({
                success: false,
                message:
                    "Failed to generate images. Your API key may not support image generation.",
                errors: errors.length > 0 ? errors : undefined,
            });
        }

        console.log(`Successfully generated ${images.length} images`);

        res.status(200).json({
            success: true,
            images,
            count: images.length,
            message: `Successfully generated ${images.length} design${images.length > 1 ? "s" : ""
                }`,
            prompt,
        });
    } catch (error) {
        console.error("Error in generateInteriorDesign:", error);

        let errorMessage = "Failed to generate interior design images";
        let statusCode = 500;

        if (error.message?.includes("API key")) {
            errorMessage = "API configuration error.";
            statusCode = 503;
        } else if (
            error.message?.includes("quota") ||
            error.message?.includes("limit exceeded")
        ) {
            errorMessage =
                "Free tier quota exceeded. Please enable billing or wait for reset.";
            statusCode = 503;
        } else if (error.message?.includes("rate limit")) {
            errorMessage = "Too many requests. Please wait and try again.";
            statusCode = 429;
        } else if (
            error.message?.includes("invalid") ||
            error.message?.includes("malformed")
        ) {
            errorMessage = "Invalid request. Please check your prompt.";
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};
 
export const getGenerationHistory = async (req, res) => {
    try {  
        const userId = req.user._id;

        console.log(`Fetching generation history for user ${userId}`); 
 
        res.status(200).json({ 
            success: true, 
            history: [], 
            message: 'Generation history retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching generation history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch generation history'
        });
    }
};


export const healthCheck = async (req, res) => {
    try {
        const hasApiKey = !!process.env.GEMINI_API_KEY;

        res.status(200).json({
            success: true,
            service: 'Interior Design Generator',
            status: 'operational',
            apiConfigured: hasApiKey,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service: 'Interior Design Generator',
            status: 'error',
            error: error.message
        });
    }
};
