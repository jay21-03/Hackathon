/** Mục sidebar thường — active nhẹ, không trùng nút chuyển ngữ cảnh. */
export function sidebarNavClassName(isActive: boolean) {
  return `flex items-center gap-3 rounded-lg py-2.5 font-label-md transition-colors ${
    isActive
      ? "border-l-2 border-primary bg-surface-container-high/70 pl-[calc(0.75rem-2px)] pr-sm text-on-surface"
      : "border-l-2 border-transparent px-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
  }`;
}

/** Một nút nổi bật (vd. đổi danh sách cuộc thi) — duy nhất dùng nền primary đặc. */
export const sidebarPrimaryActionClassName =
  "w-full !bg-primary !text-on-primary shadow-sm hover:!brightness-95";
