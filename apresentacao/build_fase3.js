/** Description: Runner script for StudyRats Phase 3 presentation. */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'fase3_apresentacao.html');

if (fs.existsSync(targetPath)) {
  const stats = fs.statSync(targetPath);
  console.log(`[OK] Apresentação da Fase 3 pronta em: ${targetPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log('Para apresentar, basta abrir o arquivo "fase3_apresentacao.html" em qualquer navegador web.');
} else {
  console.error('[ERRO] Arquivo fase3_apresentacao.html não encontrado.');
  process.exit(1);
}
