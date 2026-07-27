"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestionSetAction } from "@/actions/sets";
import { ConfirmDialog } from "@/components/ui/dialog";

interface DeleteSetDialogProps {
  setId: string;
  setCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteSetDialog({
  setId,
  setCode,
  isOpen,
  onClose,
  onSuccess,
}: DeleteSetDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteQuestionSetAction(setId);
      if (res.success) {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/sets");
          router.refresh();
        }
      } else {
        alert(res.error || "Không thể xóa mã đề.");
      }
    } catch {
      alert("Đã xảy ra lỗi khi xóa mã đề.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmDelete}
      title="Xác nhận xóa mã đề"
      description={`Bạn có chắc chắn muốn xóa mã đề "${setCode}"? Thao tác này không thể hoàn tác và tất cả câu hỏi bên trong sẽ bị xóa vĩnh viễn.`}
      confirmText="Xóa mã đề"
      cancelText="Hủy"
      isLoading={isDeleting}
      variant="danger"
    />
  );
}
