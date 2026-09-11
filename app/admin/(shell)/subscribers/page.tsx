import { getSubscriberList } from "@/lib/admin-subscribers";
import { SubscribersListClient } from "./subscribers-list-client";

/**
 * Reads live `subscriber` rows on every request — same reasoning as every other admin list
 * in this epic (T7.1's own comment): Prisma calls aren't tracked by Next's fetch-cache
 * heuristics, so this page can look static to Next.js even though it isn't.
 */
export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const subscribers = await getSubscriberList();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Subscribers</h1>
        <p className="text-body text-muted-foreground mt-1">
          This captures and stores consent only — reaching this list with a real newsletter send is
          a separate, not-yet-built capability.
        </p>
      </div>

      <SubscribersListClient
        subscribers={subscribers.map((subscriber) => ({
          id: subscriber.id,
          email: subscriber.email,
          consent: subscriber.consent,
          subscribedAt: subscriber.subscribedAt.toISOString(),
          unsubscribedAt: subscriber.unsubscribedAt
            ? subscriber.unsubscribedAt.toISOString()
            : null,
        }))}
      />
    </div>
  );
}
