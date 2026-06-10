import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure Gemini API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("CẢNH BÁO: Không có GEMINI_API_KEY trong biến môi trường. Vui lòng cấu hình trong Secrets.");
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase limits to handle PDF files as base64
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- API ROUTE: SCREEN CV ---
  app.post("/api/screen-cv", async (req, res) => {
    try {
      const { jdText, cv } = req.body;

      if (!jdText || !jdText.trim()) {
        return res.status(400).json({ error: "Thông tin mô tả công việc (JD) không được để trống." });
      }

      if (!cv) {
        return res.status(400).json({ error: "Thông tin CV không được để trống." });
      }

      // 1. Prepare contents for Gemini
      const parts: any[] = [];

      // Add JD prompt details
      const instructionsPrompt = `You are an expert Technical Recruiter.
Your task is to analyze, compare, and screen the following Candidate CV against the provided Job Description (JD), evaluate compatibility, identify strengths/weaknesses (skills matched/missing), suggest specific interview questions, and provide a clear screening conclusion.

[JOB DESCRIPTION (JD)]
${jdText}

[EVALUATION REQUIREMENTS]
- Objectively compare technical expertise, years of experience, and specific skills in the CV against the JD.
- Provide objective assessments.
- Scores (0-100) include:
  + matchScore: Overall fit
  + technicalScore: Technical/skill competence
  + experienceScore: Work experience relevance
  + educationScore: Education and certifications relevance
- Screening recommendation labels:
  + "Suitable": When matchScore >= 80.
  + "Consider": When matchScore is 50-79.
  + "Not Suitable": When matchScore < 50.
- Provide all analysis and summaries in professional English.`;

      parts.push({ text: instructionsPrompt });

      // Add CV representation
      if (cv.base64 && cv.mimeType) {
        // Multi-modal processing for PDF/TXT files uploaded
        parts.push({
          inlineData: {
            data: cv.base64,
            mimeType: cv.mimeType,
          },
        });
        // We also add candidate context hints if provided
        parts.push({
          text: `Đây là tệp tin CV của ứng viên (mã định danh: ${cv.id}, tên đề xuất: ${cv.name || "Chưa rõ"}). Hãy phân tích nội dung tệp này để trả lời đầy đủ theo cấu trúc JSON định sẵn.`,
        });
      } else if (cv.textContent) {
        // Plain text CV pasted
        parts.push({
          text: `[HỒ SƠ ỨNG VIÊN (CV) - DẠNG CHỮ]
Tên đề xuất: ${cv.name || "Chưa rõ"}
Mã ID: ${cv.id}

Nội dung CV của ứng viên:
${cv.textContent}`,
        });
      } else {
        return res.status(400).json({ error: "CV không chứa dữ liệu ký tự hoặc tệp tin hợp lệ." });
      }

      // Apply highly structured JSON output schema via Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              candidateName: {
                type: Type.STRING,
                description: "Full name of the candidate, extracted accurately from the CV. If name cannot be found, use filename or 'Candidate ' + cv.id"
              },
              email: { 
                type: Type.STRING, 
                description: "Contact email from CV. Return empty string if not found." 
              },
              phone: { 
                type: Type.STRING, 
                description: "Mobile phone number from CV. Return empty string if not found." 
              },
              yearsOfExperience: { 
                type: Type.NUMBER, 
                description: "Estimated years of experience from CV (e.g., 3.5 or 5). If insufficient, provide best reasonable estimate." 
              },
              education: { 
                type: Type.STRING, 
                description: "Highest education level/degree/university. E.g., Bachelor of IT - Hanoi University of Science and Technology" 
              },
              matchScore: { 
                type: Type.INTEGER, 
                description: "Overall compatibility score from 0-100 aligned with recommendation label." 
              },
              technicalScore: { 
                type: Type.INTEGER, 
                description: "Candidate's technical skill/competency score from 0-100." 
              },
              experienceScore: { 
                type: Type.INTEGER, 
                description: "Score representing relevance and quality of work experience from 0-100." 
              },
              educationScore: { 
                type: Type.INTEGER, 
                description: "Score representing relevance of education, degrees, and certificates from 0-100." 
              },
              summary: { 
                type: Type.STRING, 
                description: "Concise overall assessment summary of the candidate's core strengths and professional value (max 3 sentences)." 
              },
              technicalSkillsMatched: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of candidate's skills that excel with JD requirements."
              },
              technicalSkillsMissing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of key skills in JD that the candidate misses or are not evident in CV."
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 standout strengths or highlights relevant to the position."
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Areas for concern, skill gaps, or notes from CV to consider."
              },
              interviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 ideal technical or behavioral interview questions specifically tailored to probing CV gaps or verifying experience."
              },
              recommendation: {
                type: Type.STRING,
                description: "Final screening result. Must be one of: 'Suitable', 'Consider', 'Not Suitable'"
              },
              reason: {
                type: Type.STRING,
                description: "Concise reason for this recommendation in English (1-2 sentences)."
              }
            },
            required: [
              "candidateName", "email", "phone", "yearsOfExperience", "education",
              "matchScore", "technicalScore", "experienceScore", "educationScore",
              "summary", "technicalSkillsMatched", "technicalSkillsMissing",
              "strengths", "weaknesses", "interviewQuestions", "recommendation", "reason"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Không nhận được câu trả lời dạng chữ từ dịch vụ Generative AI.");
      }

      const screenResults = JSON.parse(responseText.trim());
      
      // Send response back
      return res.status(200).json({
        id: cv.id,
        fileName: cv.name || "cv_file",
        results: screenResults
      });

    } catch (error: any) {
      console.error("LỖI CHI TIẾT KHI GỌI GOOGLE AI SDK:");
      console.error("Message:", error.message);
      if (error.response) {
        console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
      }
      return res.status(500).json({
        error: "Đã xảy ra lỗi hệ thống khi phân tích CV bằng AI.",
        details: error.message || error
      });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Fullstack Server] Server running on port: ${PORT}`);
  });
}

startServer();
