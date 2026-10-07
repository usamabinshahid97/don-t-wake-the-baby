# Don’t Wake the Baby

A cozy cartoon stealth comedy: complete four nighttime chores without waking the baby.

Planned play URL after deployment: https://usamabinshahid97.github.io/don-t-wake-the-baby/

## Controls

- WASD or arrow keys: move
- Shift: tiptoe
- Hold E near a chore: interact
- R: restart the night
- M: mute

## Run locally

Requires Node.js 22 or newer and Python 3 for the preview server.

```sh
npm ci
npm run build
npm run preview
```

Open http://localhost:8080. The static build includes Three.js and all game assets; it needs no game server or API keys.

## Hosting

Run `bash scripts/deploy-github.sh` from this folder in your Mac’s Terminal. It uses your GitHub CLI login for `usamabinshahid97`, builds the game, commits the deployment files, creates a public repository, pushes `main`, enables GitHub Pages, and waits for deployment. It stops if another account, branch, remote, or pre-existing staged changes would be used.

After setup, GitHub Actions builds and deploys every push to `main`. Public repositories can use free GitHub Pages hosting. Set Settings → Pages → Source to **GitHub Actions** when setting up a fork.

Three.js is pinned in `package-lock.json`, and its MIT license is included in the deployed files. Generated game assets are included under `assets/genex/`.
