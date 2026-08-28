const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');

const APPS = [
  { id: 'rider', name: 'Chalao Rider', entryRel: path.join('rider', 'index.html') },
  { id: 'driver', name: 'Chalao Driver', entryRel: path.join('driver', 'index.html') },
  { id: 'admin', name: 'Chalao Admin', entryRel: path.join('admin', 'index.html') }
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('Preparing isolated web assets for Rider, Driver, and Admin apps...');

APPS.forEach(app => {
  const appDistDir = path.join(ROOT_DIR, 'apps', app.id, 'dist');
  if (!fs.existsSync(appDistDir)) {
    fs.mkdirSync(appDistDir, { recursive: true });
  }

  // Copy entire Next.js static export
  copyFolderSync(OUT_DIR, appDistDir);

  // Replace index.html with the app-specific entry point
  const specificHtmlPath = path.join(OUT_DIR, app.entryRel);
  const targetIndexPath = path.join(appDistDir, 'index.html');
  if (fs.existsSync(specificHtmlPath)) {
    fs.copyFileSync(specificHtmlPath, targetIndexPath);
    console.log(`[OK] Configured ${app.name} entry point from ${app.entryRel} -> index.html`);
  } else {
    console.warn(`[WARN] ${app.entryRel} not found in out/`);
  }
});

console.log('All 3 app dist folders successfully prepared!');
