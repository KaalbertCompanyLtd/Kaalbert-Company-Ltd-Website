import { defineRailway, project, service, github, postgres, preserve, ref } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "kaalbert-web";

export default defineRailway(() => {
  // References the existing Postgres addon (provisioned at T1.2, outside this IaC file) by
  // its own resource name — resolves to the real `database.Postgres` address, does not
  // create a second instance.
  const postgres_db = postgres("Postgres");

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
      BREVO_API_KEY: preserve(),
      BREVO_SENDER_EMAIL: preserve(),
      BREVO_SENDER_NAME: preserve(),
      GTM_CONTAINER_ID: preserve(),
      // Set directly on the live service via `railway variable set` (session 54,
      // 2026-09-11) — never declared here, so a `railway config apply` would have deleted
      // both on the very next run (CLAUDE.md's own documented hazard for this exact
      // pattern). Added as a production-hardening pass, session 60 — see
      // `memory/known-bugs.md`'s ADMIN_CHALLENGE_TOKEN_SECRET/ADMIN_TOTP_ENCRYPTION_KEY
      // entry.
      ADMIN_CHALLENGE_TOKEN_SECRET: preserve(),
      ADMIN_TOTP_ENCRYPTION_KEY: preserve(),
      // Cloudflare R2 object storage (provisioned 2026-09-11, session 54) — same
      // never-declared-until-now gap as the two admin secrets above.
      CLOUDFLARE_R2_ACCOUNT_ID: preserve(),
      CLOUDFLARE_R2_ACCESS_KEY_ID: preserve(),
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: preserve(),
      CLOUDFLARE_R2_BUCKET: preserve(),
      CLOUDFLARE_R2_PUBLIC_URL: preserve(),
    },
  });

  // T5.4's 90-day attribution retention job (scripts/cleanup-attribution.ts), scheduled
  // natively via Railway's own Cron Job feature rather than a hand-rolled worker/dispatcher
  // process — this project's ADR 0001 ethos ("packages/infrastructure as building blocks,
  // never reinvent what a platform already does") applies here too, and
  // `platform-performance-dashboards.md`'s own future per-platform sync jobs (Milestone 9)
  // explicitly require this same "one failure never affects another job" isolation, which a
  // single shared worker process would have to reimplement by hand. The pattern: one small
  // Railway service per scheduled task, each running one `npm run <script>` command on its
  // own `deploy.cronSchedule`, source-connected to this same repo. `restartPolicyType:
  // "NEVER"` — a cron job that exits 0 is done, not crashed; it should not restart until its
  // next scheduled run.
  const attribution_cleanup = service("attribution-cleanup", {
    source: github("KaalbertCompanyLtd/Kaalbert-Company-Ltd-Website", { branch: "main" }),
    // Railpack auto-detects this repo as a Next.js app and would otherwise run the full
    // `npm run build` (a real `next build`) before every cron run — wasted build time for a
    // job that only ever calls `tsx` directly, never the compiled app. `"true"` (a no-op
    // shell command) skips it; `npm install` still runs beforehand regardless, which this
    // job's own dependencies (`tsx`, `dotenv`, the generated Prisma client) need.
    build: "true",
    start: "npm run attribution:cleanup",
    deploy: {
      cronSchedule: "0 3 * * *",
      restartPolicyType: "NEVER",
    },
    variables: {
      // A brand-new service has no prior value for `preserve()` to protect — it resolves to
      // simply unset (hit for real: the service's first deployment failed outright on
      // "DATABASE_URL is not set" before this was corrected to a real cross-service
      // reference, same private-network connection `kaalbert-web` itself uses).
      DATABASE_URL: ref(postgres_db, "DATABASE_URL"),
    },
  });

  return project("kaalbert-web", {
    resources: [postgres_db, kaalbert_web, attribution_cleanup],
  });
});
