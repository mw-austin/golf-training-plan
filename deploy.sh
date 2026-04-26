#!/usr/bin/env bash
# One-shot deploy script for Austin's Golf Training Plan site.
# Creates a GitHub repo, pushes the code, and enables GitHub Pages.
# The only manual step: you'll be prompted to sign in to GitHub via browser.

set -e

REPO_NAME="${1:-golf-training-plan}"
VISIBILITY="${2:-public}"  # "public" or "private"

# --- 1. Make sure we're in the right folder ---
cd "$(dirname "$0")"
echo "→ Working in: $(pwd)"

# --- 2. Check for GitHub CLI; install if missing ---
if ! command -v gh >/dev/null 2>&1; then
  echo "→ GitHub CLI (gh) not found. Installing via Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "✗ Homebrew is not installed. Install Homebrew first from https://brew.sh and re-run this script."
    echo "  Or install gh manually: https://github.com/cli/cli#installation"
    exit 1
  fi
  brew install gh
fi
echo "✓ GitHub CLI ready: $(gh --version | head -1)"

# --- 3. Authenticate (opens browser if needed) ---
if ! gh auth status >/dev/null 2>&1; then
  echo ""
  echo "→ You need to sign in to GitHub. A browser window will open."
  echo "  Choose: GitHub.com → HTTPS → 'Login with a web browser' → paste the one-time code shown."
  echo "  When done, come back to this terminal."
  echo ""
  gh auth login --web --git-protocol https --hostname github.com
fi
echo "✓ Authenticated as: $(gh api user --jq .login)"

# --- 4. Make sure the local repo has a commit (it should, but double-check) ---
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "→ Initializing git repo..."
  git init -b main
  git add .
  git commit -m "Initial commit"
fi

# --- 5. Create the remote repo and push ---
GH_USER=$(gh api user --jq .login)
echo ""
echo "→ Creating GitHub repo: ${GH_USER}/${REPO_NAME} (${VISIBILITY})"

if gh repo view "${GH_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "  Repo already exists. Adding it as a remote and pushing."
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/${GH_USER}/${REPO_NAME}.git"
  fi
  git branch -M main
  git push -u origin main
else
  gh repo create "${REPO_NAME}" --"${VISIBILITY}" --source=. --remote=origin --push
fi

# --- 6. Enable GitHub Pages from the main branch root ---
echo ""
echo "→ Enabling GitHub Pages from main / root..."
# Try modern API; if 409 (already enabled) just continue
gh api -X POST "repos/${GH_USER}/${REPO_NAME}/pages" \
  -f "source[branch]=main" \
  -f "source[path]=/" \
  >/dev/null 2>&1 || echo "  (Pages may already be enabled — that's fine.)"

# --- 7. Print the URL ---
PAGES_URL="https://${GH_USER}.github.io/${REPO_NAME}/"
echo ""
echo "================================================================"
echo "✓ Done. Your site will be live at:"
echo ""
echo "    ${PAGES_URL}"
echo ""
echo "  GitHub Pages takes 30–90 seconds to build the first time."
echo "  Repo: https://github.com/${GH_USER}/${REPO_NAME}"
echo "================================================================"
