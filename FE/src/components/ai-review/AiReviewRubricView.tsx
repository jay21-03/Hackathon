import { Badge } from "../ui/Badge";
import {
  CRITERIA_KEYS,
  extractRubricRating,
  parseStructuredReview,
  rubricLabel,
  rubricRatingTone,
  type AiReviewResponse,
  type CriteriaComments
} from "../../services/aiReviewApi";

interface AiReviewRubricViewProps {
  review: AiReviewResponse;
  detailed?: boolean;
}

const R1_KEYS = CRITERIA_KEYS.slice(0, 5);
const R2_KEYS = CRITERIA_KEYS.slice(5);

function criteriaEntries(criteria: CriteriaComments | null | undefined, keys: readonly (keyof CriteriaComments)[]) {
  if (!criteria) return [];
  return keys
    .map((key) => ({
      key,
      label: rubricLabel(key),
      text: criteria[key],
      ...extractRubricRating(criteria[key])
    }))
    .filter((item) => item.text);
}

function RubricSection({
  title,
  items,
  detailed
}: {
  title: string;
  items: ReturnType<typeof criteriaEntries>;
  detailed: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="font-label-md text-on-surface">{title}</h3>
      <ul className={`mt-sm ${detailed ? "grid gap-sm lg:grid-cols-2" : "space-y-sm"}`}>
        {items.map((item) => (
          <li
            key={item.key}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest p-sm"
          >
            <div className="flex flex-wrap items-center gap-sm">
              <p className="font-label-sm text-on-surface">{item.label}</p>
              {item.rating ? <Badge tone={rubricRatingTone(item.rating)}>{item.rating}</Badge> : null}
            </div>
            <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">
              {item.comment || item.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AiReviewRubricView({ review, detailed = false }: AiReviewRubricViewProps) {
  const structured = parseStructuredReview(review.structuredOutput);
  if (!structured) return null;

  const r1Items = criteriaEntries(structured.criteriaComments, R1_KEYS);
  const r2Items = criteriaEntries(structured.criteriaComments, R2_KEYS);
  const smb = structured.smbScaleAdvisory;

  return (
    <div className="space-y-md">
      {structured.historicalSynthesis ? (
        <section>
          <h3 className="font-label-md text-on-surface">Tổng hợp lịch sử</h3>
          <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">
            {structured.historicalSynthesis}
          </p>
        </section>
      ) : null}

      {structured.evolutionNotes ? (
        <section>
          <h3 className="font-label-md text-on-surface">Tiến hóa kỹ thuật</h3>
          <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">
            {structured.evolutionNotes}
          </p>
        </section>
      ) : null}

      <RubricSection title="Vòng 1 — Core RAG (R1)" items={r1Items} detailed={detailed} />
      <RubricSection title="Vòng 2 — Agentic & Production (R2)" items={r2Items} detailed={detailed} />

      {detailed && smb ? (
        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md">
          <h3 className="font-label-md text-on-surface">Tư vấn thương mại hóa (SMB)</h3>
          {smb.summary ? (
            <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">{smb.summary}</p>
          ) : null}
          <dl className="mt-sm space-y-sm font-body-sm text-on-surface-variant">
            {smb.system_identity_recap ? (
              <div>
                <dt className="font-label-sm text-on-surface">Định danh hệ thống</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.system_identity_recap}</dd>
              </div>
            ) : null}
            {smb.tech_and_architecture ? (
              <div>
                <dt className="font-label-sm text-on-surface">Kiến trúc</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.tech_and_architecture}</dd>
              </div>
            ) : null}
            {smb.cost_for_smb ? (
              <div>
                <dt className="font-label-sm text-on-surface">Chi phí SMB</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.cost_for_smb}</dd>
              </div>
            ) : null}
            {smb.throughput_and_reliability ? (
              <div>
                <dt className="font-label-sm text-on-surface">Throughput & độ tin cậy</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.throughput_and_reliability}</dd>
              </div>
            ) : null}
            {smb.observability_and_operations ? (
              <div>
                <dt className="font-label-sm text-on-surface">Observability & vận hành</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.observability_and_operations}</dd>
              </div>
            ) : null}
            {smb.data_and_integrations ? (
              <div>
                <dt className="font-label-sm text-on-surface">Dữ liệu & tích hợp</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{smb.data_and_integrations}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : smb?.summary ? (
        <section>
          <h3 className="font-label-md text-on-surface">Tư vấn SMB</h3>
          <p className="mt-xs font-body-sm text-on-surface-variant whitespace-pre-wrap">{smb.summary}</p>
        </section>
      ) : null}
    </div>
  );
}
