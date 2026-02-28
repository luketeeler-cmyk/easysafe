# EasySafe – Claude Code Instructions

## Project Overview
EasySafe is a single-file HTML app (`EasySafe.html`) deployed to GitHub Pages.
**CRITICAL: Never deliver EasySafe.html as a file download. Always push directly to GitHub.**

## Credentials
- **GitHub Repo:** `luketeeler-cmyk/easysafe`
- **GitHub Token:** Ask Luke — starts with `ghp_w83A`, has repo write access. Store as env var `GITHUB_TOKEN`.
- **Supabase URL:** `https://cngrtzoyncmxfcakesio.supabase.co`
- **Supabase Anon Key:** `sb_publishable_nwCsqQ46vrd3HElgzNoP5Q_qPVHB49d`
- **Live URL:** `https://luketeeler-cmyk.github.io/easysafe/EasySafe.html`

## Deploy: Git over HTTPS (Primary Method)
```bash
git clone https://$GITHUB_TOKEN@github.com/luketeeler-cmyk/easysafe.git /tmp/easysafe-deploy
cp ./EasySafe.html /tmp/easysafe-deploy/EasySafe.html
cd /tmp/easysafe-deploy
git config user.email "bot@claude.ai"
git config user.name "Claude Assistant"
git add EasySafe.html
git commit -m "Update: [describe change]"
git push origin main
cd / && rm -rf /tmp/easysafe-deploy
```

## Deploy: GitHub API via curl (Fallback)
```bash
SHA=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/luketeeler-cmyk/easysafe/contents/EasySafe.html \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
CONTENT=$(base64 -w 0 EasySafe.html)
curl -s -X PUT -H "Authorization: token $GITHUB_TOKEN" -H "Content-Type: application/json" \
  https://api.github.com/repos/luketeeler-cmyk/easysafe/contents/EasySafe.html \
  -d "{\"message\":\"Update\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}"
```

## Deploy: Python (Most Reliable Fallback)
```python
import base64, json, urllib.request, os
TOKEN = os.environ["GITHUB_TOKEN"]
REPO = "luketeeler-cmyk/easysafe"
FILE = "EasySafe.html"
with open(FILE, "rb") as f:
    content = base64.b64encode(f.read()).decode()
req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/contents/{FILE}",
    headers={"Authorization": f"token {TOKEN}"})
with urllib.request.urlopen(req) as r:
    sha = json.loads(r.read())["sha"]
data = json.dumps({"message": "Update", "content": content, "sha": sha}).encode()
req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/contents/{FILE}",
    data=data, method="PUT",
    headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"})
with urllib.request.urlopen(req) as r:
    print("Pushed:", json.loads(r.read())["commit"]["sha"])
```

## App Architecture
- **Single file** — all HTML/CSS/JS in `EasySafe.html`. Never split.
- **No build tools** — vanilla JS only. No npm/webpack/frameworks.
- **Auth** — Supabase OTP: email → 6-digit code → signed in. Data isolated by `user_id`.
- **Database:** `firearms` table — `id, user_id, make, model, serial, caliber, category, condition, barrel_length, capacity, acquired, price, location, notes, photos (JSONB), created_at`
- **Photos** — bucket `firearm-photos`, path `{user_id}/{photoId}.jpg`, 10-year signed URLs
- **Colors** — warm dark, sage green `#7a9e7e`, no blues (low blue-light by design)
- **Fonts** — Barlow (UI), JetBrains Mono (serial numbers)

## Common Edit Patterns
- **New form field:** Add Supabase column → `mf()` in `renderForm()` → `data` in `submitForm()` → `rows` in `renderDetail()`
- **New filter:** Modify `CATS` array or `renderFilters()`
- **Colors:** Edit CSS custom properties in `:root {}`

## Verify After Push
```bash
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/luketeeler-cmyk/easysafe/commits/main \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r['sha'][:7], r['commit']['message'])"
```
GitHub Pages goes live ~30–60 seconds after push.
