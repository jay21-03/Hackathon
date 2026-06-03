import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ModuleSkeleton } from "../../components/ui/ModuleSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import type { RubricCriterion } from "../../domain/businessRules";
import { fetchRubricConfig } from "../../services/hackathonApi";

export function RubricSetupPage() {
  const { notify } = useToast();
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRubricConfig()
      .then((result) => {
        setCriteria(result.data);
        setUsingFallback(result.usingFallback);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalMax = useMemo(() => criteria.reduce((sum, item) => sum + item.max, 0), [criteria]);

  function updateScore(index: number, value: number) {
    setCriteria((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, score: Math.max(item.min, Math.min(item.max, value)) } : item
      )
    );
  }

  if (loading) return <ModuleSkeleton rows={5} />;

  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tieu chi cham"
        title="Cau hinh rubric"
        description="Moi tieu chi co min/max ro rang. Giam khao chi nhap diem nam trong gioi han da cau hinh."
        actions={usingFallback ? <Badge tone="warning">Du lieu minh hoa</Badge> : <Badge tone="success">Du lieu he thong</Badge>}
      />

      <section className="grid gap-md md:grid-cols-[1fr_280px]">
        <div className="space-y-md">
          {criteria.map((criterion, index) => (
            <article key={criterion.name} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
              <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-headline-sm text-on-surface">{criterion.name}</h2>
                  <p className="font-body-sm text-on-surface-variant">
                    Khoang diem: {criterion.min} - {criterion.max}
                  </p>
                </div>
                <div className="flex items-center gap-sm">
                  <input
                    className="w-24 rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-on-surface"
                    type="number"
                    min={criterion.min}
                    max={criterion.max}
                    value={criterion.score}
                    onChange={(event) => updateScore(index, Number(event.target.value))}
                  />
                  <Badge tone="neutral">/{criterion.max}</Badge>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-xl border border-outline-variant bg-surface-container p-lg">
          <p className="font-label-md text-on-surface">Tong diem toi da</p>
          <p className="mt-xs font-headline-lg text-primary">{totalMax}</p>
          <p className="mt-sm font-body-sm text-on-surface-variant">
            Ranking chi tinh score sheet da submit. AI Review chi la thong tin tham khao.
          </p>
          <Button className="mt-lg w-full" onClick={() => notify("Da luu cau hinh rubric.", "success")}>
            Luu rubric
          </Button>
        </aside>
      </section>
    </div>
  );
}
