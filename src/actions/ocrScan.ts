"use server";

import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import { verifyAdminSession } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export interface OCRQuestionResult {
  question: string;
  options: string[];
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FLASHCARD";
  answer: string;
  explanation: string;
}

/**
 * Sử dụng AI Gemini 2.0 Flash hiệu đính chính tả, thêm dấu tiếng Việt chuẩn cho câu hỏi OCR
 */
async function polishQuestionsWithGemini(questions: OCRQuestionResult[]): Promise<OCRQuestionResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || questions.length === 0) return questions;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Bạn là một chuyên gia biên tập đề thi tiếng Việt hàng đầu.
Dưới đây là mảng câu hỏi trắc nghiệm thu được từ nhận diện hình ảnh OCR (VietOCR), nên có thể chứa lỗi thiếu dấu, gõ sai từ hoặc ký tự nhiễu (ví dụ: 'nào2' -> 'nào?', 'Chù nghía' -> 'Chủ nghĩa', 'trông nông' -> 'trọng nông', 'lính vc' -> 'lĩnh vực', 'tiền tê' -> 'tiền tệ').

Nhiệm vụ của bạn:
1. Sửa toàn bộ lỗi chính tả, phục hồi chính xác dấu tiếng Việt chuẩn và văn phong cho từng câu hỏi ('question') và từng phương án ('options').
2. Giữ nguyên cấu trúc JSON mảng các đối tượng câu hỏi, KHÔNG thay đổi số lượng câu hỏi hay số lượng phương án.
3. CHƯA tự động điền đáp án ('answer') hay giải thích ('explanation'). Giữ nguyên answer = "" và explanation = "".
4. Trả về mảng JSON câu hỏi đã được hiệu đính chuẩn.

Dữ liệu OCR đầu vào:
${JSON.stringify(questions, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      const polished: OCRQuestionResult[] = JSON.parse(response.text);
      if (Array.isArray(polished) && polished.length === questions.length) {
        return polished;
      }
    }
  } catch (err) {
    console.warn("⚠️ Gemini AI Auto-Polish gặp sự cố (fallback về dữ liệu gốc):", err);
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

    // Save temporary file in public/uploads/ocr_temp
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join(process.cwd(), "public", "uploads", "ocr_temp");
    await fs.mkdir(tempDir, { recursive: true });

    const fileExt = path.extname(file.name) || ".png";
    const tempFilePath = path.join(tempDir, `ocr_${Date.now()}${fileExt}`);
    await fs.writeFile(tempFilePath, buffer);

    // Path to python executable & CLI script inside Learning_Source
    const pythonPath = path.resolve(process.cwd(), "../scan-questions/.venv/Scripts/python.exe");
    const scriptPath = path.resolve(process.cwd(), "scripts/scan_questions_cli.py");

    return new Promise((resolve) => {
      execFile(
        pythonPath,
        [scriptPath, tempFilePath],
        { maxBuffer: 1024 * 1024 * 10, encoding: "utf-8" },
        async (error, stdout, stderr) => {
          // Cleanup temp file
          await fs.unlink(tempFilePath).catch(() => {});

          if (error) {
            console.error("Lỗi VietOCR Child Process:", stderr || error.message);
            return resolve({
              success: false,
              error: `Lỗi quét OCR: ${stderr || error.message}`,
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

            // Tự động sử dụng Gemini AI hiệu đính chuẩn câu chữ tiếng Việt
            const polishedQuestions = await polishQuestionsWithGemini(rawQuestions);

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
