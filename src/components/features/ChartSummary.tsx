import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CodedItem, PatientContext } from "@/lib/types";

interface Props {
  context: PatientContext | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function Section({ title, items }: { title: string; items: CodedItem[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">None recorded</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={`${item.code}-${i}`} className="flex items-center justify-between gap-2">
              <span className="text-sm text-text">{item.display}</span>
              {item.code && <Badge tone="code">{item.code}</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ChartSummary({ context, loading, error, onRetry }: Props) {
  if (error) {
    return (
      <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="max-w-sm">
          <h2 className="mb-1 text-lg font-semibold text-error">Couldn&apos;t load the chart</h2>
          <p className="mb-4 text-sm text-text-muted">{error}</p>
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full min-h-[60vh]">
        <Skeleton className="mb-4 h-7 w-48" />
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((s) => (
            <div key={s}>
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="mb-1.5 h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!context) {
    return (
      <Card className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="max-w-xs">
          <h2 className="mb-1 text-lg font-semibold text-text">No patient selected</h2>
          <p className="text-sm text-text-muted">
            Select a patient in the Atlas panel to load their chart.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[60vh]">
      <div className="mb-5 border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-text">{context.displayName}</h2>
        <p className="text-sm text-text-muted">
          {[context.sex, context.ageBand && `${context.ageBand} yrs`]
            .filter(Boolean)
            .join(" · ") || "Demographics unavailable"}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Section title="Problems" items={context.problems} />
        <Section title="Medications" items={context.medications} />
        <Section title="Allergies" items={context.allergies} />

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Orders
          </h3>
          {context.orders.length === 0 ? (
            <p className="text-sm text-text-muted">No orders placed</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {context.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text">{o.display}</span>
                  <Badge tone="info">{o.resourceType.replace("Request", "")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
