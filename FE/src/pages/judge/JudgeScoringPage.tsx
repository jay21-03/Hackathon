import { useMemo, useState } from "react";
import { ConfirmAction } from "../../components/feedback/ConfirmAction";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { validateRubricScores, type RubricCriterion } from "../../domain/businessRules";
import { getStatusLabel, getStatusTone } from "../../domain/status";
import { baseRubric, demoTeams } from "../../services/demoDataService";

export function JudgeScoringPage() {
  const { notify } = useToast();
  const [teamId, setTeamId] = useState(demoTeams[0].id);
  const [criteria, setCriteria] = useState<RubricCriterion[]>(baseRubric);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("DRAFT");
  const [errors, setErrors] = useState<string[]>([]);
  const selectedTeam = demoTeams.find((team) => team.id === teamId) ?? demoTeams[0];

  const total = useMemo(
    () => criteria.reduce((sum, criterion) => sum + Number(criterion.score || 0), 0),
    [criteria]
  );

  function updateScore(index: number, value: string) {
    const score = Number(value);
    setCriteria((current) =>
      current.map((criterion, i) => (i === index ? { ...criterion, score } : criterion))
    );
  }

  function validate() {
    const result = validateRubricScores(criteria);
    setErrors(result.errors);
    return result.valid;
  }

  function saveDraft() {
    if (!validate()) {
      notify("Diem rubric chua hop le.", "warning");
      return;
    }
    setStatus("DRAFT");
    notify("Da luu ban nhap phieu cham.", "success");
  }

  function submitScore() {
    if (!validate()) return;
    setStatus("SUBMITTED");
    notify("Da submit diem chinh thuc.", "success");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-lg">
      <section className="flex flex-col gap-md border-b border-outline-variant pb-lg md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-sm normal-case text-primary">Phieu cham diem</p>
          <h1 className="font-headline-lg text-on-surface">{selectedTeam.name}</h1>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Giam khao chi cham cac doi thuoc bang duoc phan cong. Diem phai nam trong min/max rubric.
          </p>
        </div>
        <Badge tone={getStatusTone(status)}>{getStatusLabel(status)}</Badge>
      </section>

      <div className="grid gap-lg lg:grid-cols-[1fr_280px]">
        <section className="space-y-md rounded-xl border border-outline-variant bg-surface-container p-lg">
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm normal-case text-on-surface-variant">Doi can cham</span>
            <select
              value={teamId}
              onChange={(event) => setTeamId(Number(event.target.value))}
              className="form-input"
            >
              {demoTeams
                .filter((team) => team.status === "CONFIRMED")
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} - {team.board}
                  </option>
                ))}
            </select>
          </label>

          <div className="space-y-sm">
            {criteria.map((criterion, index) => (
              <div
                key={criterion.name}
                className="grid gap-sm rounded-lg border border-outline-variant bg-surface-container-low p-md md:grid-cols-[1fr_120px]"
              >
                <div>
                  <p className="font-label-md text-on-surface">{criterion.name}</p>
                  <p className="font-body-sm text-on-surface-variant">
                    Khoang diem {criterion.min}-{criterion.max}
                  </p>
                </div>
                <input
                  data-testid={`rubric-score-${index}`}
                  type="number"
                  value={criterion.score}
                  onChange={(event) => updateScore(index, event.target.value)}
                  className="form-input"
                />
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-error/40 bg-error-container/70 p-md text-on-error-container">
              {errors.map((error) => (
                <p key={error} className="font-body-sm">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-sm">
            <Button type="button" variant="ghost" onClick={saveDraft} data-testid="save-score">
              Luu nhap
            </Button>
            <ConfirmAction
              title="Submit diem chinh thuc"
              message="Ranking chi tinh cac score sheet da submit. Hay kiem tra rubric truoc khi xac nhan."
              confirmLabel="Submit diem"
              onConfirm={submitScore}
            >
              <button
                type="button"
                data-testid="submit-score"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-on-primary-container transition-opacity hover:opacity-90"
              >
                Submit diem
                <Icon name="gavel" className="text-[18px]" />
              </button>
            </ConfirmAction>
          </div>
        </section>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="font-label-sm normal-case text-on-surface-variant">Tong diem</p>
          <p data-testid="score-total" className="mt-sm font-display-lg text-primary">
            {total}
          </p>
          <p className="font-body-sm text-on-surface-variant">Toi da 50 diem</p>
          <div className="mt-lg space-y-sm font-body-sm text-on-surface-variant">
            <p>Ban nhap khong duoc tinh ranking.</p>
            <p>Chi diem submit moi duoc tong hop.</p>
            <p>AI Review chi la tham khao.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
