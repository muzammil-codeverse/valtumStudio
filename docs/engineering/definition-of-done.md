# Definition of done

A change is done when it is within approved scope, formatted, linted, type-checked, and
tested proportionately; documentation and environment changes are included;
accessibility and security implications are reviewed; and known risks or compatibility
effects are disclosed.

For Phase 1, `pnpm ci:verify`, Docker validation, dependency audit, secret review, and a
final diff review are required before completion. A failed or unavailable gate is
reported honestly rather than reclassified as deferred work.
