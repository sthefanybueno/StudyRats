/** Description: Runner script for StudyRats Phase 4 presentation. */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'fase4_apresentacao.html');

if (fs.existsSync(targetPath)) {
  const stats = fs.statSync(targetPath);
  console.log(`[OK] Apresentação da Fase 4 pronta em: ${targetPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('Para apresentar, basta abrir o arquivo "fase4_apresentacao.html" em qualquer navegador web.');
} else {
  console.error('[ERRO] Arquivo fase4_apresentacao.html não encontrado.');
  process.exit(1);
}
