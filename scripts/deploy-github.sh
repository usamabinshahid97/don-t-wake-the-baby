#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
repository='usamabinshahid97/don-t-wake-the-baby'
repository_url="https://github.com/$repository"

for command in gh git npm curl; do
  command -v "$command" >/dev/null || { echo "Install $command before deploying." >&2; exit 1; }
done
account=$(gh api user --jq .login)
if [[ "$account" != 'usamabinshahid97' ]]; then
  echo "Sign in to usamabinshahid97 with gh auth login before deploying." >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != 'main' ]]; then
  echo 'Switch to main before deploying.' >&2
  exit 1
fi
if ! git diff --cached --quiet; then
  echo 'There are already staged changes. Commit or unstage them before deploying.' >&2
  exit 1
fi
if git remote get-url origin >/dev/null 2>&1; then
  existing_remote=$(git remote get-url origin)
  case "$existing_remote" in
    "$repository_url"|"$repository_url.git"|"git@github.com:$repository.git") ;;
    *) echo "Origin points elsewhere: $existing_remote. Deployment stopped." >&2; exit 1 ;;
  esac
fi

npm ci
npm run build
git diff --check
git add index.html package.json package-lock.json README.md scripts .github/workflows/pages.yml
if ! git diff --cached --quiet; then
  git commit -m 'Prepare standalone game and GitHub Pages deployment'
fi
if ! gh repo view "$repository" --json name >/dev/null 2>&1; then
  gh repo create "$repository" --public --description 'A cozy nighttime stealth comedy game'
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$repository_url.git"
fi
gh auth setup-git
git push -u origin main

if gh api "repos/$repository/pages" >/dev/null 2>&1; then
  gh api --method PUT "repos/$repository/pages" -f build_type=workflow >/dev/null
else
  gh api --method POST "repos/$repository/pages" -f build_type=workflow >/dev/null
fi
gh workflow run pages.yml --repo "$repository" --ref main
head_sha=$(git rev-parse HEAD)
run_id=''
for attempt in {1..30}; do
  run_id=$(gh run list --repo "$repository" --workflow pages.yml --event workflow_dispatch --commit "$head_sha" --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  [[ -n "$run_id" ]] && break
  sleep 2
done
if [[ -z "$run_id" ]]; then
  echo "The deployment was requested. Check $repository_url/actions for its status." >&2
  exit 1
fi
gh run watch "$run_id" --repo "$repository" --exit-status
game_url=$(gh api "repos/$repository/pages" --jq .html_url)
gh repo edit "$repository" --homepage "$game_url"
for attempt in {1..36}; do
  if curl --fail --silent --show-error --max-time 20 "$game_url" -o /dev/null; then
    echo "Code: $repository_url"
    echo "Play: $game_url"
    exit 0
  fi
  sleep 5
done
echo "Deployment succeeded, but the public URL is still pending: $game_url" >&2
exit 1
