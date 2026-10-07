import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const path = name => `${root}${name}`;

rmSync(path('dist'), { recursive: true, force: true });
mkdirSync(path('dist/vendor/three/examples'), { recursive: true });
for (const name of ['index.html', 'src', 'assets']) {
  cpSync(path(name), path(`dist/${name}`), { recursive: true });
}
cpSync(path('node_modules/three/build'), path('dist/vendor'), { recursive: true });
cpSync(path('node_modules/three/examples/jsm'), path('dist/vendor/three/examples/jsm'), { recursive: true });
cpSync(path('node_modules/three/LICENSE'), path('dist/vendor/THREE-LICENSE.txt'));
writeFileSync(path('dist/.nojekyll'), '');
console.log('Built self-contained static site in dist/');
