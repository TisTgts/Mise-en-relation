/**
 * Copie pays/*.json → frontend/src/pays/data/ (source de vérité → miroir CRA).
 * Usage : node scripts/sync-pays.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'pays');
const destDir = path.join(root, 'frontend', 'src', 'pays', 'data');

if (!fs.existsSync(srcDir)) {
  console.error('Dossier pays/ introuvable:', srcDir);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.json'));
if (!files.length) {
  console.error('Aucun fichier .json dans pays/');
  process.exit(1);
}

for (const file of files) {
  const from = path.join(srcDir, file);
  const to = path.join(destDir, file);
  fs.copyFileSync(from, to);
  console.log(`OK  ${file}`);
}

// Aligne active.js sur active.json
const activePath = path.join(srcDir, 'active.json');
if (fs.existsSync(activePath)) {
  const active = JSON.parse(fs.readFileSync(activePath, 'utf8'));
  const code = (active.code || 'tg').trim().toLowerCase();
  const activeJs = path.join(root, 'frontend', 'src', 'pays', 'active.js');
  fs.writeFileSync(
    activeJs,
    `/** Code pays par défaut si REACT_APP_COUNTRY est absent (miroir de pays/active.json). */\n` +
      `export const DEFAULT_COUNTRY_CODE = '${code}';\n`,
    'utf8'
  );
  console.log(`OK  active.js → ${code}`);
}

console.log(`Synchronisé ${files.length} fichier(s) vers frontend/src/pays/data/`);
