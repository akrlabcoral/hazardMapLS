# Contributing to HazardMap

Thank you for your interest in contributing! This document explains how to get started and submit changes.

## 🚀 Getting Started

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 22+ (for local frontend development)
- Python 3.10+ (for local backend development)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/akrlabcoral/hazardMapLS.git
cd hazardMapLS

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start the application
make build
# OR
docker-compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🌿 Branching Strategy

We use a simple branch-based workflow:

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `testing` | Integration branch for features before main |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation updates |

**Example:**
```bash
git checkout -b feature/live-flood-simulation
```

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Formatting, no code change
- `refactor:` — Code restructuring
- `test:` — Adding or updating tests
- `chore:` — Maintenance, dependency updates

**Examples:**
```bash
feat: add live flood simulation module
fix: resolve 504 Gateway Timeout on heatwave
 docs: update API endpoint documentation
```

## 🔄 Submitting Changes

1. **Create a branch** from `testing`
2. **Make your changes** with clear, focused commits
3. **Test your changes** (`make test`)
4. **Lint your code** (`make lint`)
5. **Push your branch** and open a Pull Request to `testing`
6. **Request review** from at least one maintainer

## 🧪 Testing

### Backend Tests
```bash
make test-backend
# OR
cd backend && python -m pytest tests/ -v
```

### Frontend Tests
```bash
make test-frontend
# OR
cd frontend && npm test
```

## 🏗️ Code Style

### Python (Backend)
- **Formatter:** `black` (line length: 120)
- **Linter:** `flake8`
- Follow PEP 8 guidelines
- Use type hints for function signatures

### JavaScript/React (Frontend)
- **Formatter:** Prettier
- **Linter:** ESLint
- Use functional components with hooks
- Follow existing naming conventions

## 🗺️ Module Integration (Important)

This project is **modular by design**. The earthquake simulation module is maintained in a separate repository and will be integrated via:
- Shared API contracts (`/api/v1/simulate/earthquake`)
- Common data structures (GeoJSON FeatureCollections)
- Shared utility services (`impact_aggregator`, `contour_generator`)

If you are adding a new disaster module, follow the pattern established by:
- `backend/app/heatwave/` — Live weather simulation
- `backend/app/landslide/` — Rainfall + seismic combined simulation

## 🐛 Reporting Bugs

Use GitHub Issues with this template:

```markdown
**Description:**
[What happened?]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Behavior:**
[What should have happened?]

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 126]
- Docker Version: [e.g., 4.30]
```

## 💬 Questions?

Open a GitHub Discussion or reach out to the maintainers.
