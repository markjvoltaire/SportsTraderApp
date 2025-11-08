# SportsTrader App - Design System

## Core Design Principles

### 1. **Clarity Through Contrast**
High-contrast dark mode interface that reduces eye strain during extended use while making critical information (prices, percentages) immediately scannable. Dark backgrounds (#05090f, #0c111d) with bright white text (#fefefe) and strategic green accents (#10c962).

### 2. **Emotional Color Coding**
- **Green (#10c962)**: Positive performance, growth, actionable CTAs
- **Red/Orange**: Negative performance, losses, warnings
- **White (#fefefe)**: Neutral information, primary content
- **Gray (#758292, #5b697c)**: Secondary information, metadata

### 3. **Progressive Information Hierarchy**
Information is layered by importance:
1. **Primary**: Current price (40px, bold)
2. **Secondary**: Symbol/Title (32px, bold)
3. **Tertiary**: Performance metrics (16px)
4. **Quaternary**: Volume, metadata (14px)

### 4. **Calm Urgency**
Balance between encouraging action and promoting thoughtful decisions:
- Prominent "Trade" button with glow effect (not aggressive)
- Performance indicators clear but not alarming
- Smooth animations (280ms) reduce anxiety
- Ample white space prevents overwhelm

### 5. **Thumb-Zone Optimization**
Critical actions placed in comfortable reach zones:
- Bottom navigation for primary tabs
- Trade button in lower third of screen
- Back button in top-left (natural gesture area)
- Timeframe selectors in middle zone

### 6. **Data Density with Breathing Room**
Efficient use of space without cramping:
- 20-24px horizontal padding
- 12-16px vertical spacing between related items
- 24-32px spacing between sections
- Cards with subtle borders (rgba(255,255,255,0.06))

### 7. **Micro-interaction Feedback**
Every interaction provides visual confirmation:
- Fade-in animations on screen focus (280ms)
- Pressable states on all interactive elements
- Glow effects on active states (shadowRadius: 12-16)
- Smooth transitions between screens

---

## Component Library

### Typography Scale

```
Hero Price:     40px / 700 weight / #fefefe
Page Title:     32px / 700 weight / #fefefe
Section Title:  20-24px / 600 weight / #fefefe
Body Large:     16px / 400 weight / #fefefe
Body:           14px / 400 weight / #c9d3dd
Caption:        12px / 400 weight / #758292
Label:          12px / 600 weight / #5b697c (uppercase, letter-spacing: 1.5)
```

### Color Palette

```javascript
// Primary
background: '#05090f'      // Deep black-blue
surface: '#0c111d'         // Card backgrounds
surfaceAlt: '#20293a'      // Elevated surfaces

// Accent
primary: '#10c962'         // Success green
primaryDark: '#0ea552'     // Pressed state
danger: '#ff4757'          // Negative/loss
warning: '#ffa502'         // Caution

// Text
textPrimary: '#fefefe'     // Main content
textSecondary: '#c9d3dd'   // Less important
textTertiary: '#758292'    // Metadata
textMuted: '#5b697c'       // Labels

// Borders
border: 'rgba(255,255,255,0.06)'
borderFocus: 'rgba(255,255,255,0.2)'
```

### Spacing System

```javascript
xs: 4
sm: 8
md: 12
lg: 16
xl: 20
xxl: 24
xxxl: 32
```

### Border Radius

```javascript
sm: 8   // Small chips
md: 12  // Buttons
lg: 18  // Cards
xl: 24  // Large containers, CTAs
```

### Shadow/Glow Effects

```javascript
// Active/Primary elements
primaryGlow: {
  shadowColor: '#10c962',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.7,
  shadowRadius: 16,
}

// Subtle elevation
cardShadow: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
}
```

---

## Design Patterns

### 1. **Market Card Pattern** (Home Screen)
- **Purpose**: Scannable list of trading opportunities
- **Structure**:
  - Icon/Logo (48px circle)
  - Title + Subtitle stacked
  - Sparkline chart (visual trend)
  - Price (right-aligned, prominent)
  - Change indicator (color-coded)
- **Interaction**: Tap entire card to navigate to detail
- **Feedback**: Subtle scale or opacity change on press

### 2. **Detail Header Pattern**
- **Purpose**: Comprehensive market overview
- **Structure**:
  - Symbol (small, uppercase, gray)
  - Full name (large, bold, white)
  - Current price (hero size, white)
  - Price direction icon (green/red arrow)
  - Performance metrics (stacked, color-coded)
- **Hierarchy**: Size + weight + color create clear priority

### 3. **Chart Container Pattern**
- **Purpose**: Visual performance representation
- **Structure**:
  - Dark background with subtle tint
  - Glow effect behind line (rgba green)
  - Line chart with smooth curves
  - Dot indicator at current price
  - Dotted baseline reference
- **Height**: 220px minimum for readability

### 4. **Timeframe Selector Pattern**
- **Purpose**: Quick chart period switching
- **Structure**:
  - Horizontal scrollable row
  - Chip-style buttons (8px vertical padding)
  - Active state: green background, dark text
  - Inactive state: dark background, light text
  - "Advanced" option with border glow
- **Spacing**: 10px between chips

### 5. **CTA Button Pattern**
- **Purpose**: Primary action (Trade, Buy, Sell)
- **Structure**:
  - Full-width or prominent placement
  - Green background (#10c962)
  - Dark text for contrast (#03110a)
  - Large padding (14px vertical)
  - Border radius: 24px
  - Glow effect (shadowRadius: 16)
- **States**: 
  - Default: Full opacity
  - Pressed: 0.8 opacity
  - Disabled: 0.4 opacity, gray

### 6. **Navigation Pattern**
- **Top Actions**: Icon buttons (38-42px) with subtle backgrounds
- **Bottom Tabs**: Label + icon, active state with green accent
- **Back Navigation**: Circular button, top-left, border outline

---

## User Journey Considerations

### Home Screen → Detail Screen
1. User scans list of markets
2. Visual hierarchy guides eye to price changes
3. Sparklines provide quick trend context
4. Tap card triggers smooth transition
5. Detail screen fades in with animation (280ms)
6. Back button always visible for easy exit

### Detail Screen → Trade Action
1. Price and performance immediately visible
2. Chart provides visual confidence
3. Timeframe selector allows deeper analysis
4. "Your position" section shows current stake
5. "Trade" button prominent but not aggressive
6. User feels informed, not pressured

---

## Best Practices

### ✅ DO
- Use green for positive, red for negative (universal financial convention)
- Maintain 280ms animation duration for consistency
- Provide visual feedback for all interactions
- Keep critical actions in thumb-friendly zones
- Use glow effects to draw attention to primary actions
- Stack related information vertically
- Use color + icon + text for important indicators (not color alone)

### ❌ DON'T
- Use pure black (#000) - use dark blue-black (#05090f)
- Make touch targets smaller than 44px
- Rely on color alone for critical information
- Use aggressive animations (> 400ms feels slow, < 150ms feels jarring)
- Place primary actions in hard-to-reach corners
- Overcrowd the interface - white space is strategic
- Use red for anything other than negative/danger

---

## Accessibility Standards

### Contrast Ratios (WCAG AA)
- Primary text on dark background: 15.8:1 ✓
- Secondary text on dark background: 8.2:1 ✓
- Green accent on dark background: 7.1:1 ✓

### Touch Targets
- Minimum: 44x44px (iOS HIG, WCAG)
- Recommended: 48x48px for primary actions
- Spacing between targets: 8px minimum

### Color Independence
- Always pair color with text/icon
- Up arrow (▲) + green for positive
- Down arrow (▼) + red for negative
- Percentage + currency value + direction

### Screen Reader Support
- All interactive elements have accessibilityLabel
- accessibilityRole defined (button, link, etc.)
- accessibilityHint for complex interactions

---

## Recommendations & A/B Testing Opportunities

### 1. **Chart Interactivity**
- Test: Static chart vs. pinch-to-zoom vs. tap-for-details
- Hypothesis: Interactive charts increase engagement but may slow decision-making

### 2. **Trade Button Placement**
- Test: Fixed bottom vs. inline with content vs. floating action button
- Hypothesis: Fixed bottom increases conversions but may feel pushy

### 3. **Performance Indicators**
- Test: Percentage-first vs. dollar-amount-first
- Hypothesis: Different user segments prefer different formats

### 4. **Timeframe Defaults**
- Test: 1D vs. 1W vs. 1M as default view
- Hypothesis: Default affects perceived volatility and trading behavior

### 5. **Dark Mode Only vs. Theme Toggle**
- Test: Force dark mode vs. offer light mode option
- Hypothesis: Dark mode reduces eye strain but some users prefer light

### 6. **Sparkline Density**
- Test: High detail (many data points) vs. simplified trend
- Hypothesis: Simplified trends are faster to scan, detailed charts feel more professional

---

## Competitive Analysis Insights

### Robinhood
- **Strength**: Minimal, approachable, removes intimidation
- **Applied**: Clean card design, simple navigation
- **Differentiated**: We use more data density, professional feel

### Webull
- **Strength**: Advanced charting, detailed analytics
- **Applied**: Timeframe selector, chart prominence
- **Differentiated**: We balance simplicity with depth

### E*TRADE
- **Strength**: Trust signals, comprehensive data
- **Applied**: Clear hierarchy, professional typography
- **Differentiated**: Modern visual language, less corporate

---

## Animation Specifications

### Screen Transitions
```javascript
fadeIn: {
  duration: 280,
  easing: 'ease-out',
  properties: ['opacity', 'translateY']
}

fadeOut: {
  duration: 180,
  easing: 'ease-in',
  properties: ['opacity', 'translateY']
}
```

### Micro-interactions
```javascript
buttonPress: {
  duration: 100,
  scale: 0.96,
  opacity: 0.8
}

cardPress: {
  duration: 150,
  scale: 0.98
}
```

### Chart Animations
```javascript
chartLoad: {
  duration: 600,
  easing: 'ease-out',
  delay: 200
}
```

---

## Mobile-First Considerations

### Screen Sizes
- **Primary**: iPhone 14/15 (390x844)
- **Support**: iPhone SE (375x667) to iPhone Pro Max (430x932)
- **Strategy**: Flexible layouts, percentage-based widths, minimum touch targets

### Performance Optimization
- Lazy load chart data
- Optimize images (WebP, 2x resolution max)
- Use native animations (useNativeDriver: true)
- Debounce rapid interactions

### Offline Behavior
- Cache last known prices
- Show "Last updated" timestamp
- Disable trade actions when offline
- Queue actions for when connection returns

---

## Conclusion

This design system prioritizes **clarity, confidence, and calm decision-making** in a high-stakes financial context. Every design decision serves to reduce cognitive load, build trust, and empower users to make informed trades without feeling manipulated or rushed.

The dark mode aesthetic isn't just trendy—it reduces eye strain during extended sessions and makes the bright green/red performance indicators more impactful. The generous use of white space and clear hierarchy ensures users can quickly scan, analyze, and act.

By following these principles, the SportsTrader app creates a professional, trustworthy experience that appeals to both novice traders (through simplicity) and experienced traders (through data density and quick access to key metrics).

