import type { UserRole } from "../auth/authSession";
import { getRoleHome, roleLabels } from "../auth/authSession";
import type { EventListItem } from "../types/entities";
import type { TeamDetailResponse } from "../services/registrationService";
import { getStatusLabel } from "./status";
import {
  canRegisterForEvent,
  isRegistrationStatusOpen,
  isWithinRegistrationWindow,
  registrationWindowHint
} from "../utils/registrationErrors";

export type EventCardAction = {
  label: string;
  to: string;
  icon: string;
  hint: string;
};

export function isEventRegistrationOpen(event: EventListItem) {
  return canRegisterForEvent(
    event.status,
    event.registrationStartAt,
    event.registrationEndAt
  );
}

/** Lọc «Đang mở đăng ký»: theo trạng thái BTC (có thể ngoài khung giờ). */
export function isEventRegistrationListed(event: EventListItem) {
  return isRegistrationStatusOpen(event.status);
}

export function eventListFilter(
  event: EventListItem,
  filter: "all" | "open" | "upcoming"
) {
  if (filter === "all") return true;
  if (filter === "open") {
    return isEventRegistrationListed(event);
  }
  return (
    !isRegistrationStatusOpen(event.status) &&
    !isEventRegistrationOpen(event)
  );
}

export type EventActionSurface = "list" | "detail";

export function resolveEventCardAction(input: {
  authenticated: boolean;
  role: UserRole;
  event: EventListItem;
  /** Đội của user trong đúng cuộc thi này — không phải cuộc thi khác */
  team: TeamDetailResponse | null | undefined;
  /** Danh sách luôn dẫn tới chi tiết trước; trang chi tiết mới có CTA đăng ký */
  surface?: EventActionSurface;
}): EventCardAction {
  const { authenticated, role, event, team, surface = "list" } = input;
  const detailTo = `/events/${event.id}`;

  if (!authenticated) {
    return {
      label: "Đăng nhập",
      to: "/login",
      icon: "account_circle",
      hint: "Đăng nhập để đăng ký hoặc vào khu vực thi"
    };
  }

  if (role !== "participant") {
    const home = getRoleHome(role);
    return {
      label: `Vào ${roleLabels[role]}`,
      to: home,
      icon: "dashboard",
      hint: "Mở không gian làm việc theo vai trò của bạn"
    };
  }

  if (team) {
    return {
      label: "Tiếp tục",
      to: "/me",
      icon: "dashboard",
      hint: `Đội ${team.name} · ${getStatusLabel(team.status)}`
    };
  }

  if (isRegistrationStatusOpen(event.status)) {
    const inWindow = isWithinRegistrationWindow(
      event.registrationStartAt,
      event.registrationEndAt
    );
    const windowMsg = registrationWindowHint(
      event.registrationStartAt,
      event.registrationEndAt
    );
    if (surface === "detail") {
      return {
        label: "Đăng ký tham gia",
        to: `/events/${event.id}/register`,
        icon: "group_add",
        hint: inWindow
          ? "Tạo đội và mời thành viên"
          : windowMsg ?? "BTC đã mở — xem khung thời gian đăng ký"
      };
    }
    return {
      label: "Xem chi tiết",
      to: detailTo,
      icon: "arrow_forward",
      hint: inWindow
        ? "Xem thông tin cuộc thi, sau đó đăng ký đội"
        : windowMsg ?? "BTC đã mở — xem chi tiết và khung đăng ký"
    };
  }

  const status = (event.status ?? "").toUpperCase();
  if (status === "DRAFT") {
    return {
      label: "Xem chi tiết",
      to: detailTo,
      icon: "arrow_forward",
      hint: "Cuộc thi chưa mở đăng ký"
    };
  }

  return {
    label: "Xem chi tiết",
    to: detailTo,
    icon: "arrow_forward",
    hint: "Đăng ký đã đóng hoặc chưa mở"
  };
}
