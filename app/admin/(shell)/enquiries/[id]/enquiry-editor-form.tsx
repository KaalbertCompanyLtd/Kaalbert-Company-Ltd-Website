"use client";

import { useState } from "react";

import { STATUS_LABELS, type EnquiryStatusValue } from "@/lib/enquiry-list-options";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const UNASSIGNED = "unassigned";

/**
 * The only editable surface on `/admin/enquiries/[id]` (T8.3) — status, internal notes, and
 * assignment. Everything else on the page is a visitor's own submitted data, rendered as
 * plain read-only text elsewhere on this screen, never inside a form control here
 * (`enquiry-management.md`'s own business rule: "a visitor's submitted diagnostic responses
 * are never editable"). Purely operates on plain props/`@/lib/enquiry-list-options` (never a
 * `lib/` import that touches `@/lib/prisma`) — safe for a `"use client"` component per
 * CLAUDE.md's rule.
 */
export function EnquiryEditorForm({
  enquiryId,
  initialStatus,
  initialNotes,
  initialAssignedPartnerId,
  partners,
}: {
  enquiryId: number;
  initialStatus: EnquiryStatusValue;
  initialNotes: string | null;
  initialAssignedPartnerId: number | null;
  partners: { id: number; name: string }[];
}) {
  const [status, setStatus] = useState<EnquiryStatusValue>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [assignedPartnerId, setAssignedPartnerId] = useState(
    initialAssignedPartnerId !== null ? String(initialAssignedPartnerId) : UNASSIGNED,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const statusItems = Object.fromEntries(Object.entries(STATUS_LABELS));
  const partnerItems: Record<string, string> = { [UNASSIGNED]: "Unassigned" };
  for (const partner of partners) {
    partnerItems[String(partner.id)] = partner.name;
  }

  async function handleSave() {
    setSaveState("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          internalNotes: notes.trim() ? notes : null,
          assignedPartnerId: assignedPartnerId === UNASSIGNED ? null : Number(assignedPartnerId),
        }),
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setSaveState("error");
        setErrorMessage(data.message ?? "Something went wrong — please try again.");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setErrorMessage("Something went wrong — check your connection and try again.");
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-md border p-6">
      <h3 className="text-[0.9375rem] font-semibold">Status &amp; notes</h3>

      {saveState === "error" && errorMessage && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {errorMessage}
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="enquiryStatus">Status</FieldLabel>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus((value as EnquiryStatusValue) ?? initialStatus);
            setSaveState("idle");
          }}
          items={statusItems}
        >
          <SelectTrigger id="enquiryStatus" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="enquiryAssignedPartner">Assigned to</FieldLabel>
        <Select
          value={assignedPartnerId}
          onValueChange={(value) => {
            setAssignedPartnerId(value ?? UNASSIGNED);
            setSaveState("idle");
          }}
          items={partnerItems}
        >
          <SelectTrigger id="enquiryAssignedPartner" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={String(partner.id)}>
                {partner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="enquiryNotes">
          Internal notes{" "}
          <span className="text-muted-foreground font-normal">never visitor-facing</span>
        </FieldLabel>
        <Textarea
          id="enquiryNotes"
          rows={4}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setSaveState("idle");
          }}
        />
      </Field>

      <Button
        type="button"
        disabled={saveState === "saving"}
        onClick={handleSave}
        className="w-full"
      >
        {saveState === "saved" ? "Saved" : "Save changes"}
      </Button>
    </div>
  );
}
