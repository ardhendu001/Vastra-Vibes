import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { TrendReport, AspectRatio, ImageSize, ShoppingItem } from "../types";

// We initialize a default instance, but for Pro features we might re-initialize with the updated key
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to map raw errors to user-friendly messages
const handleGeminiError = (error: any): never => {
  const msg = error instanceof Error ? error.message : String(error);
  
  if (msg.includes("403") || msg.includes("API key") || msg.includes("401")) {
    throw new Error("Authentication failed. Please check your API key and billing details.");
  }
  
  if (msg.includes("429") || msg.includes("quota") || msg.includes("exhausted")) {
    throw new Error("Service is currently busy (Quota Exceeded). Please try again later.");
  }

  if (msg.includes("SAFETY") || msg.includes("blocked") || msg.includes("finishReason")) {
    throw new Error("The analysis was blocked by safety filters. Please try a different image.");
  }
  
  if (msg.includes("SyntaxError") || msg.includes("JSON")) {
    throw new Error("Failed to interpret the AI report. Please try a clearer image.");
  }

  if (msg.includes("fetch failed") || msg.includes("Network")) {
    throw new Error("Network connection failed. Please check your internet.");
  }
  
  // Return the original message if it's already specific, or a generic one
  throw new Error(msg || "An unexpected error occurred during AI processing.");
};

// Schema definition for Structured Output
const manufacturingSpecsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    procurement_intent: { type: Type.STRING },
    fabric_primary: { type: Type.STRING },
    fabric_print: { type: Type.STRING },
    estimated_gsm: { type: Type.INTEGER },
    sourcing_hub_suggestion: { type: Type.STRING },
  },
  required: ["procurement_intent", "fabric_primary", "fabric_print", "estimated_gsm", "sourcing_hub_suggestion"]
};

const designConceptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    product_name: { type: Type.STRING },
    design_rationale: { type: Type.STRING },
    image_generation_prompt: { type: Type.STRING },
  },
  required: ["product_name", "design_rationale", "image_generation_prompt"]
};

const winningAttributesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    silhouette: { type: Type.STRING },
    fabric_print: { type: Type.STRING },
    color_palette: { type: Type.STRING },
  },
  required: ["silhouette", "fabric_print", "color_palette"]
};

const trendReportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    location_context: { type: Type.STRING },
    the_vibe: { type: Type.STRING },
    winning_attributes: winningAttributesSchema,
    best_seller_concept: designConceptSchema,
    manufacturing_specs: manufacturingSpecsSchema,
  },
  required: ["location_context", "the_vibe", "winning_attributes", "best_seller_concept", "manufacturing_specs"]
};

