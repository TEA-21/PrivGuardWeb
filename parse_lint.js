const fs = require('fs');
const data = JSON.parse(fs.readFileSync('eslint_report.json', 'utf8'));
const lines = [];
for (const file of data) {
  for (const msg of file.messages) {
    if (msg.ruleId === 'no-unused-vars') {
        const parts = file.filePath.split('\\');
        const fileName = parts.slice(parts.length - 2).join('/');
        lines.push(`${fileName}:${msg.line} ${msg.message}`);
    }
  }
}
fs.writeFileSync('unused.txt', lines.join('\n'));
