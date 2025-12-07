# Style Guide

## Animation System

### Timing Standards

All page load animations follow landing page timing:

- **Duration**: 1s (`--anim-duration-slow`)
- **Easing**: ease-out (`--anim-easing-standard`)
- **Stagger**: 0.2s intervals (`--anim-delay-1` through `--anim-delay-5`)
- **Distance**: 30px translateY for fadeInUp

### Animation Variables

```css
--anim-duration-instant: 0.15s;  /* Button clicks */
--anim-duration-fast: 0.3s;      /* Hover effects */
--anim-duration-normal: 0.6s;    /* Panel transitions */
--anim-duration-slow: 1s;        /* Page load */

--anim-easing-standard: ease-out;
--anim-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--anim-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

--anim-delay-1: 0.2s;
--anim-delay-2: 0.4s;
--anim-delay-3: 0.6s;
--anim-delay-4: 0.8s;
--anim-delay-5: 1s;
```

### Usage Pattern

```css
.element {
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp var(--anim-duration-slow) var(--anim-easing-standard) var(--anim-delay-1) both;
}
```

### Utility Classes

```html
<div class="anim-fade-in-up anim-delay-2">Content</div>
```

## Design Tokens

### Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-full: 9999px;
```

## Component Patterns

### Button Shimmer Effect

All interactive elements include shimmer on hover:

```css
.button {
    position: relative;
    overflow: hidden;
}

.button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover::before {
    left: 100%;
}
```

### Badge System

- ROM badges: `badge-rom[data-rom="Crystal"]`
- System badges: `badge-system[data-system="GBA"]`
- Difficulty badges: `badge-difficulty[data-difficulty="Hard"]`

## File Architecture

```cssß
css/
├── base/
│   ├── variables.css    # All CSS custom properties
│   ├── reset.css        # CSS reset
│   └── animations.css   # Keyframes + utility classes
├── layout/
│   └── app.css          # Grid layouts
├── components/
│   ├── button-standard.css
│   ├── ui-elements.css
│   ├── hack-grid.css
│   ├── detail-panel.css
│   ├── patcher.css
│   └── ...
└── themes/
    └── dark.css
```

## Best Practices

1. **Use CSS variables** - Never hardcode timing/colors
2. **Consistent animations** - All page loads use fadeInUp with staggered delays
3. **Hardware acceleration** - Use `transform: translateZ(0)` for animated elements
4. **Accessibility** - Respect `prefers-reduced-motion`
5. **No duplication** - Single source of truth in base/ files
