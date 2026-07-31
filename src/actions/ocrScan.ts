"use server";

import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import { verifyAdminSession } from "@/lib/auth";

export interface OCRQuestionResult {
  question: string;
  options: string[];
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FLASHCARD";
  answer: string;
  explanation: string;
}

/**
 * Quét OCR và bóc tách câu hỏi trực tiếp từ ảnh bằng OpenRouter Vision LLM (Tốc độ cao, chạy chuẩn 100% trên Vercel)
 */
async function scanImageWithOpenRouterVision(file: File): Promise<OCRQuestionResult[] | null> {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  const model = process.env.OPEN_ROUTER_MODEL || "google/gemini-2.5-flash";
  if (!apiKey) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = file.type || "image/png";

    const prompt = `
Bạn là một chuyên gia bóc tách đề thi tiếng Việt hàng đầu.
Hãy đọc toàn bộ ảnh chụp đề thi này, nhận diện chính xác tất cả các câu hỏi trắc nghiệm, sửa lỗi chính tả tiếng Việt chuẩn và trả về mảng JSON theo cấu trúc duy nhất:
[
  {
    "question": "Nội dung câu hỏi đầy đủ...",
    "options": ["A. Phương án 1", "B. Phương án 2", "C. Phương án 3", "D. Phương án 4"],
    "type": "SINGLE_CHOICE",
    "answer": "",
    "explanation": ""
  }
]
Quy định:
1. 'question': Nội dung câu hỏi.
2. 'options': Danh sách các phương án A, B, C, D...
3. 'type': "SINGLE_CHOICE" hoặc "MULTIPLE_CHOICE" (nếu hỏi chọn nhiều đáp án).
4. 'answer': Giữ nguyên chuỗi rỗng "".
5. 'explanation': Giữ nguyên chuỗi rỗng "".
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hoc-source-fpt.vercel.app",
        "X-Title": "Learning_Source",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("⚠️ OpenRouter Vision API Error:", response.status, errText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      const rawText = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(rawText);
      const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data);

      if (Array.isArray(questions) && questions.length > 0) {
        return questions.map((q) => ({
          question: String(q.question || "").trim(),
          options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()) : [],
          type: q.type === "MULTIPLE_CHOICE" ? "MULTIPLE_CHOICE" : "SINGLE_CHOICE",
          answer: String(q.answer || ""),
          explanation: String(q.explanation || ""),
        }));
      }
    }
  } catch (err) {
    console.warn("⚠️ Lỗi OpenRouter Vision Scan:", err);
  }

  return null;
}

/**
 * Hiệu đính chính tả tiếng Việt qua OpenRouter text LLM (Dùng cho fallback VietOCR)
 */
async function polishQuestionsWithOpenRouter(questions: OCRQuestionResult[]): Promise<OCRQuestionResult[]> {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  const model = process.env.OPEN_ROUTER_MODEL || "google/gemini-2.5-flash";

  if (!apiKey || questions.length === 0) return questions;

  try {
    const prompt = `
Bạn là một chuyên gia biên tập đề thi tiếng Việt hàng đầu.
Dưới đây là mảng câu hỏi trắc nghiệm thu được từ nhận diện hình ảnh OCR (VietOCR), nên có thể chứa lỗi thiếu dấu, gõ sai từ hoặc ký tự nhiễu.

Nhiệm vụ của bạn:
1. Sửa toàn bộ lỗi chính tả, phục hồi chính xác dấu tiếng Việt chuẩn và văn phong cho từng câu hỏi ('question') và từng phương án ('options').
2. Giữ nguyên cấu trúc JSON mảng các đối tượng câu hỏi, KHÔNG thay đổi số lượng câu hỏi hay số lượng phương án.
3. CHƯA tự động điền đáp án ('answer') hay giải thích ('explanation'). Giữ nguyên answer = "" và explanation = "".
4. Trả về mảng JSON câu hỏi đã được hiệu đính chuẩn.

Dữ liệu OCR đầu vào:
${JSON.stringify(questions, null, 2)}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hoc-source-fpt.vercel.app",
        "X-Title": "Learning_Source",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      return questions;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      const rawText = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(rawText);
      const polishedArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data);

      if (Array.isArray(polishedArray) && polishedArray.length === questions.length) {
        return polishedArray;
      }
    }
  } catch (err) {
    console.warn("⚠️ OpenRouter AI Auto-Polish gặp sự cố (fallback về dữ liệu gốc):", err);
  }

  return questions;
}

export async function scanImageOCRAction(formData: FormData): Promise<{
  success: boolean;
  questions?: OCRQuestionResult[];
  error?: string;
}> {
  try {
    await verifyAdminSession();

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Vui lòng chọn file ảnh để scan!" };
    }

    // 1. Ưu tiên hàng đầu: Quét trực tiếp bằng OpenRouter Cloud Vision API (Tốc độ cao 1-2s, tương thích 100% Vercel Production & Localhost)
    const visionQuestions = await scanImageWithOpenRouterVision(file);
    if (visionQuestions && visionQuestions.length > 0) {
      return {
        success: true,
        questions: visionQuestions,
      };
    }

    // 2. Dự phòng (Fallback): Dành riêng cho môi trường Localhost nếu không có OpenRouter API Key
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(process.cwd(), "public", "uploads", "ocr_temp");
    await fs.mkdir(tempDir, { recursive: true });

    const fileExt = path.extname(file.name) || ".png";
    const tempFilePath = path.join(tempDir, `ocr_${Date.now()}${fileExt}`);
    await fs.writeFile(tempFilePath, buffer);

    const pythonPath = path.resolve(process.cwd(), "../scan-questions/.venv/Scripts/python.exe");
    const scriptPath = path.resolve(process.cwd(), "scripts/scan_questions_cli.py");

    return new Promise((resolve) => {
      execFile(
        pythonPath,
        [scriptPath, tempFilePath],
        { maxBuffer: 1024 * 1024 * 10, encoding: "utf-8" },
        async (error, stdout, stderr) => {
          await fs.unlink(tempFilePath).catch(() => {});

          if (error) {
            console.error("Lỗi VietOCR Child Process:", stderr || error.message);
            return resolve({
              success: false,
              error: `Lỗi quét OCR (Vercel Serverless không hỗ trợ Python Local, vui lòng cấu hình OPEN_ROUTER_API_KEY): ${stderr || error.message}`,
            });
          }

          try {
            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              return resolve({
                success: false,
                error: "Dữ liệu trả về từ script VietOCR không hợp lệ!",
              });
            }

            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.error) {
              return resolve({ success: false, error: parsed.error });
            }

            const rawQuestions: OCRQuestionResult[] = parsed.questions || [];
            const polishedQuestions = await polishQuestionsWithOpenRouter(rawQuestions);

            resolve({
              success: true,
              questions: polishedQuestions,
            });
          } catch (parseErr) {
            console.error("JSON parse error:", parseErr, stdout);
            resolve({
              success: false,
              error: "Không thể phân tích dữ liệu JSON trả về từ VietOCR!",
            });
          }
        }
      );
    });
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Lỗi hệ thống khi scan ảnh!",
    };
  }
}
