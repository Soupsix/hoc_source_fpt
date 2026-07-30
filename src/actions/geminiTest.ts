"use server";

export async function testGeminiAction(prompt: string) {
  try {
    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    const model = process.env.OPEN_ROUTER_MODEL || "google/gemini-2.5-flash";

    if (!apiKey) {
      return {
        success: false,
        error: "Chưa cấu hình OPEN_ROUTER_API_KEY trong file .env!",
      };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Learning_Source",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt || "Hãy giới thiệu ngắn gọn về Next.js bằng tiếng Việt.",
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `OpenRouter API Error (${response.status}): ${errText}`,
      };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    return {
      success: true,
      text,
    };
  } catch (error: any) {
    console.error("Lỗi gọi OpenRouter API:", error);
    return {
      success: false,
      error: error.message || "Không thể kết nối tới OpenRouter API",
    };
  }
}

/**
 * Hàm hỗ trợ tự động sửa lỗi đề thi OCR & trả về dạng JSON chuẩn qua OpenRouter
 */
export async function cleanOcrTextWithGeminiAction(rawOcrText: string) {
  try {
    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    const model = process.env.OPEN_ROUTER_MODEL || "google/gemini-2.5-flash";

    if (!apiKey) {
      return {
        success: false,
        error: "Chưa cấu hình OPEN_ROUTER_API_KEY trong file .env!",
      };
    }

    const prompt = `
Bạn là một chuyên gia biên tập đề thi. 
Hãy sửa lỗi chính tả, thêm dấu tiếng Việt chuẩn cho câu hỏi trắc nghiệm sau và trả về dạng JSON có cấu trúc { question, options, answer }:

Nội dung quét OCR lỗi:
"${rawOcrText}"
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `OpenRouter API Error (${response.status}): ${errText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsedJson = JSON.parse(content);

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
