"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { setAuthenticated } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function launch() {
    setLoading(true);
    setAuthenticated();
    router.push("/");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <div className="mb-2 text-2xl font-bold text-primary">Atlas</div>
        <p className="mb-6 text-text-muted">
          The EHR copilot that turns what you say into orders — safely.
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={launch}
          disabled={loading}
        >
          {loading ? "Launching…" : "Launch from EHR (demo)"}
        </Button>
        <p className="mt-4 text-xs text-text-muted">
          Demo login — real SMART-on-FHIR OAuth is a production step.
        </p>
      </Card>
    </main>
  );
}
