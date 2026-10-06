const fs = require('fs');
const path = 'C:\\Users\\maria\\.gemini\\antigravity-ide\\brain\\5b7ec8c6-0f4a-4e2d-b78b-f2562c15f234\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');
let contents = [];
for (const line of lines) {
    if (!line) continue;
    const obj = JSON.parse(line);
    if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                if (tc.args.TargetFile && tc.args.TargetFile.includes('apresentacao')) {
                    contents.push(JSON.stringify(tc.args));
                }
            }
        }
    }
}
fs.writeFileSync('C:\\Desenvolvimento\\MOBILE_StudyRats\\StudyRats\\found_changes.txt', contents.join('\n'));
console.log("Found " + contents.length + " changes.");
