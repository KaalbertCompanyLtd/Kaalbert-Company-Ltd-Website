# ADR 0008: Single Deploy Target — No Dual-Host Portability Design

Status: Accepted

Context: During hosting research, an approach was considered where the application would be
actively built and tested as equally deployable to either Railway or Vercel, letting the
final host be chosen later based on the firm's budget at that time. This was proposed and
then deliberately reversed after direct discussion.

Decision: Railway is decided as the host, not one of two supported targets. Writing portable
code — environment-variable configuration, standard Prisma/Postgres usage, an S3-compatible
storage client rather than a provider-specific one — is followed anyway, at no extra cost,
as ordinary good practice. Actively designing, testing, and documenting the application as
switchable between two hosting providers at will is not.

Consequences: Removes an ongoing design tax from every future decision ("does this work
identically on both hosts") for optionality unlikely to be exercised. Vercel's fixed cost
floor (ADR 0003) already rules it out under the real budget, so holding it open as a live
parallel target resolved nothing further. Once the site holds real enquiry and client data,
moving it between hosts stops being a low-stakes decision regardless of code portability, so
little practical value was being bought by designing for it. See
`docs/research/hosting-and-infrastructure.md`, "Why this is a single decision, not a
build-for-either-host design."
