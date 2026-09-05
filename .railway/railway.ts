import { defineRailway, project, service, github, preserve } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "kaalbert-web";

export default defineRailway(() => {
  const kaalbert_web = service("kaalbert-web", {
    // Must be declared explicitly — an IaC file that omits `source` treats it as
    // "should not exist" and disconnects the GitHub App integration on apply.
    // (2026-09-05: the GitHub App had lost/never had repo access, breaking both this
    // and push-triggered auto-deploy — reinstalled via GitHub's app settings.)
    source: github("KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website", { branch: "main" }),
    start: "npx prisma migrate deploy && npm start",
    variables: {
      // Set via `railway variable set` (T1.2) as a `${{Postgres.DATABASE_URL}}`
      // reference — preserve it here rather than letting IaC delete it for being
      // undeclared.
      DATABASE_URL: preserve(),
    },
  });
  return project("kaalbert-web", {
    resources: [kaalbert_web],
  });
});
