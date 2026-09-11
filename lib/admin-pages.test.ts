import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    page: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    capability: { findMany: vi.fn(), update: vi.fn() },
    methodStage: { findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import {
  PageValidationError,
  getCapabilitiesPageForEdit,
  getOurMethodPageForEdit,
  updateCapabilitiesPage,
  updateOurMethodPage,
} from "@/lib/admin-pages";
import type { CapabilitiesPageSaveInput, OurMethodPageSaveInput } from "@/lib/admin-pages";

const pageFindUniqueOrThrowMock = vi.mocked(prisma.page.findUniqueOrThrow);
const capabilityFindManyMock = vi.mocked(prisma.capability.findMany);
const methodStageFindManyMock = vi.mocked(prisma.methodStage.findMany);
const transactionMock = vi.mocked(prisma.$transaction);

beforeEach(() => {
  pageFindUniqueOrThrowMock.mockReset();
  capabilityFindManyMock.mockReset();
  methodStageFindManyMock.mockReset();
  transactionMock.mockReset();
});

const pageRow = {
  heroKicker: "Kicker",
  heroHeading: "Heading",
  heroLead: "Lead",
  introCopy: "Intro copy",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
};

function capabilityRow(overrides: Partial<{ id: number; order: number }> = {}) {
  return {
    id: overrides.id ?? 1,
    slug: `capability-${overrides.id ?? 1}`,
    name: "Name",
    shortDescription: "Description",
    order: overrides.order ?? 1,
  };
}

function eightCapabilities() {
  return Array.from({ length: 8 }, (_, i) => capabilityRow({ id: i + 1, order: i + 1 }));
}

function validCapabilitiesInput(
  overrides: Partial<CapabilitiesPageSaveInput> = {},
): CapabilitiesPageSaveInput {
  return {
    heroKicker: "Kicker",
    heroHeading: "Heading",
    heroLead: "Lead",
    metaTitle: "Meta title",
    metaDescription: "Meta description",
    complianceChecked: true,
    capabilities: eightCapabilities().map((c) => ({
      id: c.id,
      name: c.name,
      shortDescription: c.shortDescription,
      order: c.order,
    })),
    ...overrides,
  };
}

describe("getCapabilitiesPageForEdit", () => {
  it("returns hero fields and capability rows, slug included but read-only", async () => {
    pageFindUniqueOrThrowMock.mockResolvedValueOnce(pageRow as never);
    capabilityFindManyMock.mockResolvedValueOnce([capabilityRow()] as never);

    const result = await getCapabilitiesPageForEdit();

    expect(result.heroKicker).toBe("Kicker");
    expect(result.capabilities[0].slug).toBe("capability-1");
  });
});

describe("updateCapabilitiesPage", () => {
  it("rejects when the compliance checkbox is unchecked", async () => {
    await expect(
      updateCapabilitiesPage(validCapabilitiesInput({ complianceChecked: false })),
    ).rejects.toThrow(PageValidationError);
  });

  it("rejects when the capability count is not exactly eight", async () => {
    await expect(
      updateCapabilitiesPage(
        validCapabilitiesInput({
          capabilities: eightCapabilities()
            .slice(0, 7)
            .map((c) => ({
              id: c.id,
              name: c.name,
              shortDescription: c.shortDescription,
              order: c.order,
            })),
        }),
      ),
    ).rejects.toThrow(PageValidationError);
  });

  it("rejects a blank hero field", async () => {
    await expect(
      updateCapabilitiesPage(validCapabilitiesInput({ heroHeading: "  " })),
    ).rejects.toThrow(PageValidationError);
  });

  it("saves the page and all eight capabilities in one transaction when valid", async () => {
    transactionMock.mockResolvedValueOnce([] as never);

    await updateCapabilitiesPage(validCapabilitiesInput());

    expect(transactionMock).toHaveBeenCalledTimes(1);
    const queries = transactionMock.mock.calls[0][0] as unknown as unknown[];
    expect(queries).toHaveLength(9); // 1 page update + 8 capability updates
  });
});

describe("getOurMethodPageForEdit", () => {
  it("throws PageValidationError when introCopy is null (a seed/migration bug)", async () => {
    pageFindUniqueOrThrowMock.mockResolvedValueOnce({ ...pageRow, introCopy: null } as never);
    methodStageFindManyMock.mockResolvedValueOnce([] as never);

    await expect(getOurMethodPageForEdit()).rejects.toThrow(PageValidationError);
  });
});

function fourStages() {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    description: "Description",
    whatHappens: "What happens",
    clientSees: "Client sees",
    decisionPoint: "Decision point",
    capabilityTransferNote: i === 3 ? "Transfer note" : null,
  }));
}

function validOurMethodInput(
  overrides: Partial<OurMethodPageSaveInput> = {},
): OurMethodPageSaveInput {
  return {
    heroKicker: "Kicker",
    heroHeading: "Heading",
    heroLead: "Lead",
    introCopy: "Intro copy",
    metaTitle: "Meta title",
    metaDescription: "Meta description",
    complianceChecked: true,
    stages: fourStages(),
    ...overrides,
  };
}

describe("updateOurMethodPage", () => {
  it("rejects when the compliance checkbox is unchecked", async () => {
    await expect(
      updateOurMethodPage(validOurMethodInput({ complianceChecked: false })),
    ).rejects.toThrow(PageValidationError);
  });

  it("rejects when the stage count is not exactly four", async () => {
    await expect(
      updateOurMethodPage(validOurMethodInput({ stages: fourStages().slice(0, 3) })),
    ).rejects.toThrow(PageValidationError);
  });

  it("rejects a stage missing a required field", async () => {
    const stages = fourStages();
    stages[0].description = "";
    await expect(updateOurMethodPage(validOurMethodInput({ stages }))).rejects.toThrow(
      PageValidationError,
    );
  });

  it("saves the page and all four stages in one transaction when valid", async () => {
    transactionMock.mockResolvedValueOnce([] as never);

    await updateOurMethodPage(validOurMethodInput());

    expect(transactionMock).toHaveBeenCalledTimes(1);
    const queries = transactionMock.mock.calls[0][0] as unknown as unknown[];
    expect(queries).toHaveLength(5); // 1 page update + 4 stage updates
  });
});
