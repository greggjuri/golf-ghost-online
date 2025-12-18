# INITIAL: Score Generation UI

## FEATURE:
Build the complete score generation UI that connects to the scoring engine. Users enter their handicap and course details, click generate, and see a color-coded scorecard with statistics. This brings the app to life visually.

## REQUIREMENTS:

### 1. Score Input Form
A form for entering the data needed to generate a round:

**Fields:**
- Handicap Index (number input, 0.0-54.0, step 0.1)
- Course Rating (number input, 60.0-80.0, step 0.1)  
- Slope Rating (number input, 55-155, integer)
- Course Par (calculated from par values, display only)

**For MVP, use preset course data:**
- Include Baytree National (Blue) and Baytree National (White) from `/old/golf_courses.json`
- Dropdown to select preset course (auto-fills rating, slope, pars, handicaps)
- OR manual entry mode for custom courses

**Generate Button:**
- Glass button styling (from foundation)
- Calls `GhostGolfer.generateRound()` on click
- Shows loading state briefly for UX feel

### 2. Scorecard Display
An 18-hole scorecard table showing the generated round:

**Columns:**
| Hole | Par | HCP | Strokes | Gross | Net |
|------|-----|-----|---------|-------|-----|
| 1    | 4   | 7   | 1       | 5     | 4   |
| ...  | ... | ... | ...     | ...   | ... |

**Features:**
- Color-coded gross scores based on relation to par (from `src/lib/utils/colors.ts`)
- Front 9 subtotal row (OUT)
- Back 9 subtotal row (IN)
- Total row with gross and net totals
- Responsive: scrollable on mobile, full table on desktop

**Score Colors (from ui_theme.py):**
```
Eagle (-2 or better): #10b981 (green)
Birdie (-1): #22d3ee (cyan)
Par (0): #64748b (gray)
Bogey (+1): #f59e0b (orange)
Double (+2): #f97316 (deep orange)
Triple+ (+3 or more): #ef4444 (red)
```

### 3. Stats Cards
Three stat cards displayed above the scorecard:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ GROSS SCORE │  │  NET SCORE  │  │ COURSE HCP  │
│    87       │  │     72      │  │     15      │
│   (+15)     │  │    (E)      │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

- Glass card styling
- Large number display
- Relative to par shown in parentheses
- Color accent based on score (gross uses score colors, net uses score colors)

### 4. Component Structure

```
src/components/
├── ScoreForm.tsx        # Input form with course selector
├── CourseSelector.tsx   # Dropdown for preset courses
├── ScoreCard.tsx        # 18-hole scorecard table
├── StatsCards.tsx       # Three stat display cards
├── HoleRow.tsx          # Single row in scorecard (reusable)
└── GlassCard.tsx        # Reusable glass card wrapper
```

### 5. State Management
Use React hooks for local state:

```typescript
// In page.tsx or a custom hook
const [config, setConfig] = useState<GhostGolferConfig | null>(null);
const [round, setRound] = useState<GeneratedRound | null>(null);
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = () => {
  if (!config) return;
  setIsGenerating(true);
  // Small delay for UX
  setTimeout(() => {
    const golfer = new GhostGolfer(config);
    setRound(golfer.generateRound());
    setIsGenerating(false);
  }, 300);
};
```

### 6. Preset Course Data
Include the Baytree courses from `/old/golf_courses.json`:

```typescript
// src/lib/courses/presets.ts
export const PRESET_COURSES = {
  'baytree-blue': {
    name: 'Baytree National Golf Links (Blue)',
    tee_name: 'Blue',
    course_rating: 69.7,
    slope_rating: 126,
    par_values: [4,3,4,3,5,4,4,4,4,4,4,3,5,4,4,5,3,4],
    hole_handicaps: [3,17,15,7,9,11,1,13,5,4,14,18,8,12,6,10,16,2],
    yardages: [349,154,308,177,488,313,365,471,352,354,313,142,520,320,374,478,148,338],
  },
  'baytree-white': {
    name: 'Baytree National Golf Links (White)',
    // ... similar structure
  }
};
```

