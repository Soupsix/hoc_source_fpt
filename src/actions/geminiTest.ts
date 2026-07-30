"use server";

import { GoogleGenAI } from "@google/genai";

export async function testGeminiAction(prompt: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: "Chưa cấu hình GEMINI_API_KEY trong file .env!",
            };
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt || "Hãy giới thiệu ngắn gọn về Next.js bằng tiếng Việt.",
        });

        return {
            success: true,
            text: response.text,
        };
    } catch (error: any) {
        console.error("Lỗi gọi Gemini API:", error);
        return {
            success: false,
            error: error.message || "Không thể kết nối tới Google Gemini API",
        };
    }
}

/**
 * Hàm hỗ trợ tự động sửa lỗi đề thi OCR & trả về dạng JSON chuẩn
 */
export async function cleanOcrTextWithGeminiAction(rawOcrText: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: "Chưa cấu hình GEMINI_API_KEY trong file .env!",
            };
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
    Bạn là một chuyên gia biên tập đề thi. 
    Hãy sửa lỗi chính tả, thêm dấu tiếng Việt chuẩn cho câu hỏi trắc nghiệm sau và trả về dạng JSON có cấu trúc { question, options, answer }:
    
    Nội dung quét OCR lỗi:
    "${rawOcrText}"
    `;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });

        const parsedJson = JSON.parse(response.text || "{}");
        return {
            success: true,
            data: parsedJson,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
