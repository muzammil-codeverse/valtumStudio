# ADR 0008: Strict TypeScript

- Status: Accepted
- Date: 2026-07-12

## Context

The foundation needs early detection of invalid assumptions and safe contracts for later
modules.

## Decision

Enable strict TypeScript plus selected compatibility-safe checks including unchecked
indexed access and exact optional properties.

## Alternatives considered

Default TypeScript settings, broad `any` usage, and later gradual strictness.

## Consequences

Implementation requires deliberate narrowing and explicit handling of uncertain values.

## Follow-up implications

Do not weaken compiler settings to hide errors; repair contracts or narrow values
safely.
