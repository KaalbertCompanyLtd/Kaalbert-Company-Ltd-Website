import Link from "next/link";
import { notFound } from "next/navigation";

import { getEnquiryDetail, listAssignablePartners } from "@/lib/admin-enquiries";
import { resolveTriageBadge, type EnquiryStatusValue } from "@/lib/enquiry-list-options";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EnquiryEditorForm } from "./enquiry-editor-form";

/**
 * Reads live `enquiry_record`/`attribution`/`admin_user` content on every request — same
 * reasoning as every other DB-backed admin page in this project (T7.1's own comment).
 */
export const dynamic = "force-dynamic";

interface DetailPageProps {
  params: Promise<{ id: string }>;
}

function ConsentBox({ label, value }: { label: string; value: boolean | null }) {
  const text = value === true ? "Given" : value === false ? "Not given" : "Not yet provided";
  const className =
    value === true ? "bg-pine-500/10 text-pine-700" : "bg-muted text-muted-foreground";
  return (
    <div className={`rounded-sm p-3 text-center text-sm font-semibold ${className}`}>
      {label}
      <br />
      {text}
    </div>
  );
}

export default async function EnquiryDetailPage({ params }: DetailPageProps) {
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);
  const detail = Number.isInteger(id) ? await getEnquiryDetail(id) : null;

  if (!detail) {
    notFound();
  }

  const partners = await listAssignablePartners();
  const triageBadge = resolveTriageBadge(detail.triageFlag, detail.triagePriorityLevel);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-h2 text-primary font-bold">
            {detail.name ?? "Not yet provided"}
          </h1>
          <p className="text-body text-muted-foreground mt-1">
            <Link href="/admin/enquiries" className="hover:underline">
              ← Back to Enquiries
            </Link>{" "}
            · Submitted{" "}
            {detail.createdAt.toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        {triageBadge.className ? (
          <Badge className={triageBadge.className}>{triageBadge.label} priority</Badge>
        ) : (
          <Badge variant="outline">{triageBadge.label}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="mb-4 text-[0.9375rem] font-semibold">
              Business Health Check — score summary
            </h3>
            {detail.isDiagnosticOriginated ? (
              detail.dimensionScores.map((dimension) => (
                <div
                  key={dimension.dimensionId}
                  className="border-border flex items-center justify-between border-b py-2 text-sm last:border-b-0"
                >
                  <span>
                    {dimension.name}
                    {dimension.weakest && " — weakest"}
                  </span>
                  <span
                    className={`font-bold ${dimension.weakest ? "text-accent" : "text-primary"}`}
                  >
                    {dimension.score}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-body text-muted-foreground">
                Not applicable — this enquiry came through the contact form, not the diagnostic.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-[0.9375rem] font-semibold">Full diagnostic responses</h3>
            {detail.isDiagnosticOriginated ? (
              detail.responses.map((response) => (
                <div
                  key={response.questionId}
                  className="border-border border-b py-3 last:border-b-0"
                >
                  <div className="text-muted-foreground text-[0.8125rem]">
                    {response.promptText}
                  </div>
                  <div className="text-body mt-1 font-semibold">{response.answerLabel}</div>
                </div>
              ))
            ) : (
              <p className="text-body text-muted-foreground">
                Not applicable — this enquiry came through the contact form, not the diagnostic.
              </p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h3 className="mb-4 text-[0.9375rem] font-semibold">Contact details</h3>
            <div className="text-body mb-1 font-semibold">{detail.name ?? "Not yet provided"}</div>
            <div className="text-muted-foreground text-sm">
              {detail.email ?? "Not yet provided"}
            </div>
            <div className="text-muted-foreground text-sm">{detail.phone ?? "Not provided"}</div>
            {detail.serviceLine && (
              <div className="text-muted-foreground mt-2 text-sm">
                Service interest: {detail.serviceLine}
              </div>
            )}
            {detail.message && (
              <div className="mt-3">
                <div className="text-muted-foreground text-[0.8125rem]">Message</div>
                <p className="text-body mt-1 whitespace-pre-wrap">{detail.message}</p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-[0.9375rem] font-semibold">Consent</h3>
            <div className="grid grid-cols-2 gap-3">
              <ConsentBox label="Contact consent" value={detail.contactConsent} />
              <ConsentBox label="Marketing consent" value={detail.marketingConsent} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-[0.9375rem] font-semibold">Attribution</h3>
            {detail.attribution ? (
              <dl className="flex flex-col gap-2.5">
                <div>
                  <dt className="text-muted-foreground text-xs">Source</dt>
                  <dd className="text-body font-semibold">
                    {detail.attribution.utmSource ?? "Direct"}
                  </dd>
                </div>
                {detail.attribution.utmMedium && (
                  <div>
                    <dt className="text-muted-foreground text-xs">Medium</dt>
                    <dd className="text-body font-semibold">{detail.attribution.utmMedium}</dd>
                  </div>
                )}
                {detail.attribution.utmCampaign && (
                  <div>
                    <dt className="text-muted-foreground text-xs">Campaign</dt>
                    <dd className="text-body font-semibold">{detail.attribution.utmCampaign}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground text-xs">Landing page</dt>
                  <dd className="text-body font-semibold">{detail.attribution.landingPage}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-body text-muted-foreground">
                No attribution captured for this enquiry.
              </p>
            )}
          </Card>

          <EnquiryEditorForm
            enquiryId={detail.id}
            initialStatus={detail.status as EnquiryStatusValue}
            initialNotes={detail.internalNotes}
            initialAssignedPartnerId={detail.assignedPartnerId}
            partners={partners}
          />
        </div>
      </div>
    </div>
  );
}
