import { NextResponse } from "next/server";

import { removeSubscriber } from "@/lib/admin-subscribers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseId(idParam: string): number | null {
  const id = Number.parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

/**
 * `DELETE /api/admin/subscribers/[id]` — the manual-removal action (T7.9). Not a real
 * delete despite the HTTP verb — same `unsubscribedAt`-setting update a visitor's own
 * one-click unsubscribe link performs, see `lib/admin-subscribers.ts`'s `removeSubscriber`.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json(
      { status: "error", message: "Invalid subscriber id." },
      { status: 400 },
    );
  }

  await removeSubscriber(id);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
