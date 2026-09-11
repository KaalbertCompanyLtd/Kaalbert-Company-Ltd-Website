import Link from "next/link";

import { getDiagnosticConfiguration, getDiagnosticScoreBands } from "@/lib/admin-diagnostic";
import { ConfigurationClient } from "./configuration-client";

export const dynamic = "force-dynamic";

export default async function DiagnosticConfigurationPage() {
  const [configuration, scoreBands] = await Promise.all([
    getDiagnosticConfiguration(),
    getDiagnosticScoreBands(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Diagnostic Configuration</h1>
        <Link href="/admin/diagnostic-questions" className="text-muted-foreground text-sm">
          ← Back to Questions
        </Link>
      </div>

      <ConfigurationClient initial={configuration} initialScoreBands={scoreBands} />
    </div>
  );
}
