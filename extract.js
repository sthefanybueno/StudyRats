const fs = require('fs');
const path = 'C:\\Users\\maria\\.gemini\\antigravity-ide\\brain\\5b7ec8c6-0f4a-4e2d-b78b-f2562c15f234\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');
for (const line of lines) {
    if (!line) continue;
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.source === 'USER_EXPLICIT') {
        fs.writeFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\first_prompt.txt', obj.content);
        break;
    }
}
console.log("Done");
