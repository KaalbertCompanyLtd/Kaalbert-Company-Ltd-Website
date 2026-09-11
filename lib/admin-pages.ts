import { prisma } from "@/lib/prisma";

export class PageValidationError extends Error {}

export interface CapabilityEditRow {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  order: number;
}

export interface CapabilitiesPageData {
  heroKicker: string;
  heroHeading: string;
  heroLead: string;
  metaTitle: string;
  metaDescription: string;
  capabilities: CapabilityEditRow[];
}

export interface CapabilitiesPageSaveInput {
  heroKicker: string;
  heroHeading: string;
  heroLead: string;
  metaTitle: string;
  metaDescription: string;
  capabilities: { id: number; name: string; shortDescription: string; order: number }[];
  complianceChecked: boolean;
}

export interface MethodStageEditRow {
  id: number;
  order: number;
  name: string;
  description: string;
  whatHappens: string;
  clientSees: string;
  decisionPoint: string;
  capabilityTransferNote: string | null;
}

export interface OurMethodPageData {
  heroKicker: string;
  heroHeading: string;
  heroLead: string;
  introCopy: string;
  metaTitle: string;
  metaDescription: string;
  stages: MethodStageEditRow[];
}

export interface OurMethodPageSaveInput {
  heroKicker: string;
  heroHeading: string;
  heroLead: string;
  introCopy: string;
  metaTitle: string;
  metaDescription: string;
  stages: {
    id: number;
    description: string;
    whatHappens: string;
    clientSees: string;
    decisionPoint: string;
    capabilityTransferNote: string | null;
  }[];
  complianceChecked: boolean;
}

/**
 * `capabilities-page.md`'s own business rule ("exactly eight service line summaries") and
 * `our-method-page.md`'s ("all four stages") mean this task never adds or removes a
 * `capability`/`method_stage` row — only edits the fixed set's content. `Capability.slug` is
 * therefore never editable here: it's the live lookup key `lib/contact.ts`'s
 * `resolveServiceContext` matches `/contact?service=[slug]` against, and changing it would
 * silently break any already-shared/bookmarked enquiry link — the same "identity fields stay
 * frozen after creation" precedent T7.2 already applied to `Article.slug`.
 */
export async function getCapabilitiesPageForEdit(): Promise<CapabilitiesPageData> {
  const [page, capabilities] = await Promise.all([
    prisma.page.findUniqueOrThrow({ where: { slug: "capabilities" } }),
    prisma.capability.findMany({ orderBy: { order: "asc" } }),
  ]);

  return {
    heroKicker: page.heroKicker,
    heroHeading: page.heroHeading,
    heroLead: page.heroLead,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    capabilities: capabilities.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      shortDescription: c.shortDescription,
      order: c.order,
    })),
  };
}

function validateHeroFields(input: {
  heroKicker: string;
  heroHeading: string;
  heroLead: string;
  metaTitle: string;
  metaDescription: string;
}): void {
  if (
    !input.heroKicker.trim() ||
    !input.heroHeading.trim() ||
    !input.heroLead.trim() ||
    !input.metaTitle.trim() ||
    !input.metaDescription.trim()
  ) {
    throw new PageValidationError("Every hero and meta field is required.");
  }
}

/**
 * `content-management-admin.md`'s FR-5.4 sign-off gate ("No page... is marked publishable
 * without a recorded firm sign-off") applies to marketing pages exactly like articles
 * (T7.3's own acceptance criterion) — but `Page`/`Capability` have no `publishedAt`-style
 * draft/live column (every row is always live the moment it's saved), so there is no
 * separate "Publish" action to gate the way T7.2's article editor has one. The compliance
 * checkbox instead gates the save itself: this function throws if it isn't checked, exactly
 * as if this save *were* the publish action, because for this content type it is.
 */
