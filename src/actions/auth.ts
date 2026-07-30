"use server";

import { createAdminSession, deleteAdminSession } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validations/sets";

export async function loginAdminAction(accessCode: string) {
  try {
    const validated = adminLoginSchema.parse({ accessCode });

    const serverAdminCode = process.env.ADMIN_ACCESS_CODE;

    if (validated.accessCode !== serverAdminCode) {
      return { success: false, error: "Mã truy cập Admin không chính xác." };
    }

    await createAdminSession();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Đã xảy ra lỗi không xác định khi đăng nhập." };
  }
}

export async function logoutAdminAction() {
  await deleteAdminSession();
  return { success: true };
}
