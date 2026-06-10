import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { Badge } from "../../components/ui/Badge";

import { Button } from "../../components/ui/Button";

import { SelectField, TextField } from "../../components/ui/FormField";

import { Icon } from "../../components/ui/Icon";

import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";

import { PageHeader } from "../../components/ui/PageHeader";

import { WorkflowSteps } from "../../components/ui/WorkflowSteps";

import { TermDashboardPanel } from "../../components/organizer/TermDashboardPanel";

import { TermScopedResourcesPanel } from "../../components/organizer/TermScopedResourcesPanel";

import { useActiveTerm } from "../../hooks/useActiveTerm";

import { useTermHubProgress } from "../../hooks/useTermHubProgress";

import { queryKeys } from "../../lib/queryKeys";

import { fetchTermDashboard } from "../../services/academicTermService";

import {

  normalizeTermHubStep,

  resolveTermHubStep,

  type TermHubStep

} from "./termHubUtils";

import {

  createAcademicTerm,

  fetchAcademicTerms,

  updateAcademicTerm,

  type CreateAcademicTermPayload

} from "../../services/academicTermService";

import type { AcademicTerm, AcademicTermType } from "../../types/entities";

import { useToast } from "../../components/feedback/ToastProvider";

import { academicTermDateRangeSchema, academicTermFormSchema } from "../../domain/schemas";
import { applyApiFormErrors, resolveApiError } from "../../utils/apiError";
import { zodFieldErrors } from "../../utils/zodFieldErrors";



const TERM_TYPES: { value: AcademicTermType; label: string }[] = [

  { value: "SPRING", label: "Spring" },

  { value: "SUMMER", label: "Summer" },

  { value: "FALL", label: "Fall" }

];



type PageView = "create" | "list" | "insights";



function suggestCode(termType: AcademicTermType, year: number) {

  return `${termType}_${year}`;

}



function defaultFormState() {

  const year = new Date().getFullYear();

  const termType: AcademicTermType = "FALL";

  return {

    year,

    termType,

    startDate: `${year}-09-01`,

    endDate: `${year}-12-31`

  };

}



function PageTabs({

  view,

  onViewChange,

  hasTerms

}: {

  view: PageView;

  onViewChange: (view: PageView) => void;

  hasTerms: boolean;

}) {

  if (!hasTerms) return null;



  const tabs: { id: PageView; label: string; icon: string }[] = [

    { id: "list", label: "Danh sách", icon: "list" },

    { id: "insights", label: "Theo dõi kỳ", icon: "insights" }

  ];



  return (

    <div className="flex flex-wrap gap-xs border-b border-outline-variant">

      {tabs.map((tab) => (

        <button

          key={tab.id}

          type="button"

          className={`inline-flex items-center gap-2 border-b-2 px-md py-sm font-label-md transition-colors ${

            view === tab.id

              ? "border-primary text-primary"

              : "border-transparent text-on-surface-variant hover:text-on-surface"

          }`}

          onClick={() => onViewChange(tab.id)}

        >

          <Icon name={tab.icon} className="text-[18px]" />

          {tab.label}

        </button>

      ))}

    </div>

  );

}



