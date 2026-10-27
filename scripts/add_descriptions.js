/** Description: This file (scripts/add_descriptions.js) contains the implementation for its respective feature. */
// add_descriptions.js
// Script to prepend a short description comment to each source code file in the project.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const exts = ['.js', '.ts', '.tsx', '.jsx'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and hidden folders
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(fullPath);
    } else if (exts.includes(path.extname(entry.name))) {
      // Read existing content
      const content = fs.readFileSync(fullPath, 'utf8');
      // If already has our marker, skip
      if (content.startsWith('/** Description:')) continue;
      const relative = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
      const description = `/** Description: This file (${relative}) contains the implementation for its respective feature. */\n`;
      fs.writeFileSync(fullPath, description + content, 'utf8');
      console.log('Updated', relative);
    }
  }
}

walk(projectRoot);
console.log('All source files have been processed.');
