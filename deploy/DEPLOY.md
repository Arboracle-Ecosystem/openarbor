# Open Arbor v2.0 Deployment Guide: Google Cloud Run (`openarbor.org`) and GitHub Pages

- **Canonical Repository:** `https://github.com/Arboracle-Ecosystem/openarbor.git`
- **Primary Domain Target:** `https://openarbor.org` (Google Cloud Run service `openarbor` in `us-central1`)
- **Mirror Target:** `https://arboracle-ecosystem.github.io/openarbor/` (GitHub Pages `gh-pages` branch)
- **Build Output Directory:** `out/`
- **Runtime Dependencies:** Zero (`AGPL-3.0-only`, 100% client-side execution)

## 1. Local Multi-Page Build and 4/4 Bioregional Parity Verification

Run the static bundler, MCP verification suite, ordinance validator, and CLI-vs-browser parity gate locally before publishing:

```bash
cd /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

# 1. Run core deterministic test suite, MCP stdio suite, and ordinance schema checks
npm test
npm run test:mcp
npm run validate:ordinances

# 2. Bundle multi-page web portal, schemas, and open datasets into out/
npm run build:web

# 3. Verify 4/4 bioregional parity (84/84 metrics across TX and OR; writes deploy/VERIFICATION.md)
npm run verify:parity
```

### Static Build Output (`out/`)

| Artifact Path | Role |
| :--- | :--- |
| `out/index.html` | Open Arbor (`openarbor.org`) root landing and Open Arbor Alliance portal |
| `out/demo/index.html` | Interactive 3-mode Open Arbor field engine, Sanctuary rollup, and badge minter |
| `out/tools/index.html` | 41-tool Open-Source Forestry and Arboriculture Workbench |
| `out/ordinances/index.html` | 8-city Municipal Ordinance Commons and live Draft 2020-12 schema validator |
| `out/mcp/index.html` | Interactive 6-tool Model Context Protocol (`MCP`) simulator and JSON-RPC 2.0 inspector |
| `out/spec/index.html` | `RCA-Spec v2.0` 10-section evidentiary reference and 200-year Heartwood Vault specification |
| `out/openarbor-bundle.js` | Self-contained ESM bundle (`src/core/*` + TX/OR ordinances + 41-tool catalog + schemas + UI) |
| `out/styles.css` | Sunlight Field (`light`) and Canopy Dark (`dark`) stylesheet using `light-dark()` |
| `out/schemas/*.json` | Published Draft 2020-12 JSON Schemas served with `Access-Control-Allow-Origin: *` |
| `out/data/**/*.json` | Published municipal ordinance datasets and 41-tool forestry catalog |
| `out/.nojekyll` | Disables Jekyll processing on GitHub Pages |

## 2. Google Cloud Run Deployment (`openarbor.org`)

The root `Dockerfile` performs a two-stage build. Stage 1 (`node:20-alpine`) runs `npm ci`, `npm test`, `npm run test:mcp`, `npm run validate:ordinances`, `npm run build:web`, and `npm run verify:parity`. Stage 2 (`nginx:1.27-alpine`) copies `deploy/nginx.conf` and `/app/out/` to `/usr/share/nginx/html` on port `8080`.

Per governance policy, remote Cloud Run deploys require explicit operator confirmation:

```bash
cd /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

# Option A: Build and deploy via Google Cloud Build (cloudbuild.yaml)
gcloud builds submit --config cloudbuild.yaml .

# Option B: Direct source deploy to Cloud Run in us-central1
gcloud run deploy openarbor \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

To map or verify the custom domain `openarbor.org` on the Cloud Run service:

```bash
gcloud beta run domain-mappings list --region us-central1
```

## 3. GitHub Pages Mirror Deployment (Awaiting Approval)

Per governance policy, `git push` requires explicit operator confirmation:

```bash
cd /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

git push origin master
git subtree push --prefix out origin gh-pages
```
