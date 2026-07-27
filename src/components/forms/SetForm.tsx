"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { questionSetSchema, type QuestionSetFormValues } from "@/lib/validations/sets";
import { createQuestionSetAction, updateQuestionSetAction } from "@/actions/sets";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SetFormProps {
  initialData?: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    subject?: string | null;
    semester?: string | null;
    isPublished: boolean;
  };
}

export function SetForm({ initialData }: SetFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuestionSetFormValues>({
    resolver: zodResolver(questionSetSchema),
    defaultValues: {
      code: initialData?.code || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      subject: initialData?.subject || "Chưa xếp",
      semester: initialData?.semester || "Chưa xếp",
      isPublished: initialData?.isPublished ?? false,
    },
  });

  const onSubmit = async (values: QuestionSetFormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    const formattedValues: QuestionSetFormValues = {
      ...values,
      code: values.code.trim().toUpperCase(),
      title: values.title.trim(),
      description: values.description ? values.description.trim() : "",
      subject: values.subject && values.subject.trim() ? values.subject.trim() : "Chưa xếp",
      semester: values.semester && values.semester.trim() ? values.semester.trim() : "Chưa xếp",
      isPublished: Boolean(values.isPublished),
    };

    try {
      if (isEditing && initialData) {
        const res = await updateQuestionSetAction(initialData.id, formattedValues);
        if (!res.success) {
          setServerError(res.error || "Không thể cập nhật mã đề.");
          setIsSubmitting(false);
          return;
        }
        router.push(`/admin/sets/${initialData.id}`);
        router.refresh();
      } else {
        const res = await createQuestionSetAction(formattedValues);
        if (!res.success) {
          setServerError(res.error || "Không thể tạo mã đề.");
          setIsSubmitting(false);
          return;
        }
        if (res.data?.id) {
          router.push(`/admin/sets/${res.data.id}`);
          router.refresh();
        } else {
          router.push("/admin/sets");
          router.refresh();
        }
      }
    } catch {
      setServerError("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Thao tác thất bại</p>
            <p className="mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Code */}
      <Input
        label="Mã đề *"
        placeholder="Ví dụ: IT_BASIC_01"
        error={errors.code?.message}
        helperText="Dài từ 3 đến 30 ký tự, chỉ chứa chữ cái, chữ số, '-' hoặc '_'. Tự động chuyển thành chữ in hoa."
        {...register("code", {
          onChange: (e) => {
            const upper = (e.target.value as string).toUpperCase();
            setValue("code", upper, { shouldValidate: true });
          },
        })}
      />

      {/* Title */}
      <Input
        label="Tên đề *"
        placeholder="Ví dụ: Kiến thức lập trình Web cơ bản"
        error={errors.title?.message}
        helperText="Tối đa 150 ký tự."
        {...register("title")}
      />

      {/* Subject & Semester */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Môn học"
          placeholder="Ví dụ: PRN231, SWP391..."
          error={errors.subject?.message}
          helperText="Tên/Mã môn học (để trống sẽ tự xếp vào 'Chưa xếp')."
          {...register("subject")}
        />

        <div>
          <label htmlFor="semester" className="text-sm font-medium text-slate-700 block mb-1.5">
            Kỳ học
          </label>
          <select
            id="semester"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            {...register("semester")}
          >
            <option value="Chưa xếp">Chưa xếp</option>
            <option value="Kỳ 1">Kỳ 1</option>
            <option value="Kỳ 2">Kỳ 2</option>
            <option value="Kỳ 3">Kỳ 3</option>
            <option value="Kỳ 4">Kỳ 4</option>
            <option value="Kỳ 5">Kỳ 5</option>
            <option value="Kỳ 6">Kỳ 6</option>
            <option value="Kỳ 7">Kỳ 7</option>
            <option value="Kỳ 8">Kỳ 8</option>
            <option value="Kỳ 9">Kỳ 9</option>
          </select>
          {errors.semester?.message && (
            <p className="mt-1 text-xs text-red-600">{errors.semester.message}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Phân loại theo kỳ học (Nếu môn không có kỳ thì chọn &quot;Chưa xếp&quot;).</p>
        </div>
      </div>

      {/* Description */}
      <Textarea
        label="Mô tả"
        placeholder="Nhập mô tả ngắn gọn về bộ câu hỏi này..."
        rows={4}
        error={errors.description?.message}
        helperText="Tối đa 1000 ký tự."
        {...register("description")}
      />

      {/* isPublished */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50">
        <div>
          <label htmlFor="isPublished" className="text-sm font-medium text-slate-900 block cursor-pointer">
            Xuất bản mã đề
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Khi bật, mã đề này sẽ sẵn sàng cho việc công khai hoặc cho học viên truy cập.
          </p>
        </div>
        <input
          id="isPublished"
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          {...register("isPublished")}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Hủy bỏ
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {isEditing ? "Lưu thay đổi" : "Tạo mã đề"}
        </Button>
      </div>
    </form>
  );
}
