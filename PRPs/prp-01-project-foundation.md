# PRP: Project Foundation

## Overview
Set up the Next.js 14 project with TypeScript, Tailwind CSS, and the full context engineering directory structure. This is the foundation that all other features will build upon.

## Context Files Read
- [x] CLAUDE.md - Project rules and conventions
- [x] docs/PLANNING.md - Architecture overview and deployment diagram
- [x] docs/DECISIONS.md - Past architectural decisions
- [x] docs/TASK.md - Current task status
- [x] /examples/glassbutton/button.css - Glass button styling patterns
- [x] /examples/jurigregg/main.css - Main site styling with glass buttons adapted for dark theme
- [x] /old/ui_theme.py - Color scheme and score colors
- [x] /old/ui_components.py - Header structure with robot emoji and title styling

## Requirements
From INITIAL/01-project-foundation.md:

1. **Next.js 14 Setup** - App Router, TypeScript strict, Tailwind, static export
2. **Directory Structure** - Full project structure per PLANNING.md
3. **TypeScript Configuration** - Strict mode, path aliases
4. **Tailwind Configuration** - Custom colors from ui_theme.py
5. **CSS Variables** - Theme variables in globals.css
6. **Package Scripts** - dev, build, start, lint, test
7. **TypeScript Interfaces** - CourseData, ScoreInput, HoleScore, GeneratedRound, ScoreType
8. **Initial Page Content** - "Golf Ghost" title with robot emoji and glass styling
9. **Environment Setup** - .env.example with AWS placeholders
10. **Quality Checks** - Build and lint must pass

## Technical Approach

### Project Initialization
Use `npx create-next-app@14` with TypeScript, Tailwind, ESLint, App Router options. Then customize configuration for static export and strict TypeScript.

### Styling Strategy
- Tailwind CSS extended with custom colors from `/old/ui_theme.py`
- CSS variables for theming in globals.css
- Glass-morphism effects adapted from `/examples/` for dark theme
- Dark background (#0f172a) as base

### Directory Structure
Create all placeholder directories and files per PLANNING.md, with empty index files where appropriate to maintain structure.

## Implementation Steps

### Step 1: Initialize Next.js Project
**Files**:
- `package.json` (created by create-next-app)
- `next.config.js` (modify for static export)
- `tsconfig.json` (verify strict mode)

**Actions**:
1. Run `npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (use current directory)
2. Modify `next.config.js` to add:
   ```javascript
   const nextConfig = {
     output: 'export',
     images: { unoptimized: true },
   }
   ```
3. Verify `tsconfig.json` has `"strict": true`
4. Add path alias verification in tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

**Validation**: Run `npm run build` - should complete without errors

### Step 2: Configure Tailwind with Custom Colors
**Files**: `tailwind.config.ts`

**Actions**:
1. Replace default tailwind.config.ts with extended theme:
   ```typescript
   import type { Config } from 'tailwindcss'

   const config: Config = {
     content: [
       './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
       './src/components/**/*.{js,ts,jsx,tsx,mdx}',
       './src/app/**/*.{js,ts,jsx,tsx,mdx}',
     ],
     theme: {
       extend: {
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
           'score-eagle': '#10b981',
           'score-birdie': '#22d3ee',
           'score-par': '#64748b',
           'score-bogey': '#f59e0b',
           'score-double': '#f97316',
           'score-triple': '#ef4444',
         },
       },
     },
     plugins: [],
   }
   export default config
   ```

**Validation**: Tailwind classes with custom colors compile

### Step 3: Set Up Global Styles with CSS Variables
**Files**: `src/app/globals.css`

**Actions**:
1. Replace default globals.css with:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

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

     /* Animation timing (from examples) */
     --anim-hover-time: 400ms;
     --anim-hover-ease: cubic-bezier(0.25, 1, 0.5, 1);
   }

   html,
   body {
     min-height: 100vh;
   }

   body {
     background-color: var(--bg-primary);
     color: var(--text-primary);
     font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }
   ```

**Validation**: Page renders with dark background

### Step 4: Create Root Layout
**Files**: `src/app/layout.tsx`

**Actions**:
1. Update layout.tsx with proper metadata and font setup:
   ```typescript
   import type { Metadata } from 'next'
   import { Inter } from 'next/font/google'
   import './globals.css'

   const inter = Inter({ subsets: ['latin'] })

   export const metadata: Metadata = {
     title: 'Golf Ghost - AI-Powered Score Generation',
     description: 'Generate realistic golf scores based on GHIN handicap index using statistical modeling',
   }

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode
   }) {
     return (
       <html lang="en">
         <body className={inter.className}>{children}</body>
       </html>
     )
   }
   ```

