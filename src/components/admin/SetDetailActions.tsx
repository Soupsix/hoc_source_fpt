"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteSetDialog } from "./DeleteSetDialog";
import { Edit3, Trash2 } from "lucide-react";

interface SetDetailActionsProps {
  setId: string;
  setCode: string;
}

export function SetDetailActions({ setId, setCode }: SetDetailActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={`/admin/sets/${setId}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa
          </Button>
        </Link>
        <Button
          variant="danger"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Xóa mã đề
        </Button>
      </div>

      <DeleteSetDialog
        setId={setId}
        setCode={setCode}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}
