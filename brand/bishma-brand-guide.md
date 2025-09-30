# Bishma Brand Guide
*Your Terminal-Style Task Management Companion*

## Brand Overview

**Bishma** is a retro terminal-inspired task management application that guides users through daily chaos with authentic command-line aesthetics. The brand embodies the wisdom and guidance of a digital sherpa, helping users navigate their priorities with terminal-style efficiency.

### Brand Personality
- **Wise Guide**: Like a digital sherpa leading through complexity
- **Retro-Tech**: Nostalgic terminal aesthetics with modern functionality  
- **Efficient**: Clean, purposeful interactions without bloat
- **Reliable**: Steady, consistent companion for daily productivity

---

## Visual Identity

### Logo & Favicon
- **Primary Mark**: Mountain peak silhouette in sherpa green
- **Style**: Geometric, minimalist, terminal-inspired sharp edges
- **Usage**: Works at all sizes, maintains clarity at favicon dimensions
- **File**: `public/favicon.png` (32x32px PNG)

### Color Palette

#### Primary Colors
```css
/* Sherpa Green - Primary brand color */
--sherpa: 166 100% 45%;        /* #00E5A0 */
--sherpa-foreground: 0 0% 0%;  /* Black text on sherpa */

/* Phosphor Green - Terminal accent */  
--phosphor: 120 100% 50%;      /* #00FF00 */
--phosphor-muted: 120 100% 25%; /* Dimmed phosphor */
```

#### Priority System Colors
```css
--priority-p0: 0 100% 50%;     /* Critical - Red */
--priority-p1: 30 100% 50%;    /* High - Orange */  
--priority-p2: 60 100% 50%;    /* Medium - Yellow */
--priority-p3: 120 100% 50%;   /* Low - Green */
```

#### Terminal System Colors
```css
/* Dark theme base */
--background: 24 10% 10%;      /* #1C1917 - Dark brown */
--foreground: 60 9% 98%;       /* #FAFAF9 - Off white */
--muted: 60 5% 96%;           /* #F5F5F4 */
--border: 20 6% 90%;          /* #E7E5E4 */

/* Syntax highlighting */
--syntax-keyword: 210 100% 60%;   /* Blue keywords */
--syntax-string: 120 100% 40%;    /* Green strings */
--syntax-comment: 0 0% 60%;       /* Gray comments */
--syntax-number: 30 100% 60%;     /* Orange numbers */
```

#### Usage Guidelines
- **DO**: Use semantic color variables (`--sherpa`, `--phosphor`) 
- **DON'T**: Use direct hex codes or RGB values in components
- **CRITICAL**: All colors must be in HSL format for theming support

---

## Typography

### Font Stack
```css
/* Primary - Terminal/Code */
font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;

/* Secondary - UI Elements */  
font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
```

### Typography Scale
- **Display**: Large terminal headers, ASCII art
- **Heading**: Section titles, command prompts
- **Body**: Regular terminal text, task descriptions  
- **Caption**: Status indicators, metadata
- **Code**: Inline commands, syntax highlighting

### Usage Guidelines
- **Terminal Context**: Always use JetBrains Mono
- **UI Elements**: Use Inter for modern interface components
- **Code/Commands**: Maintain monospace for alignment
- **Accessibility**: Ensure 4.5:1 contrast ratio minimum

---

## Component Design Principles

### Terminal Aesthetics
- **Sharp Edges**: Minimal border radius, geometric forms
- **Monospace Alignment**: Text alignment follows terminal grid
- **Glow Effects**: Subtle phosphor-green glows for active states
- **Scan Lines**: Optional retro CRT effects for ambiance

### Interactive Elements
```css
/* Button states */
.button-primary {
  background: hsl(var(--sherpa));
  color: hsl(var(--sherpa-foreground));
  border: 1px solid hsl(var(--sherpa));
}

.button-primary:hover {
  background: hsl(var(--sherpa) / 0.9);
  box-shadow: 0 0 10px hsl(var(--sherpa) / 0.5);
}
```

### Animation Guidelines
- **Typewriter Effects**: For text appearance
- **Cursor Blink**: Terminal-style cursor animations  
- **Fade Transitions**: Smooth but quick (200-300ms)
- **Glow Pulses**: Subtle breathing effects for active states

---

## Content & Voice

### Tone of Voice
- **Authoritative but Friendly**: Like a knowledgeable guide
- **Technical but Accessible**: Terminal commands explained clearly
- **Efficient Communication**: No unnecessary words
- **Encouraging**: Positive reinforcement for task completion

### Terminology
- **Tasks**: Never "todos" - maintain professional terminology
- **Commands**: Use terminal-style command language
- **Priority Levels**: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
- **Status**: Active, Completed, Pending, Blocked

### Writing Style
```
✅ Good: "Task completed successfully"
❌ Avoid: "Yay! You did it! 🎉"

✅ Good: "Execute priority sort [P0-P3]"  
❌ Avoid: "Let's organize your tasks!"
```

---

## Layout & Spacing

### Grid System
- **Terminal Grid**: 12-column responsive grid
- **Gutters**: 16px base, 24px desktop
- **Breakpoints**: Mobile-first responsive design

### Spacing Scale
```css
/* Consistent spacing using CSS custom properties */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */  
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

### Component Structure
1. **Status Bar**: System information, time, user status
2. **Main Terminal**: Primary interaction area
3. **Task Cards**: Structured data display with priority indicators
4. **Command Input**: Bottom-anchored input with autocomplete

---

## Implementation Guidelines

### File Organization
- **Components**: Small, focused, single-responsibility
- **Styles**: Use design system tokens, no hardcoded values
- **Assets**: Optimize for terminal aesthetic (sharp, minimal)

### Performance Standards
- **Load Time**: < 2 seconds initial load
- **Animations**: 60fps smooth terminal effects
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: Touch-friendly while maintaining terminal feel

### Code Standards
```tsx
// ✅ Good - Uses design system
className="bg-background text-foreground border-border"

// ❌ Bad - Hardcoded values  
className="bg-gray-900 text-white border-gray-700"
```

---

## Brand Applications

### Favicon Usage
- **Browser Tabs**: Mountain peak maintains visibility at 16px
- **Bookmarks**: Clear brand recognition
- **PWA Icon**: Scales appropriately for mobile home screens

### Terminal Customization
- **Prompt Style**: `bishma:~$` with sherpa green highlighting
- **Success States**: Phosphor green confirmations
- **Error States**: Priority P0 red with clear messaging
- **Loading States**: Typewriter animation with cursor

---

## Don'ts - Brand Violations

### Visual Don'ts
- ❌ Rounded corners on primary interface elements
- ❌ Bright saturated colors outside the defined palette  
- ❌ Comic Sans or casual fonts
- ❌ Gradient backgrounds (except subtle terminal glow)
- ❌ Excessive animations or bouncy effects

### Content Don'ts  
- ❌ Overly casual language or slang
- ❌ Emoji-heavy communication
- ❌ Marketing speak or buzzwords
- ❌ Inconsistent terminology for features

### Technical Don'ts
- ❌ Direct color values in components
- ❌ Inline styles instead of design system classes
- ❌ Breaking the monospace grid alignment
- ❌ Ignoring dark/light theme variables

---

*This brand guide should be referenced for all design and development decisions to maintain consistency across the Bishma ecosystem.*