const SYSTEM_INSTRUCTION = `
You are "Vastra-Vibes," an AI Fashion Merchandiser and Trend Sentinel specializing in the Indian retail market (Tier-1 and Tier-2 cities).

**Mission:** Eliminate "Dead Stock" for boutique owners. Analyze visual inputs, extract hyper-local trend data, correlate with supply chain logic, and generate commercially viable design concepts.

**Operational Context:**
1.  **Hyper-Local Vision:** Recognize Indian ethnic/fusion attributes (Angrakha, Ikat, Ajrakh, Anarkali, etc.) and global trends adapted for India.
2.  **Supply Chain Logic:** Prioritize "High Trend / Low Cost" while respecting the garment's intended occasion.

**LIVE MARKET COST INDEX (REAL-TIME SIMULATION):**
**CRITICAL:** This data represents a LIVE SNAPSHOT of the current fabric market. Costs are dynamic and fluctuate. You must optimize for the "High Trend / Low Cost" ratio based strictly on the current simulated values below.

| Fiber Category | Material | Cost Index | Application Scope | Substitution Strategy (To Lower BOM) |
| :--- | :--- | :--- | :--- | :--- |
| **NATURAL (PLANT)** | Cotton (60s Cambric) | LOW | Daily Wear, Summer Kurtis | Base standard. |
| | Cotton (Voile/Mul) | LOW-MED | Premium Summer, Dupattas | - |
| | Linen (Pure) | HIGH | Premium Daily, Resort Wear | Sub with **Cotton-Flex** or **Slub Rayon**. |
| | Hemp | VERY HIGH | Niche Sustainable | Sub with **Jute-Cotton blend**. |
| **NATURAL (ANIMAL)** | Silk (Mulberry) | VERY HIGH | Bridal, Luxury Festive | Sub with **Viscose Muslin** or **Art Silk**. |
| | Silk (Tussar/Raw) | HIGH | High-End Occasion | Sub with **Slub-Polyester** or **Bhagalpuri Art Silk**. |
| | Wool (Merino) | HIGH | Premium Winter | Sub with **Acrylic** or **Poly-Wool**. |
| **SYNTHETIC** | Polyester (Generic) | VERY LOW | Mass Market, Linings, Uniforms | - |
| | Polyester (Georgette) | LOW | Daily Casual, Flowy Tops | Good sub for Silk Georgette. |
| | Polyester (Crepe) | LOW | Office Wear, Printed Sets | Excellent sub for Silk Crepe. |
| | Nylon/Net | LOW | Party Wear, Volume Layers | Use for can-can. |
| **REGENERATED** | Viscose/Rayon | LOW-STABLE | Mass Market Flowy Ethnic | **#1 Substitute** for Silk/Crepe/Chiffon. |
| | Modal | MEDIUM | Premium Daily, Loungewear | Premium alternative to Cotton. |
| | Lyocell (Tencel) | HIGH | Sustainable Premium | - |
| **STRATEGIC BLENDS** | **Poly-Viscose** | LOW | Corporate Ethnic, Trousers | Wool-like fall, wrinkle-free. |
| | **Cotton-Silk (Mashru)**| MEDIUM | Festive, Semi-Formal | Cheaper than Pure Silk, richer than Cotton. |
| | **Poly-Cotton** | VERY LOW | Budget Daily Wear | Durable, color-fast. |
| | **Linen-Rayon** | LOW-MED | Smart Casual, Co-ords | Best of both worlds for summer sets. |

**DECISION ENGINE: PROFIT MAXIMIZATION LOGIC**
1.  **Analyze the Visual:** Determine the *visual effect* (e.g., "Shiny and flowy" = Silk Satin).
2.  **Determine Market Segment:**
    *   *Mass Market (Daily):* MANDATORY substitution to Synthetics (Poly-Crepe) or Low-Cost Blends based on current LOW indices.
    *   *Mid-Range (Office/Casual):* Use Regenerated fibers (Viscose) or Blends (Cotton-Flex).
    *   *Luxury (Bridal/Festive):* Pure Natural fibers (Silk/Velvet) allowed only for high-margin designs, but consider "Smart Lux" blends if cost is VERY HIGH.
3.  **Substitution Examples (Dynamic Logic):**
    *   *If Linen is HIGH:* Suggest **Cotton-Flex** or **Linen-Rayon** to capture the look at a lower BOM.
    *   *If Silk is VERY HIGH:* Suggest **Viscose Muslin** for a similar hand-feel at a fraction of the cost.
    *   *Always:* Explicitly state "Based on current market rates..." when justifying the fabric choice.

**OUTPUT REQUIREMENTS:**
*   **Color Palette:** You MUST provide 2-3 dominant colors in the format "Name (Hex Code)". Example: "Rani Pink (#FF1493), Haldi Yellow (#FFD700)".

**Workflow:**
1.  **Visual Forensics:** Identify the "Dominant Gene" and "Micro-Trends".
2.  **Commercial Synthesis:** Merge the visual trend with the most profitable fabric choice from the Index above.
3.  **Output:** Return a JSON object matching the defined schema.
`;

