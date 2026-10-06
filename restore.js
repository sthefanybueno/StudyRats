const fs = require('fs');
const content = fs.readFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\found_changes.txt', 'utf8').split('\n');
const firstChange = JSON.parse(content[0]);
let htmlCode = firstChange.CodeContent;
if (htmlCode.startsWith('"') && htmlCode.endsWith('"')) {
    htmlCode = JSON.parse(htmlCode);
}
fs.writeFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\apresentacao\\fase2_apresentacao.html', htmlCode);
console.log("Restored fase2_apresentacao.html");
