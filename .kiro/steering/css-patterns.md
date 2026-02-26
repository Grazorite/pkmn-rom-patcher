---
inclusion: fileMatch
fileMatchPattern: "docs/assets/css/**/*.css"
---

# CSS Patterns

When editing CSS files in this project:

- All custom properties are defined in `docs/assets/css/base/variables.css` — add new tokens there, never inline
- Color palette: `--primary` (#667eea), `--secondary` (#764ba2), `--accent` (#f093fb), `--success`, `--warning`, `--error`
- Spacing tokens: `--spacing-xs` (4px) through `--spacing-xl` (32px)
- Border radius: `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-full`
- Z-index hierarchy: background(-1) → content(1) → sidebar(100) → detail-panel(1000) → modals(2000)
- Animations: use `--anim-duration-*` and `--anim-easing-*` variables, `fadeInUp` for page loads
- Badge system uses `data-*` attributes: `badge-rom[data-rom="Crystal"]`, `badge-system[data-system="GBA"]`
- Always add `prefers-reduced-motion` media query for new animations
- Component CSS files go in `docs/assets/css/components/`
- Import new component files in `docs/assets/css/main.css`
