# HazardMap Project Status Report

**Date:** 2026-07-03  
**Branch:** testing  
**Commit:** `bb1b17f`  
**Prepared by:** OpenCode AI assistant

---

## 1. Executive Summary

The repository was restored to the last pushed commit (`bb1b17f`). The working tree now contains the older, simpler version of the backend/frontend code, plus a large number of newly added GIS raster data files that are currently staged for commit. There is a significant mismatch between the `.env` configuration (newer version) and the active code/docker setup (older version). This mismatch was the root cause of the runtime errors observed during testing.

**Bottom line:** The project is in a hybrid state. Do not commit the current state as-is. Decide whether to use the old simple stack or restore the newer feature-complete stack, then align `.env`, Docker Compose, and code accordingly.

---

## 2. Current State

### 2.1 Code Version
- **Active commit:** `bb1b17f` — older architecture.
- **Backend structure:**
  - `app/api/{simulate,export,events,ws}.py`
  - `app/landslide/`, `app/heatwave/`, `app/seismic/`, `app/soil/`, `app/layers/`
  - `app/ingest/poller.py`, `app/jobs/queue.py`, `app/models/repository.py`
- **Not present in this commit:**
  - `app/core/security.py` (no API-key auth)
  - `app/hazards/` unified module
  - `app/services/redis_client.py`
  - Redis/RQ worker services in `docker-compose.yml`

### 2.2 Configuration Files
- **`.env`**: Contains newer variables (`API_KEY`, `REDIS_URL`, `WS_MAX_CLIENTS`, `VS30_RASTER_PATH`, etc.) that the current code ignores.
- **`docker-compose.yml`**: Old simple version — only `db`, `backend`, `frontend`. No Redis, no `env_file`, no API-key handling.
- **`backend/app/config.py`**: Hardcoded constants; does not read environment variables.

### 2.3 Staged Changes
- **67 new raster/data files** are staged for commit:
  - `backend/data/external_soils/` — state-wise soil rasters
  - `backend/data/rasters/` — elevation, slope, soil moisture
  - `backend/data/soil/` — VS30 and state soil files
  - `frontend/public/rasters/` — population, land-cover rasters

---

## 3. Issues Found

### 3.1 Critical: Version Mismatch
| Component | Expected by `.env` | Provided by current code |
|-----------|-------------------|--------------------------|
| Redis | `REDIS_URL=redis://redis:6379/0` | No Redis service or client |
| API Key | `API_KEY=hazardmap_key_123` | No auth module or route dependency |
| VS30 raster | `VS30_RASTER_PATH=/app/data/soil/india_vs30.tif` | Code uses `app.soil.loader` paths |
| Env loading | `.env` should be loaded | Docker Compose does not mount/use `.env` for backend |

### 3.2 Runtime Errors Observed (Before Restore)
- `403 Forbidden` on `/api/hazards/landslide/simulate/rainfall` — API-key mismatch.
- `setMlHeatmapVisible is not a function` — missing Zustand state in frontend store.
- `WebSocket connection failed` — intermittent; backend was still starting.
- `ModuleNotFoundError: No module named 'dotenv'` — `python-dotenv` added to requirements but Docker image not rebuilt.

### 3.3 Git/Repository Concerns
- **Large binary files staged.** Committing ~67 TIFF rasters will permanently bloat the git history. This is bad practice for version control.
- **Untracked `.env` file.** Contains secrets/passwords. It appears to be gitignored, which is correct, but should be verified.

---

## 4. Recommendations

### 4.1 Immediate Actions

#### A. Unstage the raster files from Git
```bash
git reset HEAD backend/data frontend/public/rasters
```

#### B. Choose one architecture

**Option A — Stick with the current simple code (`bb1b17f`)**
- Pros: Smaller, fewer moving parts, no Redis/RQ complexity.
- Cons: Fewer features, no API-key protection, no distributed simulation worker.
- Required changes:
  1. Simplify `.env` to remove unused Redis/API-key/VS30 variables.
  2. Keep `docker-compose.yml` as-is (it already matches the old code).
  3. Add the missing frontend store setters (`setMlHeatmapVisible`, `setMlContoursVisible`) if the newer frontend code is still used.

**Option B — Restore the newer feature-complete codebase**
- Pros: Full hazard engine, API-key auth, Redis pub/sub, WebSocket fan-out, RQ workers.
- Cons: More complex; had several bugs that need systematic fixing.
- Required changes:
  1. Restore the newer code from backup/branch.
  2. Add `python-dotenv==1.0.1` to `backend/requirements.txt` and rebuild Docker image.
  3. Add `env_file: .env` to the `backend` service in `docker-compose.yml`.
  4. Fix `load_dotenv()` path in `main.py` to point to project-root `.env`.
  5. Add missing Zustand store setters in `frontend/src/store/slices/mapSlice.js`.
  6. Rebuild containers with `docker-compose up -d --build`.

### 4.2 Best Practices

1. **Do not commit binary raster data to git.** Use one of:
   - Git LFS (if you must version them)
   - Cloud/object storage (S3, GCS, Azure Blob) with download scripts
   - A separate `data/` volume mounted into Docker at runtime

2. **Keep `.env.example` in git, `.env` out of git.** Verify `.env` is in `.gitignore`.

3. **Align Docker Compose with `.env`.** If `.env` has `REDIS_URL`, `docker-compose.yml` must define a `redis` service and pass the URL to containers.

4. **Pin dependencies.** Add `python-dotenv` to `requirements.txt` only if the newer code is used; otherwise remove it from `.env`/code to avoid confusion.

---

## 5. Next Steps

1. Decide **Option A** or **Option B**.
2. Unstage raster files.
3. If Option A: clean up `.env` and apply minimal frontend fix.
4. If Option B: restore newer code and re-apply the bug fixes systematically.
5. Rebuild and restart Docker services.
6. Test the landslide simulation endpoint and WebSocket connection.

---

## 6. Files to Review

| File | Status | Notes |
|------|--------|-------|
| `.env` | Untracked, newer version | Mismatch with current code |
| `docker-compose.yml` | Older version | No Redis, no `env_file` |
| `backend/app/main.py` | Older version | Uses `app.landslide`, `app.heatwave` |
| `backend/app/config.py` | Older version | Hardcoded, ignores env |
| `frontend/src/store/slices/mapSlice.js` | Needs check | May be missing `setMlHeatmapVisible` |
| `backend/requirements.txt` | Older version | Missing `python-dotenv` |

---

*End of report.*
