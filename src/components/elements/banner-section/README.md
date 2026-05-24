# banner-section element

All variants of the `banner-section` element type live here. This is the **pilot** for the element-library file structure (Day 7b) per VISION.md D12 + ADR-001 v1.2 (Element Library + Registry section).

## Variants

| Variant ID | Description |
|-----------|-------------|
| `default` | Original FMS banner: white-by-default card with shadow, large radius, slideshow + dots. |

## Variant contract

Every variant component MUST:

1. **Render its root with `data-element="banner-section"`** so Layer 2 CSS vars (`--banner-bg`, `--banner-border`, `--banner-radius`) resolve at the right scope.
2. **Accept the same props as the wrapper:** `{ config, resolvedTemplate, elementConfigs }`. The wrapper passes them through unchanged.
3. **Consume Layer 2 vars** as the fallback for color/border/radius, not Layer 1 directly. The Layer 2 vars themselves chain to Layer 1 via `var(--color-surface)` etc.
4. **Be self-contained** — no globals, no shared mutable state, no implicit context. Read everything from props.
5. **Respect Layer 3 inline overrides** — when `config.backgroundColor` is set, it wins over `var(--banner-bg)`. Same for border/radius.

## Adding a new variant

1. Create `<variant-name>.jsx` in this folder.
2. Implement the 5 rules above.
3. Register in `index.js` `VARIANTS` map.
4. Add the variant to the table above.
5. Templates can set `variant: "<variant-name>"` in their `banner-section` entry to use it.

The resolver (`index.js > getBannerVariant`) falls back to `default` when a template's `variant` field is missing or unknown — no silent errors, but no crashes either.

## Layer cascade for banner

```
Layer 3 (inline): cfg.backgroundColor    wins if set
       ↓
Layer 2 (vars):   var(--banner-bg)        wins next
       ↓
Layer 1 (token):  var(--color-surface)    reached via the chain declared in
                                          each template's `banner-section.vars`
```
