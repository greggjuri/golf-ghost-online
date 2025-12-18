# INITIAL: Scoring Engine

## FEATURE:
Port the complete scoring algorithm from `/old/ghost_golfer.py` to TypeScript. This is the core functionality of the app - generating realistic golf scores based on handicap index using Gaussian distributions and USGA-style calculations.

## REQUIREMENTS:

### 1. Gaussian Random Number Generator
Implement Box-Muller transform for generating Gaussian (normal) distributed random numbers. Python uses `random.gauss(mean, std)` - we need an equivalent.

```typescript
// Must produce same statistical distribution as Python's random.gauss
function gaussianRandom(mean: number, stdDev: number): number
```

### 2. Course Handicap Calculation
Port the exact formula from `ghost_golfer.py`:

```typescript
// Formula: round((handicapIndex * slopeRating) / 113)
function calculateCourseHandicap(handicapIndex: number, slopeRating: number): number
```

### 3. Stroke Allocation Logic
Determine strokes received per hole based on course handicap and hole difficulty:

```typescript
// From ghost_golfer.py:
// - If courseHandicap >= holeHandicap: 1 stroke
// - If courseHandicap > 18 AND holeHandicap <= (courseHandicap - 18): 2 strokes
// - Otherwise: 0 strokes
function calculateStrokesReceived(courseHandicap: number, holeHandicap: number): number
```

### 4. Score Generation (Main Algorithm)
Port the `generate_round()` method exactly:

```typescript
interface GhostGolferConfig {
  handicapIndex: number;      // 0.0 to 54.0
  courseRating: number;       // typically 67-77
  slopeRating: number;        // 55-155, standard 113
  parValues: number[];        // 18 par values
  holeHandicaps: number[];    // 18 values, 1-18 (1 = hardest)
}

function generateRound(config: GhostGolferConfig): HoleScore[]
```

**Algorithm Details (from Python):**
```python
# Round-level variance
round_adjustment = random.gauss(0, 1.2)

# Per-hole calculation
for each hole:
    base_score = par + (course_handicap / 18)
    hole_randomness = random.gauss(0, 1.1)
    
    # Difficulty factor based on hole handicap
    if hole_hcp <= 6:      difficulty_factor = 0.3   # Hard holes
    elif hole_hcp >= 13:   difficulty_factor = -0.2  # Easy holes
    else:                  difficulty_factor = 0     # Medium holes
    
    raw_score = base_score + (round_adjustment / 18) + hole_randomness + difficulty_factor
    gross_score = clamp(round(raw_score), par - 1, par + 6)  # Eagle to triple+
    net_score = gross_score - strokes_received
```

### 5. GhostGolfer Class
Create a class that encapsulates the algorithm (matching Python structure):

```typescript
class GhostGolfer {
  readonly courseHandicap: number;
  
  constructor(config: GhostGolferConfig);
  generateRound(): GeneratedRound;
}
```

### 6. Unit Tests (CRITICAL)
Test all components thoroughly:

**Gaussian Distribution Tests:**
- Mean of 10,000 samples should be close to specified mean (within 0.1)
- Standard deviation should be close to specified stdDev (within 0.1)

**Course Handicap Tests:**
- `(15.0, 113)` → 15 (standard slope)
- `(15.0, 130)` → 17 (higher slope)
- `(15.0, 96)` → 13 (lower slope)
- `(0.0, 113)` → 0 (scratch golfer)
- `(36.0, 113)` → 36 (high handicap)

**Stroke Allocation Tests:**
- Course handicap 10, hole handicap 5 → 1 stroke
- Course handicap 10, hole handicap 15 → 0 strokes
- Course handicap 20, hole handicap 2 → 2 strokes (20-18=2, hole 2 ≤ 2)
- Course handicap 20, hole handicap 5 → 1 stroke
- Course handicap 36, hole handicap 18 → 2 strokes

**Score Generation Tests:**
- All scores between par-1 and par+6
- 18 holes generated
- Net score = gross score - strokes received
- Total gross is sum of all gross scores
- Total net is sum of all net scores

**Statistical Validation:**
- Generate 1000 rounds with handicap 15
- Average gross should be approximately par + 15 (±3)
- Distribution should look reasonable (not all same score)

### 7. Input Validation
Validate inputs match expected ranges:
- `handicapIndex`: 0.0 to 54.0
- `slopeRating`: 55 to 155
- `courseRating`: 60.0 to 80.0
- `parValues`: array of exactly 18 numbers, each 3-5
- `holeHandicaps`: array of exactly 18 numbers, each 1-18, all unique

