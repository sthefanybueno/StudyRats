const fs = require('fs');
const content = fs.readFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\found_changes.txt', 'utf8').split('\n');
const firstChange = JSON.parse(content[0]);
let htmlCode = firstChange.CodeContent;
if (typeof htmlCode === 'string') {
    if (htmlCode.startsWith('"')) {
        // manually unescape
        htmlCode = htmlCode.slice(1, -1)
            .replace(/\\\\/g, '\\')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"');
    }
}
fs.writeFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\apresentacao\\fase2_apresentacao.html', htmlCode);
console.log("Restored properly!");
