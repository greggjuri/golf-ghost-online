# Golf Ghost Online

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Generate realistic golf scores based on your GHIN handicap index. Uses USGA handicap formulas with statistical modeling to produce accurate round simulations.

**Live:** [ghost.jurigregg.com](https://ghost.jurigregg.com)

---

## Features

- **Score Generation** - Gaussian distributions tuned to match real handicap performance
- **Course Management** - Full CRUD operations for custom courses (authenticated)
- **Admin Authentication** - Cognito-based JWT auth protects course management
- **Hole-by-Hole Breakdown** - Detailed scorecard with stroke allocation
- **Color-Coded Results** - Visual feedback from eagle (green) to triple bogey (red)
- **Mobile Responsive** - Works on any device with dark theme

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| API | AWS API Gateway (HTTP) + Lambda |
| Database | AWS DynamoDB |
| Auth | AWS Cognito User Pools |
| Hosting | S3 + CloudFront CDN |
| DNS | Route53 |

## Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured (for deployment)

### Local Development

```bash
# Clone and install
git clone https://github.com/yourusername/golf-ghost-online.git
cd golf-ghost-online
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and Cognito settings

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Deployment

### First-Time Setup

Run these scripts in order to set up AWS infrastructure:

```bash
# 1. Create DynamoDB table
aws dynamodb create-table \
  --table-name golf-ghost-courses \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# 2. Deploy Lambda functions
./scripts/deploy-lambdas.sh

# 3. Set up API Gateway with routes
./scripts/setup-api-gateway.sh

# 4. Seed initial course data
cd lambda && npm run seed && cd ..

# 5. Set up Cognito authentication
./scripts/setup-cognito.sh
./scripts/create-admin-user.sh your-email@example.com
./scripts/setup-cognito-authorizer.sh
./scripts/update-api-cors.sh

# 6. Set up S3, CloudFront, DNS (update scripts with your values first)
./scripts/setup-s3-policy.sh
./scripts/setup-cloudfront-errors.sh
./scripts/setup-dns.sh

# 7. Deploy the site
npm run deploy
```

### Subsequent Deployments

```bash
npm run deploy           # Deploy frontend only
npm run deploy:lambdas   # Deploy Lambda functions
npm run deploy:infra     # Full infrastructure deployment
```

## Project Structure

```
golf-ghost-online/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Home - score generation
│   │   ├── manage/          # Course management (protected)
│   │   └── login/           # Login page
│   ├── components/          # React components
│   ├── lib/
│   │   ├── scoring/         # Score generation algorithm
│   │   ├── api/             # Lambda API client
│   │   └── auth/            # Cognito auth module
│   └── types/               # TypeScript interfaces
├── lambda/                  # AWS Lambda functions
│   ├── generate-score/      # POST /generate-score
│   ├── get-courses/         # GET /courses
│   ├── create-course/       # POST /courses (auth required)
│   ├── update-course/       # PUT /courses/{id} (auth required)
│   ├── delete-course/       # DELETE /courses/{id} (auth required)
│   └── shared/              # Shared code (scoring, db)
├── scripts/                 # Deployment scripts
└── docs/                    # Architecture documentation
```

## Scoring Algorithm

Ported from the original [Golf Ghost Python app](https://github.com/greggjuri/golf-ghost):

1. **Course Handicap**: `round((Handicap Index × Slope Rating) / 113)`
2. **Stroke Allocation**: Holes ranked 1-18 by difficulty receive strokes
3. **Score Distribution**:
   - Round variance: Gaussian (μ=0, σ=1.2)
   - Hole variance: Gaussian (μ=0, σ=1.1)
   - Difficulty adjustment: +0.3 hard holes, -0.2 easy holes
   - Bounds: eagle (par-1) to triple+ (par+6)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generate-score` | No | Generate a round |
| GET | `/courses` | No | List all courses |
| POST | `/courses` | Yes | Create course |
| PUT | `/courses/{id}` | Yes | Update course |
| DELETE | `/courses/{id}` | Yes | Delete course |

## Score Colors

| Score | Color | Hex |
|-------|-------|-----|
| Eagle or better | Green | `#10b981` |
| Birdie | Cyan | `#22d3ee` |
| Par | Gray | `#64748b` |
| Bogey | Orange | `#f59e0b` |
| Double Bogey | Deep Orange | `#f97316` |
| Triple+ | Red | `#ef4444` |

## Original Python App

This project is a web port of the [Golf Ghost](https://github.com/greggjuri/golf-ghost) Python/Tkinter desktop app. Key files ported:

- `ghost_golfer.py` → `src/lib/scoring/generator.ts`
- `ui_theme.py` → Tailwind config + CSS
- `golf_courses.json` → DynamoDB seed data
- `course_manager.py` → Lambda CRUD functions

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests (66 passing)
npm run lint         # ESLint
npm run deploy       # Deploy to S3/CloudFront
```

## License

MIT License - see [LICENSE](./LICENSE)

---

Built with Next.js and AWS serverless infrastructure.
