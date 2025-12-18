# PRP: Score Generation UI

## Overview
Build the complete score generation UI that connects to the scoring engine. This is the main user-facing feature where users enter their handicap and course details, click generate, and see a color-coded scorecard with statistics. This brings the app to life visually and makes the scoring engine usable.

## Context Files Read
- [x] CLAUDE.md - Project rules, scoring algorithm details, color scheme
- [x] docs/PLANNING.md - Architecture, data models, UI requirements
- [x] docs/DECISIONS.md - Glass-morphism design, color scheme from Python
- [x] docs/TASK.md - Current status (scoring engine complete, UI next)
- [x] INITIAL/09-score-generation-ui.md - Detailed requirements
- [x] /old/generate_tab.py - Python UI structure, scorecard layout
- [x] /old/ui_components.py - create_stat_card(), create_button() patterns
- [x] /old/golf_courses.json - Baytree course data (Blue and White tees)
- [x] /examples/glassbutton/button.css - Glass button styling
- [x] /examples/jurigregg/main.css - Glass button adapted for dark theme
- [x] src/lib/scoring/ - Scoring engine (already implemented)
- [x] src/lib/utils/colors.ts - getScoreColor() function (already implemented)
- [x] src/types/index.ts - TypeScript interfaces (already implemented)

## Requirements

### From INITIAL File
1. **Score Input Form** - Fields for handicap index (0-54), course rating (60-80), slope rating (55-155)
2. **Course Selector** - Dropdown to select preset courses (Baytree Blue/White)
3. **Generate Button** - Glass button styling, calls GhostGolfer.generateRound()
4. **Scorecard Display** - 18-hole table with columns: Hole, Par, HCP, Strokes, Gross, Net
5. **Color-coded Scores** - Eagle=green, birdie=cyan, par=gray, bogey=orange, double=deep orange, triple+=red
6. **Stats Cards** - Three cards showing Gross Score, Net Score, Course Handicap
7. **Front/Back 9 Totals** - OUT row after hole 9, IN row after hole 18, TOT row at end
8. **Responsive Design** - Mobile-first, horizontal scroll for scorecard on small screens

### Data Validation
- Use existing Zod validation from scoring engine
- Show error messages for invalid inputs
- Validate before generation

### State Management
- React useState for config, round result, loading state
- Small delay (300ms) for UX feel on generate

## Technical Approach

### Component Architecture
```
src/components/
├── GlassButton.tsx       # Reusable glass button (from examples)
├── GlassCard.tsx         # Reusable glass card container
├── ScoreForm.tsx         # Form with course selector and handicap input
├── CourseSelector.tsx    # Dropdown for preset courses
├── ScoreCard.tsx         # Full 18-hole scorecard table
├── StatsCards.tsx        # Three stat cards row
└── HoleRow.tsx           # Single scorecard row (reusable)

src/lib/courses/
└── presets.ts            # Baytree course data

src/hooks/
└── useScoreGeneration.ts # Encapsulate generation logic (optional)

src/app/
└── page.tsx              # Updated main page with full UI
```

### Styling Approach
- Tailwind CSS for layout and utilities
- CSS custom properties for glass effect animations
- Dark theme from globals.css (already configured)
- Score colors via getScoreColor() (already implemented)

### Client Components
Components with state/events need `'use client'` directive:
- ScoreForm.tsx
- CourseSelector.tsx
- ScoreCard.tsx (for potential interactions)
- StatsCards.tsx
- Main page.tsx (orchestrates state)

## Implementation Steps

### Step 1: Create Preset Course Data
**Files**: `src/lib/courses/presets.ts`
**Actions**:
1. Create directory `src/lib/courses/`
2. Create `presets.ts` with Baytree Blue and White course data
3. Export PRESET_COURSES object with course keys
4. Export helper function to get course list for dropdown

**Code Pattern**:
```typescript
export interface PresetCourse {
  id: string;
  name: string;
  teeName: string;
  courseRating: number;
  slopeRating: number;
  parValues: number[];
  holeHandicaps: number[];
  yardages: number[];
}

export const PRESET_COURSES: PresetCourse[] = [
  {
    id: 'baytree-blue',
    name: 'Baytree National Golf Links',
    teeName: 'Blue',
    courseRating: 69.7,
    slopeRating: 126,
    parValues: [4,3,4,3,5,4,4,4,4,4,4,3,5,4,4,5,3,4],
    holeHandicaps: [3,17,15,7,9,11,1,13,5,4,14,18,8,12,6,10,16,2],
    yardages: [349,154,308,177,488,313,365,471,352,354,313,142,520,320,374,478,148,338],
  },
  // ... baytree-white
];
```

**Note**: JSON has par 8 on hole 8 for both courses - this appears to be a typo. Should be 4 (typical par 4). Fix in presets.

**Validation**: TypeScript compiles, exports work

---

