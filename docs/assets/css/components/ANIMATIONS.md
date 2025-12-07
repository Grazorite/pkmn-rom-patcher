# Animation System Documentation

## Overview

The ROM Patcher project now features a comprehensive, modular animation system that provides consistent, performant animations across all components. The system is built with CSS custom properties, GPU acceleration, and accessibility considerations.

## Architecture

### Core Components

1. **`animations.css`** - Core animation system with keyframes, utilities, and variables
2. **`animations.js`** - JavaScript utilities for complex animations and interactions
3. **Component Integration** - Enhanced existing components with consistent animations

### Animation Variables

```css
:root {
    --anim-duration-fast: 0.15s;
    --anim-duration-normal: 0.3s;
    --anim-duration-slow: 0.6s;
    --anim-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --anim-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --anim-easing-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## Animation Categories

### 1. Entrance Animations

- **fadeIn** - Simple opacity transition
- **fadeInUp/Down/Left/Right** - Fade with directional movement
- **scaleIn** - Scale from 0.9 to 1.0 with fade
- **scaleInBounce** - Bouncy scale entrance
- **slideIn[Direction]** - Slide from off-screen

### 2. Hover Effects

- **hover-lift** - Subtle upward movement (-4px)
- **hover-lift-strong** - Strong upward movement (-8px)
- **hover-scale** - Scale to 1.05
- **hover-scale-strong** - Scale to 1.1
- **hover-glow** - Add glowing box-shadow
- **hover-shimmer** - Shimmer effect overlay

### 3. Loading States

- **loading-skeleton** - Animated placeholder content
- **pulse** - Breathing animation for status indicators
- **spin** - Rotation for loading spinners
- **shimmer** - Moving gradient effect

### 4. Interactive Effects

- **Ripple Effect** - Material Design-style click feedback
- **Staggered Animations** - Sequential element animations
- **Smooth Scrolling** - Eased scroll-to-element

## Usage Examples

### CSS Classes

```css
/* Basic entrance animation */
.hack-card {
    animation: scaleIn var(--anim-duration-normal) var(--anim-easing-smooth) both;
}

/* Hover effects */
.button {
    transition: all var(--anim-duration-normal) var(--anim-easing-smooth);
}

.button:hover {
    transform: translateY(-2px) translateZ(0);
}

/* Staggered animations */
.stagger-children > * {
    animation-delay: calc(var(--stagger-delay, 0.1s) * var(--stagger-index, 0));
}
```

### JavaScript Integration

```javascript
import { AnimationUtils } from '../utils/animations.js';

// Animate hack cards with stagger
const cards = document.querySelectorAll('.hack-card');
AnimationUtils.animateHackCards(cards);

// Add ripple effect to buttons
button.addEventListener('click', (e) => {
    AnimationUtils.addRippleEffect(button, e);
});

// Show loading skeleton
const skeletons = AnimationUtils.showLoadingSkeleton(container, 6, 'card');

// Hide loading skeleton
AnimationUtils.hideLoadingSkeleton(container);
```

## Performance Optimizations

### GPU Acceleration

All animated elements use `transform: translateZ(0)` and `will-change` properties for hardware acceleration:

```css
.animated-element {
    transform: translateZ(0);
    will-change: transform, opacity;
}
```

### Reduced Motion Support

The system respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Mobile Optimizations

Reduced animation durations and transforms on mobile devices:

```css
@media (max-width: 768px) {
    :root {
        --anim-duration-fast: 0.1s;
        --anim-duration-normal: 0.2s;
        --anim-duration-slow: 0.4s;
    }
}
```

## Component Enhancements

### Hack Grid Cards

- **Fixed Issue**: Cards now properly animate on hover with consistent timing
- **Enhancements**:
  - Staggered entrance animations
  - Shimmer effect on image hover
  - Ripple effect on click
  - GPU-accelerated transforms

### Navigation

- **Sidebar**: Smooth expand/collapse with shimmer effects
- **Links**: Slide-in hover effects with directional movement
- **Buttons**: Consistent hover states with scale and glow

### Detail Panel

- **Entrance**: Smooth slide-in from right with backdrop blur
- **Tabs**: Animated tab switching with fade transitions
- **Content**: Staggered content appearance

### UI Elements

- **Badges**: Hover scale with shimmer overlay
- **Buttons**: Consistent hover/active states across all button types
- **Form Elements**: Focus animations with scale and glow

## Animation Timing

### Standard Durations

- **Fast (0.15s)**: Micro-interactions, active states
- **Normal (0.3s)**: Standard hover effects, transitions
- **Slow (0.6s)**: Page transitions, complex animations

### Easing Functions

- **Smooth**: Standard Material Design easing for most transitions
- **Bounce**: Playful entrance animations
- **Elastic**: Special emphasis animations

## Best Practices

### 1. Consistency

- Use CSS custom properties for timing and easing
- Apply consistent hover states across similar elements
- Maintain visual hierarchy through animation timing

### 2. Performance

- Use `transform` and `opacity` for animations when possible
- Enable GPU acceleration with `translateZ(0)`
- Set appropriate `will-change` properties

### 3. Accessibility

- Respect `prefers-reduced-motion`
- Provide alternative feedback for users who disable animations
- Ensure animations don't interfere with screen readers

### 4. Progressive Enhancement

- Ensure functionality works without animations
- Use animations to enhance, not replace, user feedback
- Test across different devices and connection speeds

## Browser Support

- **Modern Browsers**: Full support for all animations
- **Legacy Browsers**: Graceful degradation with basic transitions
- **Mobile**: Optimized performance with reduced complexity

## Debugging

### Animation Inspector

Use browser dev tools to inspect animations:

1. Open DevTools → Animations panel
2. Trigger animations to see timing and easing
3. Adjust CSS custom properties in real-time

### Performance Monitoring

Monitor animation performance:

```javascript
// Check for dropped frames
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (entry.name === 'animation-frame') {
            console.log('Frame time:', entry.duration);
        }
    }
});
observer.observe({ entryTypes: ['measure'] });
```

## Future Enhancements

1. **Intersection Observer Integration** - Scroll-triggered animations
2. **Advanced Easing** - Custom cubic-bezier functions
3. **Animation Sequences** - Choreographed multi-element animations
4. **Theme Integration** - Animation styles that adapt to themes
5. **Gesture Support** - Touch-based animation triggers

## Migration Guide

### From Legacy Animations

1. Replace hardcoded durations with CSS custom properties
2. Add GPU acceleration to existing transforms
3. Update easing functions to use standard curves
4. Add reduced motion support

### Adding New Animations

1. Define keyframes in `animations.css`
2. Create utility classes following naming convention
3. Add JavaScript helpers to `animations.js` if needed
4. Test across devices and accessibility settings

## Conclusion

The enhanced animation system provides a solid foundation for consistent, performant, and accessible animations throughout the ROM Patcher application. The modular approach ensures maintainability while the performance optimizations guarantee smooth user experiences across all devices.
