const babel = require('@babel/core');
const fs = require('fs');

const code = fs.readFileSync('apresentacao/fase2_apresentacao.html', 'utf8');
const scriptMatch = code.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (scriptMatch) {
  const jsxCode = scriptMatch[1];
  try {
    babel.transformSync(jsxCode, {
      presets: ['@babel/preset-react']
    });
    console.log("No syntax errors found!");
  } catch (e) {
    console.error("Syntax Error:", e.message);
  }
} else {
  console.log("Could not find babel script");
}
