# Đề xuất giao diện & màu sắc — SEAL Hackathon

## Định hướng thương hiệu

Nền tảng quản lý hackathon chuyên nghiệp, công nghệ, tin cậy — phù hợp FPT/SEAL: **tối (dark)**, **xanh điện tử (primary)**, **xanh mint (thành công / năng lượng)**, **cam amber (cảnh báo / nhấn mạnh)**.

## Bảng màu đã áp dụng (Material 3–inspired)

| Token | Mã màu | Vai trò |
|--------|--------|---------|
| `background` | `#0A0F1C` | Nền chính — navy đậm, giảm mỏi mắt |
| `surface-container` | `#151D32` | Card, panel |
| `surface-container-high` | `#1E2840` | Header bảng, hover |
| `primary` | `#93C5FD` | Chữ/link nhấn |
| `primary-container` | `#2563EB` | Nút chính, logo mark |
| `on-primary-container` | `#EFF6FF` | Chữ trên nút primary |
| `secondary` | `#2DD4BF` | Trạng thái tích cực, accent phụ |
| `secondary-container` | `#0D9488` | Badge success, highlight |
| `tertiary` | `#FBBF24` | Cảnh báo nhẹ, deadline |
| `error` / `error-container` | đỏ hồng M3 | Lỗi, từ chối |
| `on-surface` | `#E8EDF8` | Chữ chính |
| `on-surface-variant` | `#A8B3CC` | Chữ phụ |
| `outline-variant` | `#3D4A66` | Viền |

## Gradient nền

- Góc trái: glow xanh `#2563EB` ~14% opacity (công nghệ).
- Góc phải: glow mint `#2DD4BF` ~10% (sáng tạo / hoàn thành).
- Lưới mờ 32px: tăng chiều sâu không làm rối UI.

## Typography

- **Geist** — tiêu đề, nhãn (rõ, hiện đại).
- **Inter** — nội dung dài, form.

## Gợi ý sử dụng theo vai trò

| Vai trò | Gợi ý |
|---------|--------|
| Participant | Nút primary xanh; badge trạng thái dùng `success` (mint) |
| Organizer | Surface container đậm hơn; nhóm menu theo `group` trong sidebar |
| Judge/Mentor | Accent secondary nhẹ trên card đội |

## Light mode (đã bật)

- Mặc định lưu trong `localStorage` key `seal.theme` (`light` | `dark`).
- Nút chuyển theme (icon mặt trời/trăng) trên header công khai, sidebar workspace và trang đăng nhập.
- Token màu qua CSS variables trong `FE/src/index.css` (`:root` = sáng, `html.dark` = tối).

## Kiểm tra nhanh

- Nút primary đọc được trên nền tối.
- Badge `warning` (vàng) và `danger` (đỏ) không trùng màu primary.
- Focus ring: `ring-primary/20` trên input/button.

Cấu hình nằm tại `Hackathon/FE/tailwind.config.js` và `Hackathon/FE/src/index.css`.
