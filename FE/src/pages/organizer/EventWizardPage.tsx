import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";

const steps = [
  { title: "Thong tin co ban", detail: "Ten cuoc thi, thoi gian va mo ta ngan.", path: "/organizer/events/basic-info", status: "CONFIRMED" },
  { title: "Dang ky doi", detail: "Quota, kich thuoc doi va han dang ky.", path: "/organizer/registrations", status: "PENDING" },
  { title: "Bang thi", detail: "Tao bang, phan mentor va giam khao.", path: "/organizer/boards", status: "PENDING" },
  { title: "De thi va rubric", detail: "Cau hinh release_at va tieu chi cham.", path: "/organizer/problems", status: "PENDING" }
];

export function EventWizardPage() {
  return (
    <div className="space-y-lg">
      <PageHeader
        eyebrow="Tao cuoc thi"
        title="Quy trinh cau hinh"
        description="Di theo tung buoc de tao cuoc thi moi. Moi buoc deu co trang thai ro rang truoc khi mo dang ky."
      />

      <section className="grid gap-md lg:grid-cols-2">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-xl border border-outline-variant bg-surface-container p-lg">
            <div className="flex items-start justify-between gap-md">
              <div className="flex gap-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container font-label-md text-on-primary-container">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-headline-sm text-on-surface">{step.title}</h2>
                  <p className="mt-xs font-body-sm text-on-surface-variant">{step.detail}</p>
                </div>
              </div>
              <Badge tone={step.status === "CONFIRMED" ? "success" : "warning"}>
                {step.status === "CONFIRMED" ? "Da san sang" : "Can cau hinh"}
              </Badge>
            </div>
            <Link to={step.path} className="btn-secondary mt-md inline-flex items-center gap-2">
              <Icon name="arrow_forward" />
              Mo buoc nay
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
