import { describe, expect, it } from "vitest";

import { isNavItemActive } from "@/components/admin-sidebar-nav";

describe("isNavItemActive", () => {
  it("matches a nav item's own exact path", () => {
    expect(isNavItemActive("/admin/articles", "/admin/articles")).toBe(true);
  });

  it("matches a detail/editor screen nested under the nav item's path", () => {
    expect(isNavItemActive("/admin/articles/42", "/admin/articles")).toBe(true);
    expect(isNavItemActive("/admin/articles/new", "/admin/articles")).toBe(true);
    expect(isNavItemActive("/admin/team/7", "/admin/team")).toBe(true);
    expect(isNavItemActive("/admin/enquiries/3", "/admin/enquiries")).toBe(true);
    expect(isNavItemActive("/admin/landing-pages/new", "/admin/landing-pages")).toBe(true);
  });

  it("does not match a sibling path that merely shares a prefix string", () => {
    expect(isNavItemActive("/admin/articles-archive", "/admin/articles")).toBe(false);
  });

  it("never matches Dashboard for a nested admin route, only its own exact path", () => {
    expect(isNavItemActive("/admin/articles", "/admin")).toBe(false);
    expect(isNavItemActive("/admin", "/admin")).toBe(true);
  });

  it("keeps Diagnostic Configuration active on its second screen, reached by inline link", () => {
    expect(isNavItemActive("/admin/diagnostic-configuration", "/admin/diagnostic-questions")).toBe(
      true,
    );
  });
});
