# OpenArbor v2.0 Static Web Field Tool Deployment Guide (GitHub Pages)

- **Repository:** `https://github.com/Arboracle-Ecosystem/openarbor.git`
- **Target Public URL:** `https://arboracle-ecosystem.github.io/openarbor/`
- **Build Target Directory:** `out/`
- **Runtime Dependencies:** Zero (`AGPL-3.0-only`, 100% client-side execution)

## 1. Local Build and Parity Verification

Run the static bundler and deterministic verification suites locally before publishing:

```bash
cd /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

# 1. Build static browser bundle into out/
npm run build:web

# 2. Verify CLI vs. browser bundle 3/3 parity (writes deploy/VERIFICATION.md)
npm run verify:parity

# 3. Run full OpenArbor v2.0 test suite
npm test
```

### Static Build Output (`out/`)

| Artifact Path | Size (Bytes) | Description |
| :--- | :--- | :--- |
| `out/.nojekyll` | `0` | Disables Jekyll processing on GitHub Pages |
| `out/index.html` | `28591` | Mobile-first single-page field assessment interface |
| `out/openarbor-bundle.js` | `219024` | Self-contained ESM bundle (`src/core/*` + Central Texas ordinances + RCA schemas) |
| `out/styles.css` | `11304` | High-contrast sunlight-legible field stylesheet |

## 2. Exact Git Push and GitHub Pages Enable Commands (Awaiting Approval)

Per governance policy, `git push` and remote state changes require explicit operator confirmation. Execute the following commands when ready to publish:

```bash
cd /home/george/Myceliate_Master/UNDERSTORY/arboracle-ecosystem/openarbor

# Step 1: Stage and commit the web field tool, static build, and verification artifacts
git add package.json package-lock.json web/ deploy/ out/ tests/verify_openarbor.mjs
git commit -m "feat(web): add mobile-first OpenArbor v2.0 static field tool and CLI parity proof"

# Step 2: Push master branch to origin
git push origin master

# Step 3: Publish the static out/ directory to the gh-pages branch
git subtree push --prefix out origin gh-pages

# Step 4: Enable GitHub Pages on the gh-pages branch via GitHub CLI
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  /repos/Arboracle-Ecosystem/openarbor/pages \
  -f "source[branch]=gh-pages" \
  -f "source[path]=/"
```

If GitHub Pages is already enabled on the repository and only needs its source branch updated to `gh-pages`:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/Arboracle-Ecosystem/openarbor/pages \
  -f "source[branch]=gh-pages" \
  -f "source[path]=/"
```

## 3. Post-Enable Verification

Once GitHub Pages finishes building (typically under 60 seconds), verify the live deployment status:

```bash
gh api /repos/Arboracle-Ecosystem/openarbor/pages --jq '{status: .status, html_url: .html_url, source: .source}'
```

Arborist candidates can then open `https://arboracle-ecosystem.github.io/openarbor/` on any mobile browser, select any of the five bundled Central Texas municipalities (`Austin`, `Georgetown`, `Liberty Hill`, `Cedar Park`, `Round Rock`), complete an ANSI A300 / RCA-Spec v2.0 tree and rhizosphere assessment in under 5 minutes, and export the OGC CRS84 GeoJSON, 10-section RCA Evidentiary Report Markdown, or Scientific Preservation Counter-Notice directly on their phone.
