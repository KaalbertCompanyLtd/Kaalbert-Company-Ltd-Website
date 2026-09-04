# ADR 0001: Custom-Built Application, No CMS Platform

Status: Accepted

Context: The project needs a non-technical-partner-editable content layer (FR-8), tight
performance budgets (NFR-1), and server-side capability for the Conversions API (FR-7.4).
WordPress was initially evaluated and recommended for its native fit to these requirements
and its deep Accra maintainability talent pool. The recommendation was explicitly rejected:
"I don't like this one bit, we're custom building everything."

Decision: The entire application — public site, diagnostic, and admin/content-editing area —
is built from scratch. No CMS product (WordPress, Webflow, or a headless product like
Payload/Strapi/Directus) owns the admin UI, data model, or routes. Well-vetted libraries are
used as components inside hand-written code (a rich-text editor, an ORM, auth/crypto
primitives) — never a product that supplies the whole admin experience.

Consequences: Materially more build effort than adopting a pre-built CMS or admin-kit would
have required — reflected in the diagnostic and build line items in `QT/2026-09`. The team
owns security patching for every library directly, mitigated by a deliberately small
dependency list. Every subsequent architecture decision in this project (framework, hosting,
diagnostic engine, measurement, auth) is downstream of this one. See
`docs/research/runtime-framework-and-admin.md` for full reasoning.
