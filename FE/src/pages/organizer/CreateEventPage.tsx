import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "../../lib/queryKeys";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { createEvent } from "../../services/eventsApi";
import { getApiErrorMessage } from "../../utils/apiError";

function toIsoFromLocal(value: string) {
  return new Date(value).toISOString();
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStartAt, setRegistrationStartAt] = useState("");
  const [registrationEndAt, setRegistrationEndAt] = useState("");
  const [maxTeams, setMaxTeams] = useState(50);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !startDate || !endDate || !registrationStartAt || !registrationEndAt) {
      notify("Vui lòng điền đầy đủ các trường bắt buộc.", "warning");
      return;
    }
    setSaving(true);
    try {
      const created = await createEvent({
        name: name.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        registrationStartAt: toIsoFromLocal(registrationStartAt),
        registrationEndAt: toIsoFromLocal(registrationEndAt),
        maxTeams
      });
      notify("Đã tạo cuộc thi.", "success");
      localStorage.setItem("seal.activeEventId", String(created.id));
      await queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      navigate("/organizer/events/wizard");
    } catch (error) {
      notify(getApiErrorMessage(error, "Không tạo được cuộc thi."), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thiết lập"
        title="Tạo cuộc thi mới"
        description="Sau khi tạo, tiếp tục cấu hình đăng ký, bảng thi và đề trong quy trình thiết lập."
        actions={
          <ButtonLink to="/organizer/events" variant="ghost" icon={<Icon name="arrow_back" />}>
            Danh sách
          </ButtonLink>
        }
      />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="max-w-2xl space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg"
      >
        <label className="flex flex-col gap-xs">
          <span className="font-label-sm normal-case text-on-surface-variant">Tên cuộc thi *</span>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-xs">
          <span className="font-label-sm normal-case text-on-surface-variant">Mô tả</span>
          <textarea className="form-input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid gap-md sm:grid-cols-2">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Ngày bắt đầu *</span>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Ngày kết thúc *</span>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </label>
        </div>
        <div className="grid gap-md sm:grid-cols-2">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Mở đăng ký *</span>
            <input
              type="datetime-local"
              className="form-input"
              value={registrationStartAt}
              onChange={(e) => setRegistrationStartAt(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Đóng đăng ký *</span>
            <input
              type="datetime-local"
              className="form-input"
              value={registrationEndAt}
              onChange={(e) => setRegistrationEndAt(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="flex flex-col gap-xs">
          <span className="font-label-sm normal-case text-on-surface-variant">Quota đội tối đa *</span>
          <input
            type="number"
            min={1}
            className="form-input"
            value={maxTeams}
            onChange={(e) => setMaxTeams(Number(e.target.value))}
            required
          />
        </label>
        <div className="flex flex-wrap gap-sm pt-sm">
          <Button type="submit" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />}>
            {saving ? "Đang tạo" : "Tạo cuộc thi"}
          </Button>
          <ButtonLink to="/organizer/events/wizard" variant="secondary">
            Bỏ qua — xem quy trình
          </ButtonLink>
        </div>
      </form>
    </div>
  );
}