## FILE STRUCTURE:

```
src/lib/scoring/
├── index.ts           # Barrel export
├── gaussian.ts        # Gaussian random number generator
├── handicap.ts        # Course handicap & stroke allocation
├── generator.ts       # GhostGolfer class & generateRound
└── validation.ts      # Input validation with Zod schemas

src/lib/scoring/__tests__/
├── gaussian.test.ts
├── handicap.test.ts
├── generator.test.ts
└── validation.test.ts
```

## EXAMPLES:
Reference `/old/ghost_golfer.py` for the exact algorithm. The TypeScript implementation must produce statistically equivalent results.

Key Python code to port:
```python
class GhostGolfer:
    def __init__(self, handicap_index, course_rating, slope_rating, par_values, hole_handicaps):
        self.handicap_index = handicap_index
        self.course_rating = course_rating
        self.slope_rating = slope_rating
        self.par_values = par_values
        self.hole_handicaps = hole_handicaps
        self.course_handicap = round((handicap_index * slope_rating) / 113)
        
    def generate_round(self):
        scores = []
        expected_strokes_over = self.course_handicap
        strokes_per_hole = expected_strokes_over / 18.0
        round_adjustment = random.gauss(0, 1.2)
        
        for i, (par, hole_hcp) in enumerate(zip(self.par_values, self.hole_handicaps)):
            strokes_received = 1 if hole_hcp <= self.course_handicap else 0
            if self.course_handicap > 18:
                extra_strokes = self.course_handicap - 18
                if hole_hcp <= extra_strokes:
                    strokes_received = 2
            
            base_score = par + strokes_per_hole
            hole_randomness = random.gauss(0, 1.1)
            
            if hole_hcp <= 6:
                difficulty_factor = 0.3
            elif hole_hcp >= 13:
                difficulty_factor = -0.2
            else:
                difficulty_factor = 0
            
            raw_score = base_score + (round_adjustment / 18.0) + hole_randomness + difficulty_factor
            raw_score = max(par - 1, min(par + 6, round(raw_score)))
            net_score = raw_score - strokes_received
            
            scores.append({
                'hole': i + 1,
                'par': par,
                'gross_score': int(raw_score),
                'strokes_received': strokes_received,
                'net_score': int(net_score)
            })
        
        return scores
```

## DOCUMENTATION:
- Box-Muller transform: https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
- USGA Handicap System: https://www.usga.org/handicapping.html
- Zod validation: https://zod.dev/

## OTHER CONSIDERATIONS:

### Testing Framework
- Use Jest (already included with Next.js)
- Configure Jest for TypeScript if not already done
- Tests must run with `npm test`

### Deterministic Mode for Testing
Consider adding an optional seed parameter for reproducible tests:
```typescript
function gaussianRandom(mean: number, stdDev: number, seed?: number): number
```

### Export Strategy
All scoring functions should be importable from `@/lib/scoring`:
```typescript
import { GhostGolfer, calculateCourseHandicap, generateRound } from '@/lib/scoring';
```

### No External Dependencies
Use native JavaScript/TypeScript only for the algorithm. No external math libraries needed - Box-Muller is simple to implement.

### Precision
- Use standard JavaScript number type (float64)
- Round only at final score output, not intermediate calculations
- Course handicap uses `Math.round()`

## SUCCESS CRITERIA:
1. All unit tests pass with `npm test`
2. `GhostGolfer` class generates valid 18-hole rounds
3. Course handicap calculation matches Python exactly
4. Stroke allocation matches Python exactly
5. Score distribution is statistically valid (tested with 1000+ rounds)
6. All scores bounded between par-1 and par+6
7. TypeScript strict mode - no errors
8. Exports work from `@/lib/scoring`
9. Git committed with message `feat: implement scoring engine from Python port`
10. Git pushed

## VALIDATION TEST (Manual):
After implementation, run this scenario and compare to Python:
```
Handicap Index: 15.0
Course Rating: 72.3
Slope Rating: 130
Par: [4,3,4,3,5,4,4,4,4, 4,4,3,5,4,4,5,3,4] (72 total)
Hole Handicaps: [3,17,15,7,9,11,1,13,5, 4,14,18,8,12,6,10,16,2]

Expected Course Handicap: 17
Expected Gross: ~89 (72 + 17, with variance)
```
