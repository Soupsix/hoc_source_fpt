"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Heart, Coffee } from "lucide-react";

export function DonateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 hover:scale-105 transition-transform duration-200 shadow-xl rounded-full overflow-hidden border-2 border-white bg-white focus:outline-none"
        title="Ủng hộ tác giả"
      >
        <Image
          src="/buymeacoffee.png"
          alt="Donate"
          width={50}
          height={50}
          className="w-12 h-12 object-cover"
          unoptimized
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 p-1.5 bg-slate-100/50 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="w-full aspect-square max-w-[240px] mx-auto rounded-xl overflow-hidden border-4 border-amber-100 shadow-sm relative bg-white">
                 <Image
                  src="/buymeacoffee.png"
                  alt="QR Code Donate"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900">
                Chủ web nghèo hèn xin tài trợ 🥺
              </h3>
              
              <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Duy trì hệ thống tốn kém tiền server quá, thân phận dev lại bọt bèo đói kém quanh năm.
                </p>
                <p>
                  Nếu bạn thấy Flashcard hữu ích, hãy quét mã QR ủng hộ vài đồng lẻ cho chủ web có tiền mua gói mì tôm qua ngày nhé! 🍜
                </p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1 bg-slate-50 py-2 rounded-lg border border-slate-100">
                  Cảm ơn tấm lòng vàng của bạn <Heart className="w-3.5 h-3.5 text-red-400 fill-current" />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
