# jmilinovich.com Style Guide

## Typography

### Font Families
- **Body text**: `Georgia, 'Times New Roman', serif`
- **Headings**: `Georgia, 'Times New Roman', serif`
- **Navigation / UI chrome**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  - Applies to: nav links, dates, tags, footer text, social links, metadata

### Font Sizes (rem-based, html at 62.5% so 1rem = 10px)
- **Hero h1** (homepage, blog post titles): `clamp(3.2rem, 2.7rem + 1.5625vw, 5.2rem)`
- **Section h1** (about, writing, talks, projects): `clamp(2.4rem, 1vw + 2rem, 3.2rem)`
- **Content / body text**: `clamp(1.7rem, 0.38vw + 1.4rem, 2rem)`
- **List item titles** (post cards): `clamp(1.8rem, 1.2rem + 0.8vw, 2.4rem)`
- **Small / meta text** (dates, tags, footer): `1.4rem`
- **Nav links**: `1.5rem` (desktop), `2.4rem` (mobile overlay)
- **Inline code**: `1.5rem` (rem, not px)

### Font Weights
- **Normal text**: `400`
- **Nav links / meta labels**: `500`
- **Project names**: `600`

### Line Heights
- **Body default**: `1.6`
- **Headings**: `1.15`
- **Content blocks**: `1.7`

### Letter Spacing
- **Headings**: `-0.02em`

## Colors

### Text
- **Primary text**: `#333`
- **Heading text**: `#15171a`
- **Muted / secondary**: `#999`
- **Tertiary**: `#666`

### Links
- **Content links** (post titles, talk links, blog body links): `#1a4dc2`
- **Navigation links**: `#15171a`
- **Footer / muted links**: `#999`

### Backgrounds
- **Page**: `#fff`
- **Code blocks / pills**: `#f5f5f5`

### Borders
- **Dividers**: `#e6e6e6`
- **Blockquote left border**: `#e6e6e6`

## Link Behavior

### Hover Pattern (one pattern, used everywhere)
- **Content links** (blue `#1a4dc2`): `text-decoration: underline` on hover
- **Navigation links** (dark `#15171a`): `opacity: 0.8` on hover
- **Muted links** (`#999`): `opacity: 0.8` on hover

### Transitions
- All interactive elements: `transition: opacity 0.2s ease`
- No transition needed for underline toggle (it should be instant)

## Spacing

### Paragraph bottom margin
- `1.5rem` everywhere

### List padding-left
- `2rem` everywhere

### Section / card bottom margin
- Post cards: `2rem`
- Talk items: `1.5rem` margin + `1.5rem` padding (with border)
- Project cards: `3rem` margin + `3rem` padding (with border)

### Page heading bottom margin
- `2rem` for all section h1s

## Layout

### Container
- `max-width: 720px`
- `margin: 0 auto`
- `padding: 0 2rem`

### Header
- Fixed, `height: 100px` (desktop), `64px` (mobile)
- Body `padding-top` matches header height

### Responsive Breakpoint
- `max-width: 767px`

## Principles

1. **Serif-forward**: Georgia for all reading content. Sans-serif only for UI chrome.
2. **Understated**: No flashy colors. Blue links, dark text, gray metadata.
3. **Consistent units**: All sizes in `rem`. No `px` for font sizes.
4. **One hover pattern per link type**: Don't mix opacity and underline on the same element.
5. **Fluid typography**: Use `clamp()` for content text. Static `rem` for UI text.
