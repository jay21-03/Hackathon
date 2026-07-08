import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../feedback/ToastProvider";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";
import { ModuleSkeleton } from "../../ui/ModuleSkeleton";
import { enableAcademicTerms } from "../../../config/features";
import { useActiveTerm } from "../../../hooks/useActiveTerm";
import {
  fetchAcademicTerms,
  fetchTermJudgeCandidates,
  fetchTermJudges,
  fetchTermMentorCandidates,
  fetchTermMentors,
  type TermUserSummary
} from "../../../services/academicTermService";
import { staffCarryoverSchema } from "../../../domain/schemas";
import { firstZodError } from "../../../utils/zodFieldErrors";
import { carryoverStaffForEvent } from "../../../services/staffCarryoverService";
import type { StaffRole } from "../../../services/staffInvitationService";
import { resolveApiError } from "../../../utils/apiError";

type CarryoverRole = StaffRole;

interface CarryoverPerson {
  id: number;
  email: string;
  fullName: string;
  role: CarryoverRole;
  inCurrentTerm: boolean;
}

interface StaffCarryoverSectionProps {
  eventId: number;
  currentTermId: number | null | undefined;
  currentTermLabel?: string | null;
  onApplied?: () => void;
}

const EMPTY_TERMS: Awaited<ReturnType<typeof fetchAcademicTerms>> = [];
const EMPTY_ROSTER_PEOPLE: CarryoverPerson[] = [];

function roleLabel(role: CarryoverRole) {
  return role === "JUDGE" ? "Giám khảo" : "Mentor";
}

