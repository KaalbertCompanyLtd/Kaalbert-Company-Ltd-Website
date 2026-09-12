"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * `DELETE /api/admin/enquiries/[id]/personal-data` (T8.4, FR-6.4) — the one destructive,
 * irreversible action on this screen, so it goes through a real confirmation dialog (Base UI
 * `AlertDialog`, same pattern as `admin-user-actions-panel.tsx`'s "Deactivate account"),
 * never a bare click. `router.refresh()` re-fetches the server-rendered detail page afterward
 * so the now-nulled fields show immediately, without a full page reload.
 */
export function DeletePersonalDataButton({ enquiryId }: { enquiryId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/personal-data`, {
        method: "DELETE",
      });
      const data: { status: string; message?: string } = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Something went wrong — please try again.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong — check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-sm border p-3 text-sm"
        >
          {error}
        </p>
      )}
      <AlertDialog>
        <AlertDialogTrigger render={<Button type="button" variant="outline" disabled={busy} />}>
          Delete personal data
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this person&apos;s personal data?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently removes their name, email, phone, and message from this enquiry — this
              cannot be undone. The enquiry itself, its score/responses, status, and notes all stay
              exactly as they are; this only clears identifying contact details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete personal data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
