# CSS Architecture

This project uses a modular CSS architecture based on ITCSS (Inverted Triangle CSS) principles.

## Structure

```
styles/
├── main.css              # Entry point - imports all modules
├── base/                 # Foundation styles
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # Reset and base styles
│   └── animations.css    # Reusable animations
├── layout/               # Layout components
│   └── app.css          # App structure and grid
├── components/           # UI components
│   ├── theme-toggle.css  # Theme switcher
│   ├── sidebar.css       # Search and filters
│   ├── hack-grid.css     # ROM hack cards
│   ├── detail-panel.css  # Hack details panel
│   └── ui-elements.css   # Buttons, badges, etc.
└── themes/               # Theme variations
    └── dark.css         # Dark mode overrides
```

## Import Order

1. **Base**: Variables, reset, animations
2. **Layout**: App structure
3. **Components**: UI elements
4. **Themes**: Color scheme overrides

## Best Practices

- Use CSS custom properties for theming
- Keep components self-contained
- Follow BEM naming convention
- Use semantic class names
- Minimize nesting depth
- Group related properties together