function sameSet(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function StaffCarryoverSection({
  eventId,
  currentTermId,
  currentTermLabel,
  onApplied
}: StaffCarryoverSectionProps) {
  const { notify } = useToast();
  const { terms: activeTerms } = useActiveTerm();
  const [sourceTermId, setSourceTermId] = useState<number | "">("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | CarryoverRole>("ALL");
  const [newTermFilter, setNewTermFilter] = useState<"ALL" | "ABSENT" | "PRESENT">("ALL");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const termsQuery = useQuery({
    queryKey: ["academic-terms", "carryover"],
    queryFn: () => fetchAcademicTerms(),
    enabled: enableAcademicTerms
  });

  const sourceTerms = useMemo(() => {
    const all = termsQuery.data ?? activeTerms ?? EMPTY_TERMS;
    return all.filter((term) => term.id !== currentTermId);
  }, [termsQuery.data, activeTerms, currentTermId]);

  useEffect(() => {
    if (sourceTermId === "" && sourceTerms.length > 0) {
      const previous =
        sourceTerms.find((t) => t.status === "ARCHIVED") ??
        sourceTerms[sourceTerms.length - 1];
      setSourceTermId(previous?.id ?? "");
    }
  }, [sourceTerms, sourceTermId]);

  const sourceId = sourceTermId === "" ? null : sourceTermId;

  const rosterQuery = useQuery({
    queryKey: ["staff-carryover", sourceId, currentTermId],
    enabled: Boolean(sourceId && currentTermId),
    queryFn: async () => {
      const pageSize = 100;
      const [srcJudges, srcMentors, curJudgeCandidates, curMentorCandidates] = await Promise.all([
        fetchTermJudges(sourceId!, 0, pageSize),
        fetchTermMentors(sourceId!, 0, pageSize),
        currentTermId ? fetchTermJudgeCandidates(currentTermId, 0, pageSize) : null,
        currentTermId ? fetchTermMentorCandidates(currentTermId, 0, pageSize) : null
      ]);
      const truncated =
        (srcJudges?.totalElements ?? 0) > pageSize ||
        (srcMentors?.totalElements ?? 0) > pageSize;
      const currentJudgeIds = new Set((curJudgeCandidates?.items ?? []).map((u) => u.id));
      const currentMentorIds = new Set((curMentorCandidates?.items ?? []).map((u) => u.id));
      const people: CarryoverPerson[] = [];
      const push = (users: TermUserSummary[] | undefined, role: CarryoverRole) => {
        for (const user of users ?? []) {
          const inCurrentTerm =
            role === "JUDGE" ? currentJudgeIds.has(user.id) : currentMentorIds.has(user.id);
          people.push({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role,
            inCurrentTerm
          });
        }
      };
      push(srcJudges?.items, "JUDGE");
      push(srcMentors?.items, "MENTOR");
      const byKey = new Map<string, CarryoverPerson>();
      for (const person of people) {
        const key = `${person.email.toLowerCase()}::${person.role}`;
        if (!byKey.has(key)) byKey.set(key, person);
      }
      return {
        people: [...byKey.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "vi")),
        truncated
      };
    }
  });

  const rosterPeople = rosterQuery.data?.people ?? EMPTY_ROSTER_PEOPLE;
  const rosterTruncated = rosterQuery.data?.truncated ?? false;

  const filteredPeople = useMemo(() => {
    const list = rosterPeople;
    const nameQuery = nameFilter.trim().toLowerCase();
    const emailQuery = emailFilter.trim().toLowerCase();
    return list.filter((person) => {
      if (roleFilter !== "ALL" && person.role !== roleFilter) return false;
      if (newTermFilter === "ABSENT" && person.inCurrentTerm) return false;
      if (newTermFilter === "PRESENT" && !person.inCurrentTerm) return false;
      if (nameQuery && !person.fullName.toLowerCase().includes(nameQuery)) return false;
      if (emailQuery && !person.email.toLowerCase().includes(emailQuery)) return false;
      return true;
    });
  }, [rosterPeople, roleFilter, newTermFilter, nameFilter, emailFilter]);

  const selectablePeople = useMemo(
    () => filteredPeople.filter((p) => !p.inCurrentTerm),
    [filteredPeople]
  );

  const selectedSelectableCount = useMemo(
    () =>
      selectablePeople.filter((p) =>
        selectedIds.has(`${p.email.toLowerCase()}::${p.role}`)
      ).length,
    [selectablePeople, selectedIds]
  );

  useEffect(() => {
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, [sourceId]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const validKeys = new Set(
        rosterPeople.map((p) => `${p.email.toLowerCase()}::${p.role}`)
      );
      const next = new Set<string>();
      for (const key of prev) {
        if (validKeys.has(key)) next.add(key);
      }
      return sameSet(prev, next) ? prev : next;
    });
  }, [roleFilter, newTermFilter, nameFilter, emailFilter, rosterPeople]);

  function togglePerson(key: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function selectAllSelectable() {
    setSelectedIds(new Set(selectablePeople.map((p) => `${p.email.toLowerCase()}::${p.role}`)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleApply() {
    const chosen = selectablePeople.filter((p) =>
      selectedIds.has(`${p.email.toLowerCase()}::${p.role}`)
    );
    if (chosen.length === 0) {
      notify("Chọn ít nhất một giám khảo hoặc mentor.", "warning");
      return;
    }
    const roles = new Set(chosen.map((p) => p.role));
    const defaultRole: CarryoverRole = roles.size === 1 ? [...roles][0]! : "JUDGE";
    const payload = {
      sourceTermId: sourceId ?? undefined,
      defaultRole,
      items: chosen.map((p) => ({ userId: p.id, role: p.role }))
    };
    const parsed = staffCarryoverSchema.safeParse(payload);
    if (!parsed.success) {
      notify(firstZodError(parsed.error), "warning");
      return;
    }
    setBusy(true);
    try {
      const result = await carryoverStaffForEvent(eventId, parsed.data);
      if (result.failedCount > 0) {
        notify(
          `Đã chuyển ${result.succeededCount}/${result.total} người. ${result.failedCount} lỗi.`,
          result.succeededCount > 0 ? "warning" : "danger"
        );
      } else {
        notify(`Đã chuyển ${result.succeededCount} người sang kỳ mới.`, "success");
      }
      onApplied?.();
      await rosterQuery.refetch();
    } catch (err) {
      notify(resolveApiError(err, "Không chuyển được staff."), "danger");
    } finally {
      setBusy(false);
    }
  }

  if (!enableAcademicTerms) {
    return (
      <EmptyState
        icon="history"
        title="Chưa bật quản lý học kỳ"
        description="Bật tính năng học kỳ để chuyển giám khảo/mentor từ kỳ trước."
      />
    );
  }

  if (!currentTermId) {
    return (
      <EmptyState
        icon="calendar_month"
        title="Cuộc thi chưa gắn học kỳ"
        description="Gán học kỳ cho cuộc thi trong Thông tin cuộc thi trước khi chuyển staff."
      />
    );
  }

  if (termsQuery.isLoading) {
    return <ModuleSkeleton rows={5} variant="table" />;
  }

  if (sourceTerms.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="Chưa có học kỳ trước"
        description="Cần ít nhất một học kỳ khác để lấy danh sách giám khảo/mentor cũ."
      />
    );
  }

  return (
    <div className="space-y-lg">
      {rosterTruncated ? (
        <p className="rounded-lg border border-warning/40 bg-warning-container/25 px-md py-sm font-body-sm text-on-surface">
          Danh sách học kỳ nguồn có hơn 100 người — chỉ hiển thị 100 đầu. Dùng bộ lọc hoặc liên hệ quản trị nếu thiếu tên.
        </p>
      ) : null}
      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-xs font-body-sm">
          Học kỳ nguồn
          <select
            className="w-full rounded-lg border border-outline-variant p-sm"
            value={sourceTermId}
            onChange={(e) => setSourceTermId(Number(e.target.value))}
          >
            <option value="">Chọn học kỳ</option>
            {sourceTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.code})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-xs font-body-sm">
          Học kỳ mới (đích)
          <input
            className="w-full rounded-lg border border-outline-variant bg-surface-container-high p-sm text-on-surface-variant"
            value={currentTermLabel ?? "Học kỳ của cuộc thi hiện tại"}
            readOnly
          />
        </label>
        <label className="space-y-xs font-body-sm">
          Vai trò
          <select
            className="w-full rounded-lg border border-outline-variant p-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "ALL" | CarryoverRole)}
          >
            <option value="ALL">Tất cả</option>
            <option value="JUDGE">Giám khảo</option>
            <option value="MENTOR">Mentor</option>
          </select>
        </label>
        <label className="space-y-xs font-body-sm">
          Trạng thái ở kỳ mới
          <select
            className="w-full rounded-lg border border-outline-variant p-sm"
            value={newTermFilter}
            onChange={(e) => setNewTermFilter(e.target.value as "ALL" | "ABSENT" | "PRESENT")}
          >
            <option value="ALL">Tất cả</option>
            <option value="ABSENT">Chưa có — có thể chuyển</option>
            <option value="PRESENT">Đã có ở kỳ mới</option>
          </select>
        </label>
        <label className="space-y-xs font-body-sm">
          Lọc họ tên
          <input
            type="search"
            className="w-full rounded-lg border border-outline-variant p-sm"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Nhập tên..."
          />
        </label>
        <label className="space-y-xs font-body-sm">
          Lọc email
          <input
            type="search"
            className="w-full rounded-lg border border-outline-variant p-sm"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="email@fpt.edu.vn"
          />
        </label>
      </div>

      <p className="font-body-sm text-on-surface-variant">
        Chọn người từ học kỳ cũ rồi bấm <strong>Chuyển đã chọn</strong> — hệ thống đưa họ vào pool kỳ mới{" "}
        <em>không gửi email</em>. Sau đó BTC gán thủ công tại <em>Quản lý bảng thi</em>.
      </p>

      {sourceId == null ? (
        <EmptyState
          icon="history"
          title="Chọn học kỳ nguồn"
          description="Hệ thống sẽ liệt kê giám khảo và mentor đã tham gia kỳ đó để bạn tick chọn."
        />
      ) : rosterQuery.isLoading ? (
        <ModuleSkeleton rows={5} variant="table" />
      ) : rosterQuery.isError ? (
        <EmptyState
          icon="error"
          title="Không tải được danh sách"
          description={resolveApiError(rosterQuery.error, "Thử lại sau.")}
        />
      ) : filteredPeople.length === 0 ? (
        <EmptyState
          icon="group"
          title="Không có kết quả"
          description="Không có giám khảo/mentor khớp bộ lọc. Thử đổi học kỳ nguồn hoặc bộ lọc tên/email."
        />
      ) : (
        <section className="space-y-md rounded-xl border border-outline-variant p-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <h2 className="font-headline-sm">Danh sách từ kỳ cũ</h2>
              <p className="mt-xs font-body-sm text-on-surface-variant">
                {filteredPeople.length} người · đã chọn {selectedSelectableCount} · có thể chuyển{" "}
                {selectablePeople.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Button variant="secondary" size="sm" type="button" onClick={selectAllSelectable}>
                Chọn tất cả có thể chuyển
              </Button>
              <Button variant="secondary" size="sm" type="button" onClick={clearSelection}>
                Bỏ chọn tất cả
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="min-w-full text-left">
              <thead className="table-header-bg">
                <tr className="font-label-sm text-on-surface-variant">
                  <th className="w-12 px-md py-sm text-center">Chọn</th>
                  <th className="px-md py-sm">Họ tên</th>
                  <th className="px-md py-sm">Email</th>
                  <th className="px-md py-sm">Vai trò kỳ cũ</th>
                  <th className="px-md py-sm">Kỳ mới</th>
                </tr>
              </thead>
              <tbody className="table-divider font-body-sm">
                {filteredPeople.map((person) => {
                  const key = `${person.email.toLowerCase()}::${person.role}`;
                  const checked = selectedIds.has(key);
                  return (
                    <tr
                      key={key}
                      className={checked ? "bg-primary-container/20" : undefined}
                    >
                      <td className="px-md py-sm text-center">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-outline-variant"
                          checked={checked}
                          disabled={person.inCurrentTerm}
                          onChange={(e) => togglePerson(key, e.target.checked)}
                          aria-label={`Chọn ${person.fullName}`}
                        />
                      </td>
                      <td className="px-md py-sm font-medium">{person.fullName}</td>
                      <td className="px-md py-sm">{person.email}</td>
                      <td className="px-md py-sm">
                        <Badge tone={person.role === "JUDGE" ? "active" : "neutral"}>
                          {roleLabel(person.role)}
                        </Badge>
                      </td>
                      <td className="px-md py-sm">
                        {person.inCurrentTerm ? (
                          <Badge tone="success">Đã có ở kỳ mới</Badge>
                        ) : (
                          <span className="text-on-surface-variant">Chưa có</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-md border-t border-outline-variant pt-md">
            <p className="font-body-sm text-on-surface-variant">
              Chuyển {selectedSelectableCount} người đã chọn sang pool học kỳ mới (không gửi email).
            </p>
            <Button
              type="button"
              loading={busy}
              disabled={selectedSelectableCount === 0}
              onClick={() => void handleApply()}
            >
              Chuyển đã chọn
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
