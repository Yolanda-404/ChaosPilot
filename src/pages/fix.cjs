const fs = require('fs');
const file = 'src/pages/ContinuityArchivePage.tsx';
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');
lines.splice(48, 6);
fs.writeFileSync(file, lines.join('\n'));
