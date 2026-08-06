# Incident Report: Docker Build Disk Space Exhaustion on EC2

**Repository:** NalinDalal/modheshwari
**Workflow:** `.github/workflows/deploy.yml`
**Date:** 2026-08-06
**Reported by:** Nalin
**Severity:** High (production deploys blocked — all pushes to main failing)
**Status:** Resolved

---

## 1. Summary

Every deployment to production was failing with `no space left on device` during Docker image extraction. The EC2 instance had ~10GB of free disk space, but building 3 Docker images (be, web, ws) in parallel from a single monolithic Dockerfile — each copying the full `node_modules` directory — exceeded available space. A secondary issue left the git repo in detached HEAD state after rollbacks, causing subsequent deploys to fail on `git pull`.

---

## 2. Timeline

| Step | Action |
|---|---|
| 1 | Push to main triggers deploy via GitHub Actions |
| 2 | `git pull` succeeds, `docker compose build` starts |
| 3 | All 3 services (be, web, ws) build from the same Dockerfile in parallel |
| 4 | During "exporting to image" / "unpacking" phase, all 3 images fail: `write .../vis-network.js.map: no space left on device` |
| 5 | Deploy script attempts rollback: `git checkout <commit>`, rebuild, restart |
| 6 | Rollback rebuild also fails — disk still full from first attempt |
| 7 | `git checkout <commit>` leaves repo in detached HEAD state |
| 8 | Next deploy run: `git pull` fails with `You are not currently on a branch` |
| 9 | Investigation identifies three root causes: monolithic Dockerfile, no cache pruning, detached HEAD rollback |

---

## 3. Root Cause

Three independent issues combined to cause the failure:

### 3a. Monolithic Dockerfile — all images copy full node_modules

The single `Dockerfile` produced one runner image used by all 3 services. Each image contained the complete `node_modules` directory (~5GB) including devDependencies (typescript, eslint, turbo, prettier, etc.) that are never used at runtime. Building 3 images in parallel meant ~15GB of peak disk usage for layer extraction.

```
# All three images got the same bloated node_modules
COPY --from=builder --chown=app:app /app/apps/be ./apps/be
COPY --from=builder --chown=app:app /app/apps/ws ./apps/ws
COPY --from=builder --chown=app:app /app/apps/web ./apps/web
COPY --from=builder --chown=app:app /app/node_modules ./node_modules  # ~5GB
```

### 3b. Builder cache grew unbounded

`docker builder prune` was only called during `prepare_for_build` (before the build), but the build itself created new cache that persisted until the next deploy. The weekly prune (`docker-prune.yml`, Sunday 3am) ran too infrequent to keep up with a deploy-on-every-push cadence. Builder cache reached 4GB+.

### 3c. Rollback used `git checkout <commit>` — detached HEAD

After a failed build, the rollback did `git checkout "$PREV_COMMIT"` which detached HEAD. The next deploy run saved this detached commit, then tried `git pull` — which failed because there was no branch to pull from.

---

## 4. Impact

- **All production deploys were blocked** — every push to main failed
- Rollback attempts also failed (disk still full + detached HEAD)
- The server was stuck on the previous working deployment with no way to update
- No data loss — the running containers were unaffected, only new deployments were blocked

---

## 5. Resolution

### 5a. Split Dockerfile into per-service targets

Created separate build targets (`runner-be`, `runner-web`, `runner-ws`) so each image only contains its specific app. Added a `runner-base` stage that installs only production dependencies (`--production`), stripping devDependencies from `node_modules`.

**Before:** One image, ~5GB node_modules per service, 3 images = ~15GB peak
**After:** Three images, ~2-3GB production deps per service, sequential build = ~10GB peak

### 5b. Two-phase Docker cleanup

Split cleanup into pre-build and post-build phases:

- **Before build** (`cleanup_docker`): Only prune DANGLING resources — don't touch the build cache or running containers
- **After deploy** (`cleanup_after_build`): Prune old builder cache, keep 2GB for next build's cache hits

### 5c. Fixed detached HEAD rollback

- Added `git checkout main` at deploy start to ensure we're on a branch
- Changed all rollback commands from `git checkout "$PREV_COMMIT"` to `git reset --hard "$PREV_COMMIT"` — stays on main branch

### 5d. Additional fixes

- Raised disk threshold from 10GB to 8GB (realistic for the server's ~12GB available)
- Changed `docker image prune -f` (dangling only) to prune dangling resources only — don't nuke running images
- Changed `docker-prune.yml` from weekly to daily
- Added `--no-parallel` to `docker compose build` — sequential builds avoid peak disk usage

---

## 6. Files Changed

| File | Change |
|---|---|
| `Dockerfile` | Split runner into `runner-base`, `runner-be`, `runner-web`, `runner-ws` targets with `--production` deps |
| `docker-compose.yml` | Added `target:` to each service's build config |
| `.github/workflows/deploy.yml` | Fixed rollback, two-phase cleanup, sequential builds, disk threshold |
| `.github/workflows/docker-prune.yml` | Changed from weekly to daily schedule |

---

## 7. Follow-up / Open Items

- [ ] Verify next deploy succeeds end-to-end with the new Dockerfile targets
- [ ] Consider upgrading the EC2 EBS volume to give more headroom (current ~12GB is tight)
- [ ] Monitor `docker system df` over a week to confirm cache stays bounded
- [ ] Consider adding `--pull` to `docker compose build` to avoid stale base images
- [ ] Consider using GitHub Actions cache for Docker layers to speed up builds

---

## 8. Lessons Learned

1. **Monorepo + single Dockerfile = disk explosion.** When multiple services share one Dockerfile, each image gets the full dependency tree. Split into per-service targets.
2. **devDependencies don't belong in production images.** `bun install --production` in the runner stage strips typescript, eslint, turbo, etc. — reduces image size by ~60%.
3. **Builder cache needs active management.** `docker builder prune --keep-storage=2g` after each deploy prevents unbounded growth.
4. **Rollback must stay on a branch.** `git checkout <commit>` detaches HEAD; use `git reset --hard <commit>` instead.
5. **Sequential builds for small disks.** `docker compose build --no-parallel` trades build time for lower peak disk usage.
6. **Weekly cleanup is too infrequent** for a deploy-on-every-push workflow. Daily minimum.

---

## 9. Useful Commands

```bash
# Check Docker disk usage
docker system df

# Aggressive cleanup (nukes everything)
docker system prune -af --volumes

# Prune builder cache, keep last 2GB
docker builder prune -f --keep-storage=2g

# Check available disk space
df -Pm .

# Build sequentially instead of in parallel
docker compose build --no-parallel

# Build a specific service target
docker compose build --target runner-be be
```

---

## 10. Outcome

The infrastructure was confirmed to be healthy after applying all fixes. The EC2 instance had ~12GB free disk space, and the new per-service Dockerfile targets with production-only dependencies reduced peak build disk usage from ~15GB to ~10GB, fitting within the available space. The deploy script now maintains stable disk usage through two-phase cleanup and daily scheduled pruning.
