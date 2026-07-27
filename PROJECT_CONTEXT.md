# DỰ ÁN FLASHCARD LEARNING - DỮ LIỆU BỐI CẢNH & TỔNG KẾT TRIỂN KHAI (PROJECT CONTEXT)

File này lưu trữ toàn bộ lịch sử hoàn thành **Phase 1 đến Phase 5** để các AI Agent hoặc Developer tiếp quản có thể dễ dàng nắm bắt và mở rộng dự án mà không phá vỡ cấu trúc có sẵn.

---

## I. TỔNG KẾT HOÀN THÀNH PHASE 1 (ADMIN & QUẢN LÝ MÃ ĐỀ)

- **Database Schema**: Model `QuestionSet` và model `Question` (kèm index `code`, `setId`, `[setId, order]` và `onDelete: Cascade`).
- **Prisma Client Singleton**: `src/lib/prisma.ts`
- **Authentication & Security**: Mã hóa JWT session cookie (`jose`), HTTP-Only cookie 7 ngày, kiểm tra `verifyAdminSession()`.
- **Middleware Security**: Middleware bảo vệ tất cả các route `/admin/*` và `/api/admin/*`.

---

## II. TỔNG KẾT HOÀN THÀNH PHASE 2 - PHASE 5

### 1. Phase 2: Quản Lý Câu Hỏi Đa Dạng (Admin Question Management)
- **Cập nhật Schema (`prisma/schema.prisma`)**:
  - Enum `QuestionType`: `FLASHCARD`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`.
  - Trường `type` & `options` (Json?) trong model `Question`.
  - Cập nhật database bằng `npm run db:push` bảo toàn dữ liệu.
- **Server Actions (`src/actions/questions.ts`)**:
  - `createQuestionAction()`, `updateQuestionAction()`, `deleteQuestionAction()` (Tất cả đều yêu cầu `verifyAdminSession()`).
  - `moveQuestionOrderAction()` (Đổi vị trí thứ tự câu hỏi Up/Down).
  - `importQuestionsAction()` (Import hàng loạt mảng câu hỏi từ JSON).
- **Giao diện Admin (`src/components/admin/`)**:
  - `AdminQuestionsList.tsx`: Bảng quản lý câu hỏi có Badge phân loại, nút Sửa, Xóa và Di chuyển thứ tự.
  - `QuestionFormDialog.tsx`: Modal tạo/sửa câu hỏi hỗ trợ chọn dạng Flashcard, Single Choice, Multiple Choice và danh sách lựa chọn.
  - `ImportQuestionsDialog.tsx`: Modal import mảng JSON với dữ liệu mẫu.

### 2. Phase 3 & 4: Giao Diện Người Học & Học Flashcard 3D
- **Thư viện mã đề (`/`)**:
  - Truy vấn dữ liệu Server Component (`src/actions/publicSets.ts`) chỉ lấy `isPublished = true`.
  - Đồng bộ URL query parameter `/?q=...&page=...`, phân trang 12 item/trang.
  - Empty state vs No-result state.
- **Xem mã đề (`/sets/[code]`)**: Trang tổng quan mã đề công khai.
- **Học Flashcard (`/sets/[code]/learn`)**:
  - Component `FlashcardStudyApp.tsx`: Thẻ 3D Flip Card animation.
  - Phím tắt `Space` lật thẻ, `←` / `→` chuyển câu, thanh tiến trình %, đánh dấu câu đã thuộc.
- **Thi thử trắc nghiệm (`/sets/[code]/quiz`)**:
  - Component `QuizApp.tsx`: Chế độ làm bài thi hỗ trợ trắc nghiệm 1 đáp án, nhiều đáp án và tự luận.
  - Đếm thời gian làm bài, trộn câu hỏi ngẫu nhiên (Shuffle), chấm điểm % chính xác và xem lại bài làm chi tiết có giải thích.

---

## III. KẾT QUẢ KIỂM THỬ CHẤT LƯỢNG (VERIFICATION)

| Kiểm tra | Lệnh thực thi | Kết quả |
| :--- | :--- | :--- |
| **Prisma DB Push** | `npm run db:push` | SUCCESS (Đã đồng bộ PostgreSQL) |
| **TypeScript Check** | `npx tsc --noEmit` | SUCCESS (0 lỗi Type) |
| **ESLint Check** | `npm run lint` | SUCCESS (0 lỗi ESLint) |
| **Production Build** | `npx next build` | SUCCESS (Tất cả route app compiled thành công) |

---

## IV. CẤU TRÚC ROUTING CHUẨN HOÁ

- `/`: Trang chủ công khai Thư viện mã đề.
- `/sets/[code]`: Trang thông tin chi tiết mã đề.
- `/sets/[code]/learn`: Trang học Flashcard 3D.
- `/sets/[code]/quiz`: Trang thi thử trắc nghiệm.
- `/admin`: Tự động redirect về `/admin/sets` nếu đã login, hoặc `/admin/login` nếu chưa login.
- `/admin/login`: Trang đăng nhập Admin bằng mã truy cập cố định.
- `/admin/sets`: Quản lý danh sách mã đề Admin.
- `/admin/sets/[id]`: Quản lý mã đề & danh sách câu hỏi Admin.