### Step 2: Create GlassCard Component
**Files**: `src/components/GlassCard.tsx`
**Actions**:
1. Create reusable glass card container component
2. Use Tailwind classes matching dark theme
3. Accept children, optional className, optional accent color
4. Include subtle border and backdrop blur

**Code Pattern**:
```typescript
'use client';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`
      bg-slate-800/50
      backdrop-blur-sm
      border border-slate-700/50
      rounded-lg
      ${className}
    `}>
      {children}
    </div>
  );
}
```

**Validation**: Component renders correctly

---

### Step 3: Create GlassButton Component
**Files**: `src/components/GlassButton.tsx`, `src/app/globals.css` (add styles)
**Actions**:
1. Create GlassButton component with hover/active effects
2. Add simplified glass button CSS to globals.css
3. Support variants: primary (green), secondary (blue)
4. Include loading state support
5. Adapt from /examples/jurigregg/main.css for dark theme

**Code Pattern**:
```typescript
'use client';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}
```

**Validation**: Button renders with glass effect, hover works

---

### Step 4: Create CourseSelector Component
**Files**: `src/components/CourseSelector.tsx`
**Actions**:
1. Create dropdown component for course selection
2. Import PRESET_COURSES
3. Show course name + tee in dropdown
4. Call onChange callback with selected course
5. Style with dark theme (slate background, cyan accent)

**Validation**: Dropdown shows courses, selection works

---

### Step 5: Create ScoreForm Component
**Files**: `src/components/ScoreForm.tsx`
**Actions**:
1. Create form with:
   - CourseSelector dropdown
   - Handicap Index number input (0-54, step 0.1)
   - Course info display (rating, slope, par when course selected)
2. Display "Select a course to view details" when no course selected
3. Show calculated total par from parValues
4. Include Generate button (GlassButton)
5. Handle form validation and submit

**Code Pattern**:
```typescript
interface ScoreFormProps {
  onGenerate: (config: GhostGolferConfig) => void;
  isGenerating: boolean;
}
```

**Validation**: Form renders, validation works, onGenerate called

---

### Step 6: Create StatsCards Component
**Files**: `src/components/StatsCards.tsx`
**Actions**:
1. Create three stat cards in a row:
   - GROSS SCORE with +/- to par
   - NET SCORE with +/- to par
   - COURSE HCP (just the number)
2. Use GlassCard for each
3. Large number display (text-4xl or larger)
4. Color the gross/net based on score vs par
5. Show relative to par in parentheses (e.g., "+15" or "E" for even)

**Code Pattern**:
```typescript
interface StatsCardsProps {
  grossScore: number;
  netScore: number;
  courseHandicap: number;
  totalPar: number;
}
```

**Validation**: Cards display correctly with colors

---

### Step 7: Create HoleRow Component
**Files**: `src/components/HoleRow.tsx`
**Actions**:
1. Create reusable row for scorecard table
2. Accept hole data: hole number, par, handicap, strokes received, gross, net
3. Accept optional yardage
4. Color gross score using getScoreColor()
5. Support total row variant (bold, different background)
6. Support subtotal row variant (OUT/IN rows)

**Code Pattern**:
```typescript
interface HoleRowProps {
  hole: number | string;  // number for holes, 'OUT'/'IN'/'TOT' for totals
  par: number;
  handicap?: number;
  yardage?: number;
  strokesReceived?: number;
  gross: number;
  net: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}
```

**Validation**: Row renders with correct colors

---

### Step 8: Create ScoreCard Component
**Files**: `src/components/ScoreCard.tsx`
**Actions**:
1. Create full 18-hole scorecard table
2. Header row: HOLE, YDS, PAR, HCP, STR, GROSS, NET
3. Map over scores to create HoleRow for each
4. Insert OUT subtotal after hole 9
5. Insert IN subtotal after hole 18
6. Insert TOT total row at end
7. Calculate front 9 / back 9 / total sums
8. Responsive: horizontal scroll on mobile

**Code Pattern**:
```typescript
interface ScoreCardProps {
  round: GeneratedRound;
  holeHandicaps: number[];
  yardages: number[];
}
```

**Validation**: Full scorecard displays with all rows

---

### Step 9: Create useScoreGeneration Hook (Optional)
**Files**: `src/hooks/useScoreGeneration.ts`
**Actions**:
1. Encapsulate generation state and logic
2. Handle loading state with small delay for UX
3. Store config and round result
4. Export handleGenerate function

**Code Pattern**:
```typescript
export function useScoreGeneration() {
  const [config, setConfig] = useState<GhostGolferConfig | null>(null);
  const [round, setRound] = useState<GeneratedRound | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback((newConfig: GhostGolferConfig) => {
    setConfig(newConfig);
    setIsGenerating(true);
    setTimeout(() => {
      const golfer = new GhostGolfer(newConfig);
      setRound(golfer.generateRound());
      setIsGenerating(false);
    }, 300);
  }, []);

  return { config, round, isGenerating, generate };
}
```

