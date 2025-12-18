# Golf Ghost Online 🤖⛳

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-DynamoDB-FF9900?style=flat&logo=amazondynamodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**AI-Powered Golf Score Generation System**

Generate realistic golf scores based on your GHIN handicap index. Perfect for practice rounds, simulations, tournament planning, or testing golf applications.

🌐 **Live at**: [ghost.jurigregg.com](https://ghost.jurigregg.com)

## Overview

Golf Ghost Online is a web application that generates statistically accurate golf scores. Given a player's handicap index and course information, it produces realistic 18-hole scores that match expected performance distributions.

This is a web port of the original [Golf Ghost Python app](./old/), rebuilt with modern web technologies.

## Features

- **🎯 Realistic Score Generation** - Uses Gaussian distributions tuned to match real handicap performance
- **📊 Hole-by-Hole Breakdown** - See scores for each hole with stroke allocation
- **🎨 Color-Coded Scorecard** - Visual feedback from eagle (green) to triple bogey (red)
- **⚡ Instant Results** - Generate a round in milliseconds
- **📱 Mobile Friendly** - Works on any device
- **🌙 Dark Theme** - Easy on the eyes, beautiful design

## How It Works

### The Algorithm

The scoring engine implements USGA handicap principles with statistical modeling:

1. **Course Handicap Calculation**
   ```
   Course Handicap = round((Handicap Index × Slope Rating) / 113)
   ```

2. **Stroke Allocation**
   - Holes ranked 1-18 by difficulty receive strokes first
   - Players with handicap > 18 receive 2 strokes on hardest holes

3. **Score Distribution**
   - Round-level variance: Gaussian (μ=0, σ=1.2)
   - Per-hole variance: Gaussian (μ=0, σ=1.1)
   - Difficulty adjustment: +0.3 for hard holes, -0.2 for easy holes
   - Bounded between eagle (par-1) and triple bogey+ (par+6)

### Inputs Required

| Field | Description | Example |
|-------|-------------|---------|
| Handicap Index | Your GHIN handicap (0.0-54.0) | 15.0 |
| Course Rating | Course difficulty rating | 72.3 |
| Slope Rating | Course slope (55-155) | 130 |
| Par Values | Par for each hole (18 values) | [4,3,4,5,...] |
| Hole Handicaps | Difficulty ranking 1-18 | [7,15,3,1,...] |

### Sample Output

```
┌────────────────────────────────────────┐
│  GOLF GHOST - Generated Round          │
├────────────────────────────────────────┤
│  Gross: 87 (+15)  Net: 72 (E)          │
│  Course Handicap: 15                    │
├──────┬─────┬───────┬─────┬─────┬───────┤
│ Hole │ Par │ Gross │ Net │ +/- │ Color │
├──────┼─────┼───────┼─────┼─────┼───────┤
│  1   │  4  │   5   │  4  │ +1  │ 🟠    │
│  2   │  3  │   3   │  3  │  E  │ ⚪    │
│  3   │  4  │   4   │  3  │  E  │ ⚪    │
│ ...  │ ... │  ...  │ ... │ ... │ ...   │
└──────┴─────┴───────┴─────┴─────┴───────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with glass-morphism effects
- **Database**: AWS DynamoDB (for course storage)
- **Hosting**: AWS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- AWS account (for DynamoDB, optional for local dev)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/golf-ghost-online.git
cd golf-ghost-online

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```bash
# .env.local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
golf-ghost-online/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── GlassButton.tsx
│   │   ├── GlassCard.tsx
│   │   ├── ScoreForm.tsx
│   │   └── ScoreCard.tsx
│   ├── lib/
│   │   └── scoring/           # Scoring algorithm
│   │       ├── generator.ts   # Main GhostGolfer class
│   │       ├── handicap.ts    # Handicap calculations
│   │       └── distribution.ts # Gaussian random
│   └── types/                 # TypeScript interfaces
├── docs/                      # Architecture docs
├── old/                       # Original Python app
├── examples/                  # Styling references
└── CLAUDE.md                  # AI assistant rules
```

## Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run tests
```

### Context Engineering

This project uses a context engineering workflow for AI-assisted development:

- `CLAUDE.md` - Rules for AI coding assistants
- `docs/PLANNING.md` - Architecture overview
- `docs/TASK.md` - Current task status
- `docs/DECISIONS.md` - Decision log
- `INITIAL/` - Feature specifications
- `PRPs/` - Generated implementation plans

See [HANDOFF.md](./HANDOFF.md) for the full workflow.

## Score Colors

| Score | Color | Hex |
|-------|-------|-----|
| Eagle or better | 🟢 Green | #10b981 |
| Birdie | 🔵 Cyan | #22d3ee |
| Par | ⚪ Gray | #64748b |
| Bogey | 🟠 Orange | #f59e0b |
| Double Bogey | 🟠 Deep Orange | #f97316 |
| Triple+ | 🔴 Red | #ef4444 |

## API Reference

### Generate Score

```http
POST /api/generate
Content-Type: application/json

{
  "handicapIndex": 15.0,
  "courseRating": 72.3,
  "slopeRating": 130,
  "parValues": [4,3,4,5,4,4,3,4,5,4,5,4,3,4,4,3,5,4],
  "holeHandicaps": [7,15,3,1,11,5,17,9,13,8,2,14,16,6,4,18,10,12]
}
```

**Response:**
```json
{
  "id": "abc123",
  "courseHandicap": 15,
  "totalGross": 87,
  "totalNet": 72,
  "totalPar": 72,
  "scores": [
    {
      "hole": 1,
      "par": 4,
      "grossScore": 5,
      "strokesReceived": 1,
      "netScore": 4
    }
  ]
}
```

## Contributing

Contributions are welcome! Please read the architecture docs before submitting PRs:

1. Check `docs/PLANNING.md` for architecture context
2. Review `docs/DECISIONS.md` for past decisions
3. Follow conventions in `CLAUDE.md`
4. Update `docs/TASK.md` with your changes

## Original Python App

The original Golf Ghost was a Python/Tkinter desktop application. See the `/old` directory for:

- `ghost_golfer.py` - Original scoring algorithm
- `ui_theme.py` - Color scheme definitions
- `golf_courses.json` - Sample course data

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Acknowledgments

- USGA for handicap system documentation
- Original Golf Ghost Python implementation
- [jurigregg.com](https://jurigregg.com) for design inspiration

---

**Generate your ghost round today! 🏌️‍♂️👻**
