# INITIAL: Project Foundation

## FEATURE:
Set up the Next.js 14 project with TypeScript, Tailwind CSS, and the full context engineering directory structure. This is the foundation that all other features will build upon.

## REQUIREMENTS:

### 1. Next.js Project Setup
- Initialize Next.js 14 with App Router
- Enable TypeScript strict mode
- Configure Tailwind CSS
- Set up path aliases (`@/` for `src/`)
- Configure for static export (for S3 deployment):
  ```javascript
  // next.config.js
  const nextConfig = {
    output: 'export',
    images: { unoptimized: true },  // Required for static export
  }
  ```

### 2. Directory Structure
Create the full project structure as defined in `docs/PLANNING.md`:
```
src/
├── app/
│   ├── page.tsx           # Home page (placeholder with glass styling)
│   ├── layout.tsx         # Root layout with dark theme
│   └── globals.css        # Global styles + Tailwind + CSS variables
├── components/            # React components (empty for now)
├── lib/
│   ├── scoring/          # Scoring algorithm (empty for now)
│   ├── utils/            # Utility functions
│   └── api/              # API client for Lambda endpoints (empty for now)
├── types/
│   └── index.ts          # TypeScript interfaces from Python app
└── hooks/                 # Custom React hooks (empty for now)

lambda/                    # Lambda functions (empty for now, future phase)
infra/                     # AWS infrastructure (empty for now, future phase)
scripts/                   # Build/deploy scripts (empty for now)
```

Note: No `app/api/` directory - all API endpoints will be AWS Lambda functions.

### 3. TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/*` → `src/*`)
- Include all necessary type definitions

### 4. Tailwind Configuration
Extend theme with colors from `/old/ui_theme.py`:
```javascript
colors: {
  'bg-primary': '#0f172a',
  'bg-secondary': '#1e293b',
  'bg-card': '#1e293b',
  'accent-blue': '#3b82f6',
  'accent-cyan': '#06b6d4',
  'accent-green': '#10b981',
  'text-primary': '#f8fafc',
  'text-secondary': '#cbd5e1',
  'text-muted': '#64748b',
  'border': '#334155',
  // Score colors
  'score-eagle': '#10b981',
  'score-birdie': '#22d3ee',
  'score-par': '#64748b',
  'score-bogey': '#f59e0b',
  'score-double': '#f97316',
  'score-triple': '#ef4444',
}
```

### 5. CSS Variables
Add to globals.css for easy theming:
```css
:root {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border: #334155;
}
```

### 6. Package.json Scripts
- `dev`: Development server
- `build`: Production build
- `start`: Start production server
- `lint`: ESLint check
- `test`: Jest test runner (configure for later)

### 7. TypeScript Interfaces
Create types from `/old/ghost_golfer.py` and `/old/golf_courses.json`:

```typescript
// Course data (from golf_courses.json structure)
export interface CourseData {
  tee_name: string;
  course_rating: number;
  slope_rating: number;
  par_values: number[];      // 18 values
  hole_handicaps: number[];  // 18 values (1-18)
  yardages: number[];        // 18 values
}

// Score generation input
export interface ScoreInput {
  handicapIndex: number;     // 0.0 to 54.0
  courseRating: number;      // typically 67-77
  slopeRating: number;       // 55-155, standard 113
  parValues: number[];       // 18 par values
  holeHandicaps: number[];   // 18 handicap rankings (1-18)
}

// Individual hole result (from ghost_golfer.py output)
export interface HoleScore {
  hole: number;              // 1-18
  par: number;               // 3, 4, or 5
  grossScore: number;        // Actual strokes taken
  strokesReceived: number;   // 0, 1, or 2
  netScore: number;          // grossScore - strokesReceived
}

// Complete round result
export interface GeneratedRound {
  id: string;
  scores: HoleScore[];
  courseHandicap: number;
  totalGross: number;
  totalNet: number;
  totalPar: number;
  createdAt: Date;
}

// For score coloring
export type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple';
```

## EXAMPLES:
Reference these folders:
- `/examples/` - Glass-button styling, color palette, font choices from jurigregg.com
- `/old/ui_theme.py` - Color scheme and score colors

## DOCUMENTATION:
- Next.js 14 App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

## OTHER CONSIDERATIONS:

### Must Include
- `.gitignore` for Next.js projects
- `README.md` with project description and setup instructions
- ESLint configuration (Next.js default + TypeScript)
- Prettier configuration for consistent formatting

### Initial Page Content
The home page should display:
- "Golf Ghost" title (styled like header in `/old/ui_components.py`)
- Subtitle: "AI-Powered Score Generation System"
- Robot emoji 🤖 like the Python app header
- Placeholder area for future score form
- Use glass-card styling from `/examples/`
- Dark theme background (#0f172a)

### Environment Setup
- Create `.env.example` with placeholder variables:
  ```
  # AWS (for future DynamoDB)
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=
  AWS_SECRET_ACCESS_KEY=
  
  # App
  NEXT_PUBLIC_APP_URL=https://ghost.jurigregg.com
  ```

### Quality Checks
- Must build without errors: `npm run build`
- Must pass lint: `npm run lint`
- TypeScript compilation must succeed
- No console errors in browser

## SUCCESS CRITERIA:
1. `npm run dev` starts the development server on localhost:3000
2. `npm run build` completes without errors
3. Home page displays with dark theme and correct colors
4. All directories exist as specified in PLANNING.md
5. TypeScript strict mode is working (errors on `any`)
6. Tailwind utilities with custom colors are available
7. Types are exported and importable from `@/types`
8. Git committed with message `feat: initialize Next.js project foundation`
9. Git pushed to remote repository