export const analyzeFashionTrend = async (imageBase64: string, mimeType: string): Promise<TrendReport> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded to Pro
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: imageBase64 } },
          { text: "Analyze this street style image and provide a Vastra-Vibes commercial report. Apply REAL-TIME MARKET COST INDEX logic to suggest the most profitable fabric." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: trendReportSchema,
        temperature: 0, 
        seed: 42,
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned an empty response.");
    
    try {
        return JSON.parse(text) as TrendReport;
    } catch (e) {
        throw new Error("Failed to parse the trend report. The AI response was malformed.");
    }
  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateDesignVisual = async (
  prompt: string, 
  aspectRatio: AspectRatio, 
  imageSize: ImageSize
): Promise<string> => {
  // Always create a new instance to capture the potentially selected API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Upgraded to Pro Image
      contents: {
        parts: [
          { text: prompt + " The image should be a high-quality fashion photography shot, realistic, 4k, studio lighting, neutral background." }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
        }
      }
    });

    // Check parts for image data - iterating as per guidelines
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image generated by the model.");
  } catch (error) {
    handleGeminiError(error);
  }
};

export const findSimilarProducts = async (query: string): Promise<{ text: string, items: ShoppingItem[] }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Search for similar fashion products available to buy online in India based on this description: "${query}". 
      Focus on e-commerce sites like Myntra, Ajio, Jaypore, Fabindia, or Ogaan.
      Provide a brief summary of the availability and price range.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No shopping details found.";
    
    // Extract Grounding Chunks (URLs)
    const items: ShoppingItem[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk) => {
        if (chunk.web) {
          items.push({
            title: chunk.web.title || "Product Link",
            uri: chunk.web.uri || "#",
            source: new URL(chunk.web.uri || "https://google.com").hostname.replace('www.', '')
          });
        }
      });
    }

    return { text, items };
  } catch (error) {
    console.error("Shopping Search Error:", error);
    // Don't throw for shopping search, just return empty to avoid breaking main flow
    return { text: "Could not fetch live shopping results.", items: [] };
  }
};

let chatSession: Chat | null = null;

export const initializeChatSession = (report: TrendReport | null) => {
  const ai = getAiClient();
  
  let systemInstruction = "You are Vastra-Vibes Assistant, a helpful AI fashion expert. You help users understand fashion trends, fabric choices, and manufacturing details based on the Indian market. Be concise and professional.";

  if (report) {
    systemInstruction += `\n\nCURRENT ANALYSIS CONTEXT:\nUser has uploaded a fashion image. Here is the generated analysis report for the product:\n${JSON.stringify(report, null, 2)}\n\nIMPORTANT: Use this report data to answer user questions about the specific design, fabric choices, and manufacturing specs. You also have access to Google Search to find real-time pricing or additional context. Always refer to the product by its name: "${report.best_seller_concept.product_name}".`;
  }

  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });
};

export const chatWithGemini = async (message: string): Promise<string> => {
    // Re-init AI client to ensure fresh key if needed, or if session doesn't exist
    if (!chatSession) {
        initializeChatSession(null);
    }
    
    // We use non-null assertion because initializeChatSession ensures chatSession is created.
    const session = chatSession!;

    try {
        const response = await session.sendMessage({ message });
        let text = response.text || "I couldn't generate a response.";

        // Append grounding sources if available to the text output
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
            const sources = chunks
                .filter(c => c.web?.uri && c.web?.title)
                .map(c => `• ${c.web?.title}: ${c.web?.uri}`)
                .join('\n');
            
            if (sources) {
                text += `\n\n**Sources:**\n${sources}`;
            }
        }

        return text;
    } catch (error) {
        // We log it but also return the specific message for the chat UI
        try {
            handleGeminiError(error);
        } catch (e: any) {
             throw e;
        }
        return "Error"; // Unreachable due to handleGeminiError throwing
    }
};