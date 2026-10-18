# Feature modules

Feature modules will be introduced only when a business capability exists. A module may
use the following shape when each layer is justified:

```txt
modules/<feature>/
├── application/
├── domain/
├── infrastructure/
├── schemas/
├── server/
├── ui/
├── types/
└── index.ts
```

Consumers use the module's root `index.ts` public API rather than arbitrary internal
files. Modules must not import route files from `src/app`.
