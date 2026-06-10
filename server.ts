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
      const instructionsPrompt = `Bạn là một chuyên gia tuyển dụng cao cấp (Technical Recruiter / HR Specialist) xuất sắc tại Việt Nam. 
Nhiệm vụ của bạn là phân tích, so sánh chi tiết Hồ sơ ứng viên (CV) sau đây với Mô tả công việc (JD) được cung cấp, sau đó đánh giá độ tương thích, các điểm mạnh/yếu, kỹ năng khớp/thiếu, đề xuất câu hỏi phỏng vấn đặc thù và đưa ra kết luận sàng lọc rõ ràng.

[THÔNG TIN MÔ TẢ CÔNG VIỆC (JD)]
${jdText}

[YÊU CẦU ĐÁNH GIÁ CHUYÊN SÂU]
- Đối chiếu kĩ chuyên môn, số năm kinh nghiêm, kỹ năng cụ thể được ghi trong CV so với JD.
- Đánh giá khách quan, trung thực, không thiên vị.
- Điểm số thang 100 gồm:
  + matchScore: Điểm hòa hợp chung
  + technicalScore: Điểm kỹ năng chuyên môn
  + experienceScore: Điểm bề dày/chất lượng kinh nghiệm thực tế
  + educationScore: Điểm học vấn, trường lớp và chứng chỉ liên quan
- Chia loại sàng lọc thành một trong ba nhãn:
  + "Phù hợp": khi Điểm hòa hợp chung (matchScore) >= 80 điểm.
  + "Cân nhắc": khi Điểm hòa hợp chung (matchScore) từ 50 đến 79 điểm.
  + "Không phù hợp": khi Điểm hòa hợp chung (matchScore) dưới 50 điểm.
- Viết tất cả các nội dung phân tích bằng tiếng Việt tự nhiên, chuyên nghiệp và súc tích.`;

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
                description: "Họ và tên của ứng viên, trích xuất chuẩn xác từ CV. Ví dụ: Nguyễn Văn A. Nếu hoàn toàn không thể tìm thấy tên ứng viên, dùng tên file hoặc 'Ứng viên " + cv.id + "'"
              },
              email: { 
                type: Type.STRING, 
                description: "Địa chỉ Email liên lạc trích xuất từ CV. Ví dụ: nguyenvana@gmail.com. Trả về chuỗi rỗng nếu không tìm thấy." 
              },
              phone: { 
                type: Type.STRING, 
                description: "Số điện thoại di động trích xuất từ CV. Trả về chuỗi rỗng nếu không tìm thấy." 
              },
              yearsOfExperience: { 
                type: Type.NUMBER, 
                description: "Số năm kinh nghiệm làm việc ước tính từ CV (ví dụ: 3.5 hoặc 5). Nếu thiếu thông tin, ước lượng hợp lý nhất." 
              },
              education: { 
                type: Type.STRING, 
                description: "Thông tin học vị / trường đại học cao nhất tiêu biểu. Ví dụ: Cử nhân Công nghệ thông tin - Đại học Bách Khoa Hà Nội" 
              },
              matchScore: { 
                type: Type.INTEGER, 
                description: "Điểm tương tích chung từ 0 đến 100 phù hợp chặt chẽ với nhãn sàng lọc ứng viên." 
              },
              technicalScore: { 
                type: Type.INTEGER, 
                description: "Điểm kỹ năng công nghệ / chuyên môn thực hành của ứng viên từ 0 đến 100." 
              },
              experienceScore: { 
                type: Type.INTEGER, 
                description: "Điểm mức độ phù hợp của quá trình và thời gian làm việc từ 0 đến 100." 
              },
              educationScore: { 
                type: Type.INTEGER, 
                description: "Điểm mức độ liên quan của học vấn, bằng cấp, chứng chỉ từ 0 đến 100." 
              },
              summary: { 
                type: Type.STRING, 
                description: "Tóm tắt đánh giá tổng quan, cô đọng về thế mạnh bổ trợ và năng lực cốt lõi của ứng viên này (tối đa 3 câu)." 
              },
              technicalSkillsMatched: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Mảng danh sách các kỹ năng/công cụ chuyên môn của ứng viên khớp xuất sắc với đòi hỏi của JD."
              },
              technicalSkillsMissing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Mảng danh sách các kỹ năng quan trọng trong JD nhưng ứng viên hoàn toàn thiếu hoặc không được thể hiện trong CV."
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 ưu điểm vượt trội hoặc điểm sáng nổi bật biểu trưng phù hợp với vị trí."
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các điểm yếu, khoảng cách khoảng trống kỹ năng cần xem xét hoặc lưu ý từ CV."
              },
              interviewQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 câu hỏi đào sâu hoặc chất vấn lý tưởng trong buổi phỏng vấn trực tiếp phù hợp với CV này để phân minh kỹ năng thiếu sót hoặc khẳng định kinh nghiệm."
              },
              recommendation: {
                type: Type.STRING,
                description: "Kết quả phân loại sàng lọc cuối cùng. Bắt buộc là một trong 3 từ khóa tiếng Việt: 'Phù hợp', 'Cân nhắc', 'Không phù hợp'"
              },
              reason: {
                type: Type.STRING,
                description: "Lý do súc tích cho khuyến nghị sàng lọc này bằng tiếng Việt (1-2 câu)."
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
    console.log(`[Fullstack Server] Server đang chạy trên cổng: ${PORT}`);
  });
}

startServer();