**Validation**: Hook works correctly

---

### Step 10: Update Main Page
**Files**: `src/app/page.tsx`
**Actions**:
1. Add 'use client' directive
2. Import all components
3. Set up state (config, round, isGenerating) or use hook
4. Create two-column layout:
   - Left: ScoreForm (narrower)
   - Right: Results (StatsCards + ScoreCard)
5. Only show results section when round exists
6. Default handicap to 15.0
7. Default course to Baytree Blue
8. Responsive: stack on mobile

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│                   GOLF GHOST                         │
│            AI-Powered Score Generation               │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  COURSE      │  ┌────────┐ ┌────────┐ ┌────────┐   │
│  [Dropdown]  │  │ GROSS  │ │  NET   │ │ COURSE │   │
│              │  │  87    │ │  72    │ │  HCP   │   │
│  HANDICAP    │  │ (+15)  │ │  (E)   │ │  17    │   │
│  [15.0    ]  │  └────────┘ └────────┘ └────────┘   │
│              │                                       │
│  Rating: 69.7│  ┌─────────────────────────────────┐ │
│  Slope: 126  │  │ HOLE│YDS│PAR│HCP│STR│GRS│NET   │ │
│  Par: 71     │  │  1  │349│ 4 │ 3 │ 1 │ 5 │ 4    │ │
│              │  │  2  │154│ 3 │17 │ 0 │ 3 │ 3    │ │
│ [GENERATE]   │  │ ... │...│...│...│...│...│...   │ │
│              │  │ OUT │   │35 │   │   │ 42│ 35   │ │
│              │  │ ... │...│...│...│...│...│...   │ │
│              │  │ IN  │   │36 │   │   │ 45│ 37   │ │
│              │  │ TOT │   │71 │   │17 │ 87│ 72   │ │
│              │  └─────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────┘
```

**Validation**: Full page works end-to-end

---

### Step 11: Final Verification
**Files**: All
**Actions**:
1. Run TypeScript check: `npx tsc --noEmit`
2. Run linter: `npm run lint`
3. Run build: `npm run build`
4. Test manually in browser:
   - Select course, enter handicap, generate
   - Verify colors are correct
   - Check responsive layout
5. Update TASK.md
6. Git commit and push

**Validation**: All checks pass, app works

## Testing Requirements
- [ ] Form validates handicap range (0-54)
- [ ] Course selector populates with presets
- [ ] Selecting course shows rating/slope/par info
- [ ] Generate creates 18-hole scorecard
- [ ] Scores are color-coded correctly
- [ ] Front 9 (OUT) subtotal is correct
- [ ] Back 9 (IN) subtotal is correct
- [ ] Total row shows correct sums
- [ ] Stats cards show correct values
- [ ] +/- to par displays correctly
- [ ] Loading state shows during generation
- [ ] Responsive layout works on mobile

## Validation Commands
```bash
# TypeScript check
npx tsc --noEmit

# Lint
npm run lint

# Build (includes type checking)
npm run build

# Dev server for manual testing
npm run dev
```

## Success Criteria
- [ ] Form displays with course selector and handicap input
- [ ] Selecting a preset course auto-fills course data
- [ ] Clicking Generate produces a scorecard
- [ ] Scorecard shows all 18 holes with correct data
- [ ] Scores are color-coded correctly (eagle=green, bogey=orange, etc.)
- [ ] Stats cards show gross, net, and course handicap
- [ ] Front 9 (OUT), Back 9 (IN), and Total rows display correctly
- [ ] Responsive layout works on mobile and desktop
- [ ] No TypeScript errors
- [ ] Build passes
- [ ] Git committed: `feat: add score generation UI with form and scorecard`
- [ ] Git pushed

## Confidence Score
**8/10** - High confidence

**Rationale**:
- Scoring engine already complete and tested (62 tests passing)
- Color utility already exists (getScoreColor)
- Types already defined
- Clear reference implementations in Python code
- Glass button examples available
- Only unknowns are exact Tailwind classes for visual polish

**Risk Areas**:
- Glass button CSS complexity (mitigate by simplifying from examples)
- Mobile responsiveness for wide table (mitigate with horizontal scroll)
- Par 8 typo in source JSON (will fix in presets)

## Notes

### Data Correction
The `/old/golf_courses.json` has `par: 8` for hole 8 on both courses. This is clearly a typo - standard pars are 3, 4, or 5. The preset data will use par 4 for hole 8.

### No API Integration Yet
This phase runs entirely client-side. The scoring engine is imported directly:
```typescript
import { GhostGolfer } from '@/lib/scoring';
```
API integration comes in Phase 4 (Lambda functions).

### Accessibility Considerations
- Form labels properly associated with inputs
- Color is not the only indicator (numbers also shown)
- Focus states visible (ring-2 ring-cyan-500)
- Keyboard navigation works

### Component Reusability
GlassCard and GlassButton will be reused throughout the app for course management UI in future phases.
