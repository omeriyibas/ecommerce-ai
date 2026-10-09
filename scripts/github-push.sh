#!/usr/bin/env bash
# Ana dizini (api + panel + README) GitHub’a push eder.
# Yereldeki ecommerce-ai-api / ecommerce-ai-panel .git remote’ları bozulmaz.
#
# Kullanım:
#   ./scripts/github-push.sh              # commit + push (repo yoksa oluşturur)
#   ./scripts/github-push.sh --public     # public repo
#   REPO_NAME=ecommerce-ai ./scripts/github-push.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO_NAME="${REPO_NAME:-ecommerce-ai}"
VISIBILITY="${VISIBILITY:-private}"
NESTED=(ecommerce-ai-api ecommerce-ai-panel)
ASIDE_NAME=".git.__monorepo_aside__"

for arg in "$@"; do
  case "$arg" in
    --public) VISIBILITY=public ;;
    --private) VISIBILITY=private ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
  esac
done

if ! command -v gh >/dev/null; then
  echo "gh CLI gerekli: https://cli.github.com/" >&2
  exit 1
fi
if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Önce: gh auth login -h github.com" >&2
  exit 1
fi

restore_nested() {
  local d
  for d in "${NESTED[@]}"; do
    if [[ -d "$ROOT/$d/$ASIDE_NAME" && ! -e "$ROOT/$d/.git" ]]; then
      mv "$ROOT/$d/$ASIDE_NAME" "$ROOT/$d/.git"
    fi
  done
}
trap restore_nested EXIT

aside_nested() {
  local d
  for d in "${NESTED[@]}"; do
    if [[ -d "$ROOT/$d/.git" ]]; then
      mv "$ROOT/$d/.git" "$ROOT/$d/$ASIDE_NAME"
    fi
  done
}

if [[ ! -f "$ROOT/.gitignore" ]]; then
  echo "Eksik: .gitignore" >&2
  exit 1
fi

aside_nested

if [[ ! -d "$ROOT/.git" ]]; then
  git init -b master
fi

git add -A

# Güvenlik: .env asla stage olmasın
if git diff --cached --name-only | grep -E '(^|/)\.env($|\.)' | grep -v '\.example' >/dev/null; then
  echo "HATA: .env stage’de — iptal." >&2
  git reset HEAD -- . >/dev/null 2>&1 || true
  exit 1
fi

if git diff --cached --quiet && git rev-parse HEAD >/dev/null 2>&1; then
  echo "Commitlenecek değişiklik yok."
else
  if ! git rev-parse HEAD >/dev/null 2>&1; then
    git commit -m "Initial monorepo: api, panel, README"
  else
    git commit -m "Update monorepo"
  fi
fi

OWNER="$(gh api user -q .login)"
REMOTE_URL="https://github.com/${OWNER}/${REPO_NAME}.git"

if git remote get-url origin >/dev/null 2>&1; then
  :
elif gh repo view "${OWNER}/${REPO_NAME}" >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  gh repo create "${OWNER}/${REPO_NAME}" --"${VISIBILITY}" --source=. --remote=origin --description "ecommerce-ai monorepo (api + panel)"
fi

git push -u origin HEAD
echo "OK → https://github.com/${OWNER}/${REPO_NAME}"
