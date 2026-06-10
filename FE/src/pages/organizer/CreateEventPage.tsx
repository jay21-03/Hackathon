import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invalidateAfterTeamMutation } from "../../lib/invalidateAppQueries";
import { useToast } from "../../components/feedback/ToastProvider";
import { Button, ButtonLink } from "../../components/ui/Button";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { enableAcademicTerms } from "../../config/features";
import { createEventSchemaForTerm } from "../../domain/schemas";
import { useActiveTerm } from "../../hooks/useActiveTerm";
import { createEvent } from "../../services/eventsApi";
import { toIsoFromLocal } from "../../utils/dateTimeInput";
import { zodFieldErrors } from "../../utils/zodFieldErrors";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";

export function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { termId, terms, loading: termsLoading } = useActiveTerm();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationStartAt, setRegistrationStartAt] = useState("");
  const [registrationEndAt, setRegistrationEndAt] = useState("");
  const [maxTeams, setMaxTeams] = useState(50);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [academicTermId, setAcademicTermId] = useState<number | "">(termId ?? "");

  useEffect(() => {
    if (termId != null && academicTermId === "") {
      setAcademicTermId(termId);
    }
  }, [termId, academicTermId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const resolvedTermId =
      academicTermId !== "" ? Number(academicTermId) : termId ?? 0;
    if (!resolvedTermId) {
      setFieldErrors({ academicTermId: "Chọn học kỳ trước khi tạo cuộc thi." });
      return;
    }
    const selectedTerm = terms.find((term) => term.id === resolvedTermId);
    const parsed = createEventSchemaForTerm(selectedTerm?.startDate, selectedTerm?.endDate).safeParse({
      name,
      description: description.trim() || undefined,
      startDate,
      endDate,
      registrationStartAt,
      registrationEndAt,
      maxTeams,
      academicTermId: resolvedTermId
    });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const created = await createEvent({
        name: parsed.data.name,
        description: parsed.data.description,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        registrationStartAt: toIsoFromLocal(parsed.data.registrationStartAt),
        registrationEndAt: toIsoFromLocal(parsed.data.registrationEndAt),
        maxTeams: parsed.data.maxTeams,
        academicTermId: parsed.data.academicTermId
      });
      notify("Đã tạo cuộc thi. Tiếp theo: chỉnh thông tin → tạo vòng/bảng → mở đăng ký.", "success");
      localStorage.setItem("seal.activeEventId", String(created.id));
      await invalidateAfterTeamMutation(queryClient);
      navigate("/organizer/events/basic-info", {
        state: {
          message:
            "Cuộc thi mới đã tạo. Bước tiếp: cập nhật quota/ngày thi, tạo vòng & bảng, rồi mở đăng ký."
        }
      });
    } catch (error) {
      applyApiFormErrors(error, setFieldErrors);
      notify(resolveApiError(error, "Không tạo được cuộc thi."), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Thiết lập"
        title="Tạo cuộc thi mới"
        description="Sau khi tạo, bạn được đưa tới trang chỉnh sửa để mở đăng ký và hoàn tất các bước thiết lập."
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
        {enableAcademicTerms ? (
          <label className="space-y-1">
            <span className="font-label-sm text-on-surface-variant">
              Học kỳ <span className="text-error">*</span>
            </span>
            <select
              required
              value={academicTermId}
              onChange={(e) => setAcademicTermId(e.target.value ? Number(e.target.value) : "")}
              disabled={termsLoading || terms.length === 0}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2"
            >
              {terms.length === 0 ? <option value="">Chưa có học kỳ — tạo tại mục Học kỳ</option> : null}
              {terms
                .filter((t) => t.status === "ACTIVE")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code}
                  </option>
                ))}
            </select>
            {fieldErrors.academicTermId ? (
              <p className="font-label-sm text-error">{fieldErrors.academicTermId}</p>
            ) : null}
          </label>
        ) : null}
        <TextField
          label="Tên cuộc thi"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <TextAreaField
          label="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
        />
        <div className="grid gap-md sm:grid-cols-2">
          <TextField
            label="Ngày bắt đầu"
            required
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={fieldErrors.startDate}
          />
          <TextField
            label="Ngày kết thúc"
            required
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={fieldErrors.endDate}
          />
        </div>
        <p className="font-body-sm text-on-surface-variant">
          Ngày và giờ hiển thị theo múi giờ trên máy bạn (datetime-local).
        </p>
        <div className="grid gap-md sm:grid-cols-2">
          <TextField
            label="Mở đăng ký"
            required
            type="datetime-local"
            value={registrationStartAt}
            onChange={(e) => setRegistrationStartAt(e.target.value)}
            error={fieldErrors.registrationStartAt}
          />
          <TextField
            label="Đóng đăng ký"
            required
            type="datetime-local"
            value={registrationEndAt}
            onChange={(e) => setRegistrationEndAt(e.target.value)}
            error={fieldErrors.registrationEndAt}
          />
        </div>
        <TextField
          label="Quota đội tối đa"
          required
          type="number"
          min={1}
          value={maxTeams}
          onChange={(e) => setMaxTeams(Number(e.target.value))}
          error={fieldErrors.maxTeams}
        />
        <div className="flex flex-wrap gap-sm pt-sm">
          <Button type="submit" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />}>
            {saving ? "Đang tạo" : "Tạo cuộc thi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
