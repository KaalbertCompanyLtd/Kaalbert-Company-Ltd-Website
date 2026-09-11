import { prisma } from "@/lib/prisma";
import { unsubscribeFromInsights } from "@/lib/insights-subscription";

export interface SubscriberListItem {
  id: number;
  email: string;
  consent: boolean;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
}

/**
 * Every row, subscribed and unsubscribed alike — `insights-engine.md`'s "never destructive,
 * always reversible" rule (`Subscriber.unsubscribedAt`, never a hard delete) means an
 * unsubscribed row is still real history, not gone; the client filters this down to
 * "Subscribed"/"Unsubscribed" for viewing, same pattern as the Articles list's
 * published/draft filter.
 */
export async function getSubscriberList(): Promise<SubscriberListItem[]> {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return subscribers.map((subscriber) => ({
    id: subscriber.id,
    email: subscriber.email,
    consent: subscriber.consent,
    subscribedAt: subscriber.subscribedAt,
    unsubscribedAt: subscriber.unsubscribedAt,
  }));
}

/**
 * T7.9's own acceptance criterion: manual removal here must have "the identical effect as a
 * visitor's own one-click unsubscribe link (same underlying update, not a second code
 * path)." Looks up the row's own `unsubscribeToken` and calls `lib/insights-subscription.ts`'s
 * `unsubscribeFromInsights` — the exact function the real emailed link's `GET`/`POST
 * /api/insights/unsubscribe` route already calls — rather than writing a second
 * `unsubscribedAt` update inline here. An id with no matching row is a no-op, the same
 * idempotent treatment `unsubscribeFromInsights` already gives an unknown token.
 */
export async function removeSubscriber(id: number): Promise<void> {
  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) {
    return;
  }
  await unsubscribeFromInsights(subscriber.unsubscribeToken);
}