export function AcademicTermManagementPage() {

  const { notify } = useToast();

  const queryClient = useQueryClient();

  const { termId, setTermId, enabled: termEnabled } = useActiveTerm();

  const [activeStep, setActiveStep] = useState<TermHubStep | null>(null);

  const [view, setView] = useState<PageView>("list");

  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editStartDate, setEditStartDate] = useState("");

  const [editEndDate, setEditEndDate] = useState("");

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editErrors, setEditErrors] = useState<Record<string, string>>({});



  const [formYear, setFormYear] = useState(() => defaultFormState().year);

  const [formTermType, setFormTermType] = useState<AcademicTermType>(() => defaultFormState().termType);

  const [formStartDate, setFormStartDate] = useState(() => defaultFormState().startDate);

  const [formEndDate, setFormEndDate] = useState(() => defaultFormState().endDate);



  const termsQuery = useQuery({

    queryKey: queryKeys.academicTerms.list(),

    queryFn: () => fetchAcademicTerms()

  });



  const terms = termsQuery.data ?? [];

  const hasTerms = terms.length > 0;



  const dashboardQuery = useQuery({

    queryKey: [...queryKeys.academicTerms.detail(termId), "dashboard"],

    queryFn: () => fetchTermDashboard(termId!),

    enabled: termEnabled && termId != null && view === "insights"

  });



  const { microSteps } = useTermHubProgress({

    stats: dashboardQuery.data ?? null,

    loading: dashboardQuery.isLoading

  });



  const currentStep = activeStep ?? resolveTermHubStep(microSteps);



  useEffect(() => {

    if (!termsQuery.isLoading && !hasTerms) {

      setView("create");

    }

  }, [termsQuery.isLoading, hasTerms]);



  useEffect(() => {

    const hash = window.location.hash;

    if (hash && hasTerms) {

      setActiveStep(normalizeTermHubStep(hash));

      setView("insights");

    }

  }, [hasTerms]);



  function goToStep(anchor: string) {

    const step = normalizeTermHubStep(anchor);

    setActiveStep(step);

    window.history.replaceState(null, "", `/organizer/academic-terms${step}`);

  }



  function resetForm() {

    const defaults = defaultFormState();

    setFormYear(defaults.year);

    setFormTermType(defaults.termType);

    setFormStartDate(defaults.startDate);

    setFormEndDate(defaults.endDate);

  }



  function applyFormTermType(type: AcademicTermType) {

    setFormTermType(type);

  }



  async function handleCreate(event: React.FormEvent) {

    event.preventDefault();

    const parsed = academicTermFormSchema.safeParse({
      year: formYear,
      termType: formTermType,
      startDate: formStartDate,
      endDate: formEndDate
    });
    if (!parsed.success) {
      setFormErrors(zodFieldErrors(parsed.error));
      notify(parsed.error.issues[0]?.message ?? "Dữ liệu học kỳ không hợp lệ.", "warning");
      return;
    }
    setFormErrors({});
    setSaving(true);

    const payload: CreateAcademicTermPayload = {

      code: suggestCode(parsed.data.termType, parsed.data.year),

      name: suggestCode(parsed.data.termType, parsed.data.year),

      year: parsed.data.year,

      termType: parsed.data.termType,

      startDate: parsed.data.startDate,

      endDate: parsed.data.endDate,

      status: "ACTIVE"

    };

    try {

      const created = await createAcademicTerm(payload);

      await queryClient.invalidateQueries({ queryKey: queryKeys.academicTerms.all });

      setTermId(created.id);

      resetForm();

      setView("list");

      notify("Đã tạo học kỳ. Bước tiếp: tạo cuộc thi và gắn vào kỳ này.", "success");

    } catch (error) {
      applyApiFormErrors(error, setFormErrors);
      notify(resolveApiError(error, "Không tạo được học kỳ."), "danger");
    } finally {
      setSaving(false);
    }
  }



  function startEdit(term: AcademicTerm) {

    setEditingId(term.id);

    setEditStartDate(term.startDate);

    setEditEndDate(term.endDate);

  }



  async function saveEdit(id: number) {

    const parsed = academicTermDateRangeSchema.safeParse({
      startDate: editStartDate,
      endDate: editEndDate
    });
    if (!parsed.success) {
      setEditErrors(zodFieldErrors(parsed.error));
      notify(parsed.error.issues[0]?.message ?? "Thời gian học kỳ không hợp lệ.", "warning");
      return;
    }
    setEditErrors({});
    setSaving(true);

    try {

      await updateAcademicTerm(id, {

        startDate: parsed.data.startDate,

        endDate: parsed.data.endDate

      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.academicTerms.all });

      setEditingId(null);

      notify("Đã cập nhật học kỳ.", "success");

    } catch (error) {
      applyApiFormErrors(error, setEditErrors);
      notify(resolveApiError(error, "Không cập nhật được học kỳ."), "danger");
    } finally {
      setSaving(false);
    }
  }



  async function archiveTerm(term: AcademicTerm) {

    try {

      await updateAcademicTerm(term.id, { status: "ARCHIVED" });

      await queryClient.invalidateQueries({ queryKey: queryKeys.academicTerms.all });

      notify(`Đã lưu trữ ${term.code}.`, "success");

    } catch (error) {

      notify(resolveApiError(error, "Không lưu trữ được học kỳ."), "danger");

    }

  }



  if (termsQuery.isLoading) {

    return <ModuleSkeleton rows={4} />;

  }



  const headerAction =

    view === "create" && hasTerms ? (

      <Button type="button" variant="ghost" icon={<Icon name="arrow_back" />} onClick={() => setView("list")}>

        Quay lại danh sách

      </Button>

    ) : hasTerms && view !== "create" ? (

      <Button type="button" icon={<Icon name="add_circle" />} onClick={() => setView("create")}>

        Thêm học kỳ

      </Button>

    ) : null;



  return (

    <div className="space-y-lg">

      <PageHeader

        eyebrow="Quản trị"

        title="Học kỳ"

        description={

          hasTerms

            ? "Quản lý danh sách kỳ và theo dõi số liệu cuộc thi theo từng kỳ."

            : "Bắt đầu bằng việc tạo học kỳ đầu tiên — sau đó gắn cuộc thi để lọc báo cáo."

        }

        actions={headerAction}

      />



      <PageTabs
        view={view}
        hasTerms={hasTerms}
        onViewChange={(next) => {
          if (next === "insights") {
            const active = terms.find((t) => t.status === "ACTIVE") ?? terms[0];
            if (active) setTermId(active.id);
          }
          setView(next);
        }}
      />



      {view === "create" ? (

        <form

          onSubmit={(e) => void handleCreate(e)}

          className="mx-auto max-w-xl space-y-lg rounded-xl border border-outline-variant bg-surface-container p-lg"

        >

          <div className="space-y-xs">

            <h2 className="font-headline-sm text-on-surface">

              {hasTerms ? "Thêm học kỳ" : "Tạo học kỳ đầu tiên"}

            </h2>

            <p className="font-body-sm text-on-surface-variant">

              Điền thông tin bên dưới. Mã kỳ tự tạo theo loại kỳ và năm.

            </p>

          </div>



          {!hasTerms ? (

            <ol className="grid gap-sm sm:grid-cols-3">

              {[

                { step: "1", label: "Tạo học kỳ", active: true },

                { step: "2", label: "Tạo cuộc thi", active: false },

                { step: "3", label: "Theo dõi kỳ", active: false }

              ].map((item) => (

                <li

                  key={item.step}

                  className={`rounded-lg border px-sm py-xs text-center font-label-sm ${

                    item.active

                      ? "border-primary bg-primary-container/30 text-on-surface"

                      : "border-outline-variant text-on-surface-variant"

                  }`}

                >

                  <span className="font-mono-data">{item.step}.</span> {item.label}

                </li>

              ))}

            </ol>

          ) : null}



          <div className="space-y-md">

            <div className="grid gap-md sm:grid-cols-2">

              <SelectField

                label="Loại kỳ"

                value={formTermType}

                onChange={(e) => applyFormTermType(e.target.value as AcademicTermType)}

              >

                {TERM_TYPES.map((item) => (

                  <option key={item.value} value={item.value}>

                    {item.label}

                  </option>

                ))}

              </SelectField>

              <TextField

                label="Năm"

                type="number"

                required

                value={formYear}

                onChange={(e) => setFormYear(Number(e.target.value))}

              />

            </div>



            <div className="rounded-lg bg-surface-container-high px-md py-sm">

              <p className="font-label-sm text-on-surface-variant">Mã kỳ</p>

              <p className="font-mono-data text-on-surface">{suggestCode(formTermType, formYear)}</p>

            </div>



            <div className="grid gap-md sm:grid-cols-2">

              <TextField

                label="Ngày bắt đầu"

                type="date"

                required

                value={formStartDate}

                error={formErrors.startDate}

                onChange={(e) => {
                  setFormStartDate(e.target.value);
                  setFormErrors((prev) => ({ ...prev, startDate: "" }));
                }}

              />

              <TextField

                label="Ngày kết thúc"

                type="date"

                required

                value={formEndDate}

                error={formErrors.endDate}

                onChange={(e) => {
                  setFormEndDate(e.target.value);
                  setFormErrors((prev) => ({ ...prev, endDate: "" }));
                }}

              />

            </div>

          </div>



          <div className="flex flex-wrap gap-sm">

            <Button type="submit" disabled={saving} icon={<Icon name={saving ? "sync" : "save"} />}>

              {saving ? "Đang lưu…" : "Lưu học kỳ"}

            </Button>

            {hasTerms ? (

              <Button type="button" variant="ghost" onClick={() => setView("list")}>

                Hủy

              </Button>

            ) : null}

          </div>



          {!hasTerms ? (

            <p className="font-body-sm text-on-surface-variant">

              Sau khi lưu, vào{" "}

              <Link to="/organizer/events/new" className="text-primary hover:underline">

                Tạo cuộc thi

              </Link>{" "}

              và chọn học kỳ vừa tạo.

            </p>

          ) : null}

        </form>

      ) : null}



      {view === "list" && hasTerms ? (

        <section className="space-y-md">

          <div className="overflow-x-auto rounded-xl border border-outline-variant">

            <table className="min-w-full text-left font-body-md">

              <thead className="bg-surface-container-high font-label-md text-on-surface-variant">

                <tr>

                  <th className="px-md py-sm">Mã kỳ</th>

                  <th className="px-md py-sm">Loại</th>

                  <th className="px-md py-sm">Thời gian</th>

                  <th className="px-md py-sm">Cuộc thi</th>

                  <th className="px-md py-sm">Trạng thái</th>

                  <th className="px-md py-sm" />

                </tr>

              </thead>

              <tbody>

                {terms.map((term) => (

                  <tr key={term.id} className="border-t border-outline-variant/60">

                    <td className="px-md py-sm font-mono text-sm">{term.code}</td>

                    <td className="px-md py-sm">{term.termType}</td>

                    <td className="px-md py-sm text-on-surface-variant">

                      {editingId === term.id ? (

                        <div className="flex flex-col gap-1">

                          <input

                            type="date"

                            value={editStartDate}

                            onChange={(e) => setEditStartDate(e.target.value)}

                            className="rounded border border-outline-variant px-2 py-1"

                          />

                          <input

                            type="date"

                            value={editEndDate}

                            onChange={(e) => setEditEndDate(e.target.value)}

                            className="rounded border border-outline-variant px-2 py-1"

                          />

                        </div>

                      ) : (

                        `${term.startDate} → ${term.endDate}`

                      )}

                    </td>

                    <td className="px-md py-sm">{term.eventCount ?? 0}</td>

                    <td className="px-md py-sm">

                      <Badge tone={term.status === "ACTIVE" ? "success" : "neutral"}>

                        {term.status === "ACTIVE" ? "Đang hoạt động" : "Đã lưu trữ"}

                      </Badge>

                    </td>

                    <td className="px-md py-sm">

                      <div className="flex flex-wrap gap-1">

                        {editingId === term.id ? (

                          <>

                            <Button type="button" variant="ghost" onClick={() => void saveEdit(term.id)}>

                              Lưu

                            </Button>

                            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>

                              Hủy

                            </Button>

                          </>

                        ) : (

                          <>

                            <Button

                              type="button"

                              variant="ghost"

                              onClick={() => startEdit(term)}

                              icon={<Icon name="edit" />}

                            >

                              Sửa

                            </Button>

                            {term.status === "ACTIVE" ? (

                              <Button

                                type="button"

                                variant="ghost"

                                onClick={() => {

                                  setTermId(term.id);

                                  setView("insights");

                                  setActiveStep("#term-step-overview");

                                }}

                              >

                                Theo dõi

                              </Button>

                            ) : null}

                          </>

                        )}

                        {term.status === "ACTIVE" && editingId !== term.id ? (

                          <Button

                            type="button"

                            variant="ghost"

                            onClick={() => void archiveTerm(term)}

                            icon={<Icon name="archive" />}

                          >

                            Lưu trữ

                          </Button>

                        ) : null}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>



        </section>

      ) : null}



      {view === "insights" && termEnabled && termId ? (

        <section className="space-y-md">

          <WorkflowSteps

            title="Theo dõi học kỳ đang chọn"

            description="Chọn một mục để xem dữ liệu gom theo kỳ."

            activeHref={currentStep}

            onStepSelect={(href) => goToStep(href)}

            steps={microSteps.map((step) => ({

              label: step.label,

              detail: step.detail,

              href: step.anchor,

              state: step.state

            }))}

          />



          {currentStep === "#term-step-overview" ? <TermDashboardPanel /> : null}

          {currentStep !== "#term-step-overview" ? (

            <TermScopedResourcesPanel hubStep={currentStep} />

          ) : null}

        </section>

      ) : null}



      {view === "insights" && (!termEnabled || !termId) ? (

        <p className="font-body-sm text-on-surface-variant">Chọn học kỳ đang hoạt động trong danh sách để theo dõi.</p>

      ) : null}

    </div>

  );

}


