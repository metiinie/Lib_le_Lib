const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'backend', 'test');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

for (const file of files) {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to ensure that `if (app) { await app.close(); }` runs even if teardown queries fail.
  // A simple way is to use a regex to wrap the body of afterAll in try/finally
  // but regex on JS AST is hard.
  // Instead, let's just make sure `if (app) { await app.close(); }` is replaced by `finally { if (app) await app.close(); }`
  // Actually, we can just replace the whole afterAll(async () => { ... })
  // For safety, let's just use `npm i -g jscodeshift`? No, let's use regex that wraps everything between afterAll(async () => { and if (app) { await app.close(); } }
  
  // Actually, I can just replace `if (app) { await app.close(); }` with `} catch (e) { console.error(e); } finally { if (app) { await app.close(); } }`
  // And replace `afterAll(async () => {` with `afterAll(async () => { try {`
  
  let newContent = content.replace(/afterAll\(async \(\) => \{/g, 'afterAll(async () => {\n    try {');
  newContent = newContent.replace(/if \(app\) \{ await app\.close\(\); \}/g, '} catch(e) { console.error("Teardown error:", e); } finally { if (app) { await app.close(); } }');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Wrapped afterAll in try/finally for ${file}`);
  }
}
