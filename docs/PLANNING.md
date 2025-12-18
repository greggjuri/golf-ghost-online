# Golf Ghost Online - Architecture Planning

## Project Summary
Convert the local Python Golf Ghost app (`/old` folder) into a web application at ghost.jurigregg.com. The app generates realistic golf scores based on a player's GHIN handicap index using statistical modeling that matches real-world handicap performance.

## Original App Analysis
The Python app (`/old`) consists of:
- `ghost_golfer.py` - Core scoring algorithm (PORT THIS EXACTLY)
- `course_manager.py` - Course data CRUD operations
- `ui_theme.py` - Dark analytics theme colors
- `golf_courses.json` - Sample course data structure
- `main.py`, `generate_tab.py`, `manage_tab.py` - Tkinter UI (reference for features)

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router) with static export
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Design System**: Glass-morphism from jurigregg.com (`/examples/`)

### Backend
- **API**: AWS API Gateway + Lambda functions
- **Database**: AWS DynamoDB (existing infrastructure)
- **Validation**: Zod schemas

### Infrastructure (Existing AWS Setup)
- **Static Hosting**: S3 bucket + CloudFront CDN
- **API**: API Gateway → Lambda
- **Database**: DynamoDB (already exists from other project)
- **Domain**: ghost.jurigregg.com (subdomain of jurigregg.com on EC2)
- **SSL**: AWS Certificate Manager via CloudFront

