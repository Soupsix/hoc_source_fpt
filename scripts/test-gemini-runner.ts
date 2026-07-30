import fs from "fs";
import path from "path";

// Parse .env file without external dependencies
if (!process.env.OPEN_ROUTER_API_KEY) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?([^"'\r\n]+)["']?/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

import { testGeminiAction } from "../src/actions/geminiTest";

async function main() {
  const model = process.env.OPEN_ROUTER_MODEL || "google/gemini-2.5-flash";
  console.log(`🚀 Đang gửi yêu cầu test tới OpenRouter API (Model: ${model})...`);
  const res = await testGeminiAction("Hãy giới thiệu ngắn gọn 3 tính năng hay của Next.js bằng tiếng Việt.");

  if (res.success) {
    console.log("\n✅ GỌI OPENROUTER API THÀNH CÔNG!\n");
    console.log("🤖 Phản hồi từ OpenRouter:");
    console.log(res.text);
  } else {
    console.error("\n❌ LỖI GỌI OPENROUTER API:", res.error);
  }
}

main();