**Validation**: Metadata appears in page head

### Step 5: Create Directory Structure
**Files**: Multiple directories and placeholder files

**Actions**:
1. Create directories:
   ```bash
   mkdir -p src/components
   mkdir -p src/lib/scoring
   mkdir -p src/lib/utils
   mkdir -p src/lib/api
   mkdir -p src/types
   mkdir -p src/hooks
   mkdir -p lambda
   mkdir -p infra
   mkdir -p scripts
   ```
2. Create placeholder/empty files where needed for structure

**Validation**: All directories exist as specified

### Step 6: Create TypeScript Types
**Files**: `src/types/index.ts`

**Actions**:
1. Create comprehensive type definitions:
   ```typescript
   // Course data structure (from /old/golf_courses.json)
   export interface CourseData {
     tee_name: string;           // "Blue", "White", etc.
     course_rating: number;      // e.g., 69.7
     slope_rating: number;       // e.g., 126
     par_values: number[];       // 18 values
     hole_handicaps: number[];   // 18 values (1-18)
     yardages: number[];         // 18 values
   }

   // Score generation input
   export interface ScoreInput {
     handicapIndex: number;      // 0.0 to 54.0
     courseRating: number;       // typically 67-77
     slopeRating: number;        // 55-155, standard 113
     parValues: number[];        // 18 par values
     holeHandicaps: number[];    // 18 handicap rankings (1-18)
   }

   // Individual hole result
   export interface HoleScore {
     hole: number;               // 1-18
     par: number;                // 3, 4, or 5
     grossScore: number;         // Actual strokes taken
     strokesReceived: number;    // 0, 1, or 2
     netScore: number;           // grossScore - strokesReceived
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

   // Score type for coloring
   export type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double' | 'triple';

   // Utility type for getting score type from score vs par
   export function getScoreType(gross: number, par: number): ScoreType {
     const diff = gross - par;
     if (diff <= -2) return 'eagle';
     if (diff === -1) return 'birdie';
     if (diff === 0) return 'par';
     if (diff === 1) return 'bogey';
     if (diff === 2) return 'double';
     return 'triple';
   }
   ```

**Validation**: Types can be imported with `@/types`

### Step 7: Create Utility Functions
**Files**: `src/lib/utils/colors.ts`

**Actions**:
1. Create color utility based on ui_theme.py:
   ```typescript
   import { ScoreType } from '@/types';

   export const scoreColors: Record<ScoreType, string> = {
     eagle: '#10b981',
     birdie: '#22d3ee',
     par: '#64748b',
     bogey: '#f59e0b',
     double: '#f97316',
     triple: '#ef4444',
   };

   export function getScoreColor(gross: number, par: number): string {
     const diff = gross - par;
     if (diff <= -2) return scoreColors.eagle;
     if (diff === -1) return scoreColors.birdie;
     if (diff === 0) return scoreColors.par;
     if (diff === 1) return scoreColors.bogey;
     if (diff === 2) return scoreColors.double;
     return scoreColors.triple;
   }
   ```

**Validation**: Function returns correct color codes

### Step 8: Create Home Page with Glass Styling
**Files**: `src/app/page.tsx`

**Actions**:
1. Create home page matching Python app header:
   ```typescript
   export default function Home() {
     return (
       <main className="min-h-screen flex flex-col items-center justify-center p-8">
         {/* Header */}
         <div className="text-center mb-12">
           <div className="flex items-center justify-center gap-4 mb-4">
             <span className="text-5xl" role="img" aria-label="robot">
               🤖
             </span>
             <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
               GOLF GHOST
             </h1>
           </div>
           <p className="text-text-secondary text-lg">
             AI-Powered Score Generation System
           </p>
         </div>

         {/* Glass Card Placeholder */}
         <div className="w-full max-w-md p-8 rounded-2xl bg-bg-card/50 backdrop-blur-sm border border-border/50 shadow-xl">
           <div className="text-center">
             <p className="text-text-muted mb-6">
               Score generation form coming soon...
             </p>

             {/* Placeholder Glass Button */}
             <button className="
               relative px-8 py-4 rounded-full
               bg-gradient-to-br from-white/10 via-white/5 to-transparent
               border border-white/20
               text-text-primary font-medium
               backdrop-blur-sm
               shadow-lg shadow-black/20
               hover:scale-[0.98] hover:shadow-md
               transition-all duration-300 ease-out
               cursor-pointer
             ">
               Generate Ghost Round
             </button>
           </div>
         </div>

         {/* Footer */}
         <footer className="mt-16 text-text-muted text-sm">
           <p>ghost.jurigregg.com</p>
         </footer>
       </main>
     );
   }
   ```

