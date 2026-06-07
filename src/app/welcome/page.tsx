import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ShieldCheck, Zap, Network } from "lucide-react";

// Fraunces is loaded ONLY on this marketing route — never in the clinical app.
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "600"] });

export const metadata = {
  title: "Atlas — Say it. Confirm it. Done.",
  description:
    "The EHR copilot that turns what you say into orders — safely, on any FHIR EHR.",
};

const valueProps = [
  {
    icon: Zap,
    title: "Faster than the menus",
    body: "State an order set in plain English and place it in seconds — no nested menu-diving.",
  },
  {
    icon: ShieldCheck,
    title: "Safe by design",
    body: "Every action is narrated and confirmed before it's written. Raw PHI never reaches the model.",
  },
  {
    icon: Network,
    title: "Works with any FHIR EHR",
    body: "Built on the FHIR standard, not one vendor — so it fits wherever you already chart.",
  },
];

export default function WelcomePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-background px-6">
      <section className="flex max-w-2xl flex-col items-center pt-24 text-center">
        <span className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          Atlas · EHR Copilot
        </span>
        <h1
          className={`${fraunces.className} text-5xl font-semibold leading-tight text-text`}
        >
          Say the order. Atlas places it — after you confirm.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-text-muted">
          The EHR copilot that turns a clinician&apos;s plain-English intent into
          structured, coded orders inside any FHIR EHR.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-surface transition-colors hover:bg-primary-hover"
        >
          Try the demo
        </Link>
      </section>

      <section className="mt-20 grid w-full max-w-4xl gap-6 pb-24 md:grid-cols-3">
        {valueProps.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden />
            <h2 className={`${fraunces.className} mb-1 text-xl font-semibold text-text`}>
              {title}
            </h2>
            <p className="text-sm text-text-muted">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