export async function updateCapabilitiesPage(input: CapabilitiesPageSaveInput): Promise<void> {
  validateHeroFields(input);
  if (!input.complianceChecked) {
    throw new PageValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }
  if (input.capabilities.length !== 8) {
    throw new PageValidationError(
      "Exactly eight capability rows are expected — capabilities-page.md's own business rule.",
    );
  }
  for (const capability of input.capabilities) {
    if (!capability.name.trim() || !capability.shortDescription.trim()) {
      throw new PageValidationError("Every capability needs a name and a short description.");
    }
  }

  await prisma.$transaction([
    prisma.page.update({
      where: { slug: "capabilities" },
      data: {
        heroKicker: input.heroKicker.trim(),
        heroHeading: input.heroHeading.trim(),
        heroLead: input.heroLead.trim(),
        metaTitle: input.metaTitle.trim(),
        metaDescription: input.metaDescription.trim(),
      },
    }),
    ...input.capabilities.map((capability) =>
      prisma.capability.update({
        where: { id: capability.id },
        data: {
          name: capability.name.trim(),
          shortDescription: capability.shortDescription.trim(),
          order: capability.order,
        },
      }),
    ),
  ]);
}

export async function getOurMethodPageForEdit(): Promise<OurMethodPageData> {
  const [page, stages] = await Promise.all([
    prisma.page.findUniqueOrThrow({ where: { slug: "our-method" } }),
    prisma.methodStage.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!page.introCopy) {
    throw new PageValidationError(
      `page "our-method" has no introCopy — run \`npm run db:seed\` (see prisma/seed.ts).`,
    );
  }

  return {
    heroKicker: page.heroKicker,
    heroHeading: page.heroHeading,
    heroLead: page.heroLead,
    introCopy: page.introCopy,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    stages: stages.map((s) => ({
      id: s.id,
      order: s.order,
      name: s.name,
      description: s.description,
      whatHappens: s.whatHappens,
      clientSees: s.clientSees,
      decisionPoint: s.decisionPoint,
      capabilityTransferNote: s.capabilityTransferNote,
    })),
  };
}

/**
 * `method_stage.order` is never editable here (unlike `Capability.order`) — the four stages
 * are a fixed, meaningful sequence (Discover → Diagnose → Design → Deliver per
 * `our-method-page.md`'s own goal), not an arbitrary display order a partner might
 * reasonably want to shuffle; reordering them would misrepresent the firm's actual method.
 * `name` is likewise not editable — it names one of those four fixed conceptual stages.
 */
export async function updateOurMethodPage(input: OurMethodPageSaveInput): Promise<void> {
  validateHeroFields(input);
  if (!input.introCopy.trim()) {
    throw new PageValidationError("Intro copy is required.");
  }
  if (!input.complianceChecked) {
    throw new PageValidationError(
      "Confirm this complies with 10.05 Positioning and Claims Guidance Note before saving.",
    );
  }
  if (input.stages.length !== 4) {
    throw new PageValidationError(
      "Exactly four method-stage rows are expected — our-method-page.md's own business rule.",
    );
  }
  for (const stage of input.stages) {
    if (
      !stage.description.trim() ||
      !stage.whatHappens.trim() ||
      !stage.clientSees.trim() ||
      !stage.decisionPoint.trim()
    ) {
      throw new PageValidationError(
        "Every stage needs a description, what-happens, client-sees, and decision-point field.",
      );
    }
  }

  await prisma.$transaction([
    prisma.page.update({
      where: { slug: "our-method" },
      data: {
        heroKicker: input.heroKicker.trim(),
        heroHeading: input.heroHeading.trim(),
        heroLead: input.heroLead.trim(),
        introCopy: input.introCopy.trim(),
        metaTitle: input.metaTitle.trim(),
        metaDescription: input.metaDescription.trim(),
      },
    }),
    ...input.stages.map((stage) =>
      prisma.methodStage.update({
        where: { id: stage.id },
        data: {
          description: stage.description.trim(),
          whatHappens: stage.whatHappens.trim(),
          clientSees: stage.clientSees.trim(),
          decisionPoint: stage.decisionPoint.trim(),
          capabilityTransferNote: stage.capabilityTransferNote?.trim() || null,
        },
      }),
    ),
  ]);
}
