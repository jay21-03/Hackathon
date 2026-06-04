/** Decode token from email URL (?token=). Supports plain and Base64url-wrapped values. */
export function decodeInvitationTokenParam(value: string | null): string | null {
  if (!value) return null;

  let trimmed = value.trim();
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    /* keep raw */
  }

  if (trimmed.includes(".")) {
    return trimmed;
  }

  try {
    const base64 = trimmed.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return trimmed;
  }
}

export function invitationErrorMessage(message: string, isAccept: boolean): string {
  const lower = message.toLowerCase();
  if (lower.includes("invitation not found")) {
    return "Không tìm thấy lời mời. Link có thể đã hết hạn hoặc BTC đã gửi lời mời mới — mở email mới nhất hoặc nhờ gửi lại.";
  }
  if (lower.includes("invalid invitation token")) {
    return "Link lời mời không hợp lệ (có thể bị cắt khi copy). Mở lại từ nút trong email mới nhất.";
  }
  if (lower.includes("expired")) {
    return "Lời mời đã hết hạn (2 ngày). Nhờ BTC gửi lại lời mời.";
  }
  if (lower.includes("does not belong")) {
    return "Bạn đang đăng nhập sai email. Hãy đăng nhập Google trùng email được mời trong thư.";
  }
  if (lower.includes("already declined")) {
    return "Lời mời này đã bị từ chối trước đó.";
  }
  return (
    message ||
    (isAccept
      ? "Không thể xác nhận lời mời. Hãy đăng nhập đúng email được mời."
      : "Không thể từ chối lời mời.")
  );
}
