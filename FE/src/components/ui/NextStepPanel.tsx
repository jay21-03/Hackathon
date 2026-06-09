import { ButtonLink } from "./Button";
import { Icon } from "./Icon";

export interface NextStepAction {
  title: string;
  description: string;
  /** In-page anchor, e.g. #board-step-slots */
  href?: string;
  /** Route to another organizer page */
  to?: string;
  cta: string;
}

interface NextStepPanelProps {
  action: NextStepAction;
  variant?: "primary" | "success";
  onHrefClick?: (href: string) => void;
}

export function NextStepPanel({ action, variant = "primary", onHrefClick }: NextStepPanelProps) {
  const tone =
    variant === "success"
      ? "border-secondary/40 bg-secondary-container/25"
      : "border-primary/30 bg-primary-container/20";

  return (
    <section className={`rounded-xl border p-md ${tone}`}>
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-sm">
          <Icon
            name={variant === "success" ? "check_circle" : "arrow_circle_right"}
            className="shrink-0 text-2xl text-primary"
          />
          <div>
            <p className="font-label-md text-on-surface">{action.title}</p>
            <p className="mt-xs font-body-sm text-on-surface-variant">{action.description}</p>
          </div>
        </div>
        {action.to ? (
          <ButtonLink to={action.to} icon={<Icon name="arrow_forward" />}>
            {action.cta}
          </ButtonLink>
        ) : action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-on-primary"
            onClick={(event) => {
              event.preventDefault();
              if (onHrefClick) {
                onHrefClick(action.href!);
                return;
              }
              document
                .querySelector(action.href!)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Icon name="arrow_downward" className="text-[18px]" />
            {action.cta}
          </a>
        ) : null}
      </div>
    </section>
  );
}