### Deployment Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     ghost.jurigregg.com                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐      ┌──────────────┐                    │
│   │  CloudFront  │──────│  S3 Bucket   │                    │
│   │    (CDN)     │      │ (static app) │                    │
│   └──────┬───────┘      └──────────────┘                    │
│          │                                                   │
│          │ /api/*                                            │
│          ▼                                                   │
│   ┌──────────────┐      ┌──────────────┐                    │
│   │ API Gateway  │──────│   Lambda     │                    │
│   │              │      │  Functions   │                    │
│   └──────────────┘      └──────┬───────┘                    │
│                                │                             │
│                                ▼                             │
│                         ┌──────────────┐                    │
│                         │  DynamoDB    │                    │
│                         │  (courses)   │                    │
│                         └──────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Score Generation Engine (Priority: CRITICAL)
Direct port of `/old/ghost_golfer.py`. Must produce identical results.

**Inputs** (from Python `__init__`):
- `handicap_index`: float (0.0 to 54.0) - Player's GHIN index
- `course_rating`: float (typically 67-77) - Course difficulty rating
- `slope_rating`: int (55-155, standard 113) - Course slope
- `par_values`: int[18] - Par for each hole
- `hole_handicaps`: int[18] - Difficulty ranking 1-18 (1=hardest)

**Algorithm** (from Python `generate_round`):

```typescript
// Step 1: Calculate Course Handicap
courseHandicap = Math.round((handicapIndex * slopeRating) / 113);

// Step 2: Round-level variance (Gaussian)
roundAdjustment = gaussianRandom(0, 1.2);

// Step 3: For each hole
for (let i = 0; i < 18; i++) {
  const par = parValues[i];
  const holeHcp = holeHandicaps[i];
  
  // Stroke allocation
  let strokesReceived = holeHcp <= courseHandicap ? 1 : 0;
  if (courseHandicap > 18 && holeHcp <= (courseHandicap - 18)) {
    strokesReceived = 2;
  }
  
  // Base expected score
  const baseScore = par + (courseHandicap / 18);
  
  // Per-hole randomness (Gaussian)
  const holeRandomness = gaussianRandom(0, 1.1);
  
  // Difficulty adjustment
  let difficultyFactor = 0;
  if (holeHcp <= 6) difficultyFactor = 0.3;      // Hard holes
  else if (holeHcp >= 13) difficultyFactor = -0.2; // Easy holes
  
  // Calculate raw score
  const rawScore = baseScore + (roundAdjustment / 18) + holeRandomness + difficultyFactor;
  
  // Clamp to realistic range (eagle to triple bogey+)
  const grossScore = Math.max(par - 1, Math.min(par + 6, Math.round(rawScore)));
  const netScore = grossScore - strokesReceived;
}
```

**Outputs**:
- Per-hole: gross score, net score, strokes received
- Round totals: gross total, net total, course handicap

### 2. User Interface
Matching jurigregg.com aesthetic with features from original app:

**Generate Tab** (from `generate_tab.py`):
- Course selector dropdown
- GHIN handicap input
- Course info display (rating, slope, par, yards)
- Generate button
- Stats cards (gross score, net score, course handicap)
- Scorecard table with color-coded scores

**Score Colors** (from `ui_theme.py`):
- Eagle or better: #10b981 (green)
- Birdie: #22d3ee (cyan)
- Par: #64748b (gray)
- Bogey: #f59e0b (orange)
- Double bogey: #f97316 (deep orange)
- Triple+: #ef4444 (red)

### 3. Course Management
Port of `course_manager.py` and `manage_tab.py`:
- List saved courses
- Add new course with full hole data
- Edit existing courses
- Delete courses
- Validation for 18-hole data

## Data Models

### CourseData (from `golf_courses.json`)
```typescript
interface CourseData {
  tee_name: string;           // "Blue", "White", "Red"
  course_rating: number;      // e.g., 69.7
  slope_rating: number;       // e.g., 126
  par_values: number[];       // 18 integers, e.g., [4, 3, 4, 3, 5, 4, 4, 4, 4, ...]
  hole_handicaps: number[];   // 18 integers (1-18), e.g., [3, 17, 15, 7, 9, ...]
  yardages: number[];         // 18 integers, e.g., [349, 154, 308, ...]
}
```

### ScoreInput
```typescript
interface ScoreInput {
  handicapIndex: number;      // 0.0 to 54.0
  courseRating: number;       // typically 67-77
  slopeRating: number;        // 55-155, standard 113
  parValues: number[];        // 18 par values
  holeHandicaps: number[];    // 18 handicap rankings (1-18)
}
```

### HoleScore
```typescript
interface HoleScore {
  hole: number;               // 1-18
  par: number;                // 3, 4, or 5
  grossScore: number;         // Actual strokes
  strokesReceived: number;    // 0, 1, or 2
  netScore: number;           // grossScore - strokesReceived
}
```

### GeneratedRound
```typescript
interface GeneratedRound {
  id: string;
  scores: HoleScore[];
  courseHandicap: number;
  totalGross: number;
  totalNet: number;
  totalPar: number;
  createdAt: Date;
}
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate` | POST | Generate a ghost round |
| `/api/courses` | GET | List all courses |
| `/api/courses` | POST | Add a new course |
| `/api/courses/[id]` | GET | Get course by ID |
| `/api/courses/[id]` | PUT | Update course |
| `/api/courses/[id]` | DELETE | Delete course |

## Styling Requirements

### From `/examples/` (jurigregg.com)
- Glass-morphism effect on buttons and cards
- Color palette and gradients
- Font choices
- Background styling

### From `/old/ui_theme.py`
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

## Directory Structure
```
golf-ghost-online/
├── src/                            # Next.js frontend
│   ├── app/
│   │   ├── page.tsx               # Home page with generator
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles + Tailwind
│   ├── components/
│   │   ├── ScoreForm.tsx          # Handicap/course input
│   │   ├── ScoreCard.tsx          # Display generated scores
│   │   ├── CourseSelector.tsx     # Course dropdown
│   │   ├── StatsCard.tsx          # Gross/net/handicap display
│   │   ├── GlassButton.tsx        # Reusable glass button
│   │   └── GlassCard.tsx          # Reusable glass card
│   ├── lib/
│   │   ├── scoring/               # Scoring algorithm (shared with Lambda)
│   │   │   ├── handicap.ts
│   │   │   ├── distribution.ts
│   │   │   ├── generator.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── colors.ts
│   │   └── api/
│   │       └── client.ts          # API client for Lambda endpoints
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       └── useScoreGeneration.ts
├── lambda/                         # AWS Lambda functions
│   ├── generate-score/
│   │   └── index.ts               # Score generation handler
│   ├── get-courses/
│   │   └── index.ts               # List courses handler
│   ├── create-course/
│   │   └── index.ts               # Create course handler
│   ├── delete-course/
│   │   └── index.ts               # Delete course handler
│   └── shared/                    # Shared Lambda code
│       ├── scoring/               # Symlink or copy of src/lib/scoring
│       └── db.ts                  # DynamoDB operations
├── infra/                          # AWS Infrastructure
│   ├── template.yaml              # SAM template (or CDK)
│   └── deploy.sh                  # Deployment script
├── scripts/
│   ├── build.sh                   # Build static site
│   ├── deploy-site.sh             # Deploy to S3
│   └── deploy-lambda.sh           # Deploy Lambda functions
├── docs/
│   ├── PLANNING.md
│   ├── TASK.md
│   └── DECISIONS.md
├── INITIAL/
├── PRPs/
├── examples/                       # jurigregg.com styling
├── old/                            # Original Python app
├── CLAUDE.md
├── HANDOFF.md
└── next.config.js                  # Configure static export
```

## Implementation Phases

### Phase 1: Foundation
- [x] Context engineering setup (CLAUDE.md, docs/, INITIAL/, PRPs/)
- [ ] Next.js 14 project initialization
- [ ] TypeScript strict mode configuration
- [ ] Tailwind CSS with custom theme
- [ ] Basic layout with glass styling
- [ ] Configure for static export (`output: 'export'`)

### Phase 2: Scoring Engine
- [ ] Port `ghost_golfer.py` to TypeScript
- [ ] Gaussian random number generator
- [ ] Course handicap calculation
- [ ] Score generation with proper distribution
- [ ] Comprehensive unit tests
- [ ] Validate against Python implementation

### Phase 3: UI Components
- [ ] GlassButton and GlassCard components
- [ ] ScoreForm with course/handicap inputs
- [ ] ScoreCard with color-coded holes
- [ ] StatsCard for totals display
- [ ] Mobile responsive layout

### Phase 4: Lambda Functions
- [ ] `generate-score` Lambda - score generation endpoint
- [ ] `get-courses` Lambda - list courses
- [ ] `create-course` Lambda - add new course
- [ ] `delete-course` Lambda - remove course
- [ ] Shared layer for scoring logic

### Phase 5: AWS Infrastructure
- [ ] S3 bucket for static site hosting
- [ ] CloudFront distribution with SSL
- [ ] API Gateway configuration
- [ ] Lambda function deployments
- [ ] DynamoDB table for courses (or use existing)
- [ ] Route53 subdomain setup (ghost.jurigregg.com)

### Phase 6: Deployment & CI/CD
- [ ] Build script for static export
- [ ] S3 sync deployment script
- [ ] Lambda deployment (SAM or CDK)
- [ ] GitHub Actions for auto-deploy
- [ ] Verify live site works correctly

## Testing Strategy

### Unit Tests (CRITICAL for scoring)
- Course handicap calculation matches Python
- Stroke allocation logic
- Score bounds (par-1 to par+6)
- Gaussian distribution properties
- Net score calculation

### Integration Tests
- API endpoint responses
- Course CRUD operations
- End-to-end score generation

### Manual Testing
- Visual comparison with Python app
- Score distribution feels realistic
- Mobile responsiveness

## Open Questions
- [x] ~~What data persistence is needed?~~ → DynamoDB for courses
- [ ] User accounts needed? Or anonymous usage?
- [ ] Should we pre-load popular courses?
- [ ] Save generated rounds history?