### 7. Responsive Design
- Mobile-first approach
- Scorecard scrolls horizontally on small screens
- Stats cards stack vertically on mobile, horizontal on desktop
- Form fields stack on mobile

## EXAMPLES:

### Reference Files
- `/old/generate_tab.py` - Python UI structure for the generate tab
- `/old/ui_theme.py` - Color scheme and `get_score_color()` function
- `/old/ui_components.py` - `create_stat_card()` function
- `/old/golf_courses.json` - Preset course data structure
- `src/lib/utils/colors.ts` - Already has `getScoreColor()` function
- `src/lib/scoring/` - The scoring engine to connect to

### Python UI Reference (from generate_tab.py)
```python
# Stats cards showing gross, net, course handicap
create_stat_card(container, 'GROSS SCORE', f"{total_gross} ({total_gross - total_par:+d})", ...)
create_stat_card(container, 'NET SCORE', f"{total_net} ({total_net - total_par:+d})", ...)
create_stat_card(container, 'COURSE HCP', ghost.course_handicap, ...)

# Scorecard columns
headers = ['HOLE', 'YDS', 'PAR', 'HCP', 'STR', 'GROSS', 'NET']

# Color coding
score_color = self.theme.get_score_color(gross, par)
```

## DOCUMENTATION:
- React useState: https://react.dev/reference/react/useState
- Tailwind CSS: https://tailwindcss.com/docs
- Next.js Client Components: https://nextjs.org/docs/app/building-your-application/rendering/client-components

## OTHER CONSIDERATIONS:

### Client Component
The form and scorecard need interactivity, so use `'use client'` directive at the top of components that have state or event handlers.

### No API Calls Yet
For this phase, everything runs client-side. The scoring engine is imported directly:
```typescript
import { GhostGolfer } from '@/lib/scoring';
```
API integration comes in Phase 4.

### Accessibility
- Form labels properly associated with inputs
- Color is not the only indicator (also show +/- numbers)
- Keyboard navigation works
- Focus states visible

### Loading State
Show a brief loading spinner or skeleton when generating. Even though generation is instant, a small delay (200-300ms) makes it feel more substantial.

### Error Handling
- Validate form inputs before generating
- Show error messages for invalid inputs
- Use Zod validation from scoring engine

### Initial State
When page loads:
- Form shows with Baytree Blue pre-selected
- Handicap index defaults to 15.0
- No scorecard shown until Generate is clicked

## FILE DELIVERABLES:

```
src/
├── app/
│   └── page.tsx                    # Updated with full UI
├── components/
│   ├── ScoreForm.tsx              # Form with inputs and generate button
│   ├── CourseSelector.tsx         # Preset course dropdown
│   ├── ScoreCard.tsx              # Full 18-hole scorecard
│   ├── StatsCards.tsx             # Three stat cards row
│   ├── HoleRow.tsx                # Single scorecard row
│   └── GlassCard.tsx              # Reusable glass container
├── lib/
│   └── courses/
│       └── presets.ts             # Baytree course data
└── hooks/
    └── useScoreGeneration.ts      # Optional: encapsulate generation logic
```

## SUCCESS CRITERIA:
1. Form displays with course selector and handicap input
2. Selecting a preset course auto-fills course data
3. Clicking Generate produces a scorecard
4. Scorecard shows all 18 holes with correct data
5. Scores are color-coded correctly (eagle=green, bogey=orange, etc.)
6. Stats cards show gross, net, and course handicap
7. Front 9 (OUT), Back 9 (IN), and Total rows display correctly
8. Responsive layout works on mobile and desktop
9. No TypeScript errors
10. Build passes
11. Git committed: `feat: add score generation UI with form and scorecard`
12. Git pushed
