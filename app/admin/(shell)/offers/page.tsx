import { getAdvisoryRetainerForEdit, getOfferForEdit, getOfferList } from "@/lib/admin-offers";
import { OffersAdminClient } from "./offers-admin-client";

export const dynamic = "force-dynamic";

export default async function OffersAdminPage() {
  const [summaries, retainer] = await Promise.all([getOfferList(), getAdvisoryRetainerForEdit()]);
  const offers = (
    await Promise.all(summaries.map((summary) => getOfferForEdit(summary.slug)))
  ).filter((offer) => offer !== null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-h2 text-primary font-bold">Offers</h1>
        <p className="text-body text-muted-foreground mt-1">
          Fee bands, FAQs, and the full field set for the three core offer pages, plus the Advisory
          Retainer.
        </p>
      </div>

      <OffersAdminClient initialOffers={offers} initialRetainer={retainer} />
    </div>
  );
}