**Validation**: Page displays with correct colors, robot emoji, and glass styling

### Step 9: Set Up Environment and Configuration Files
**Files**: `.env.example`, `.prettierrc`, update `.gitignore`

**Actions**:
1. Create `.env.example`:
   ```
   # AWS (for future DynamoDB)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=

   # App
   NEXT_PUBLIC_APP_URL=https://ghost.jurigregg.com
   ```

2. Create `.prettierrc`:
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100
   }
   ```

3. Verify `.gitignore` includes:
   ```
   # dependencies
   /node_modules

   # next.js
   /.next/
   /out/

   # production
   /build

   # misc
   .DS_Store
   *.pem

   # env files
   .env*.local
   .env

   # vercel
   .vercel

   # typescript
   *.tsbuildinfo
   next-env.d.ts
   ```

**Validation**: Files exist and are properly formatted

### Step 10: Final Quality Checks and Git Commit
**Files**: None (verification only)

**Actions**:
1. Run `npm run lint` - fix any errors
2. Run `npm run build` - verify no errors
3. Run `npm run dev` - verify page loads at localhost:3000
4. Verify:
   - Dark theme background (#0f172a)
   - Robot emoji and title display
   - Glass card styling visible
   - No console errors
5. Git commit:
   ```bash
   git add .
   git commit -m "feat: initialize Next.js project foundation

   - Next.js 14 with App Router and TypeScript strict mode
   - Tailwind CSS with custom Golf Ghost color scheme
   - Project structure for frontend, lambda, and infra
   - TypeScript interfaces for courses and scoring
   - Home page with glass-morphism styling
   - Configured for static export (S3 deployment)"
   ```
6. Git push: `git push`

**Validation**:
- Build completes successfully
- Dev server starts on localhost:3000
- Page displays correctly
- Git history shows new commit

## Testing Requirements
- [ ] `npm run dev` starts development server on localhost:3000
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes with no errors
- [ ] Home page displays dark theme background (#0f172a)
- [ ] Robot emoji (🤖) and "GOLF GHOST" title visible
- [ ] Subtitle "AI-Powered Score Generation System" visible
- [ ] Glass card with placeholder button visible
- [ ] No TypeScript compilation errors
- [ ] Types importable via `@/types`
- [ ] All directories exist per PLANNING.md

## Validation Commands
```bash
# Install dependencies (if fresh clone)
npm install

# Verify lint passes
npm run lint

# Verify build completes
npm run build

# Start dev server and manually verify UI
npm run dev

# Verify TypeScript types
npx tsc --noEmit

# Check directory structure exists
ls -la src/components src/lib/scoring src/lib/utils src/lib/api src/types src/hooks

# Git status should be clean after commit
git status
```

## Success Criteria
- [x] `npm run dev` starts the development server on localhost:3000
- [x] `npm run build` completes without errors
- [x] Home page displays with dark theme and correct colors
- [x] All directories exist as specified in PLANNING.md
- [x] TypeScript strict mode is working (errors on `any`)
- [x] Tailwind utilities with custom colors are available
- [x] Types are exported and importable from `@/types`
- [x] Git committed with message `feat: initialize Next.js project foundation`
- [x] Git pushed to remote repository

## Confidence Score
**9/10** - High confidence

**Rationale**:
- Next.js 14 project setup is straightforward with create-next-app
- All color values and styling patterns are clearly documented in /old and /examples
- TypeScript interfaces are directly specified in INITIAL file
- Directory structure is well-defined in PLANNING.md
- Only minor uncertainty: exact glass button CSS translation to Tailwind (simplified version provided)

## Notes

### Glass Button Simplification
The full glass button from `/examples/glassbutton/button.css` is extremely complex with CSS `@property` animations. For the foundation, I've included a simplified Tailwind-based glass button. The full implementation should be done in a separate `02-glass-components` PRP with proper CSS module extraction.

### Font Consideration
Using Next.js built-in Google Font optimization for Inter. This matches the font used in `/examples/jurigregg/main.css`.

### Static Export Implications
With `output: 'export'`, there are no API routes in `/app/api/`. This is intentional per PLANNING.md - all API endpoints will be AWS Lambda functions.

### Scoring Logic Placeholder
The `src/lib/scoring/` directory is created empty. The actual scoring algorithm port is in `07-score-generator` PRP per TASK.md phases.

### No .env File Created
Only `.env.example` is created with placeholders. The actual `.env` file with real credentials should never be committed and is in `.gitignore`.
