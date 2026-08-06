const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Split by className="..."
    let newContent = content.replace(/className=\"([^\"]*)\"/g, function(match, classes) {
      if (classes.includes('text-white')) {
        // If it's a strongly colored button/badge, keep it white.
        if (classes.includes('bg-indigo') || classes.includes('bg-rose') || classes.includes('bg-emerald') || classes.includes('bg-amber') || classes.includes('bg-purple')) {
          return match;
        }
        // Otherwise, replace text-white with text-slate-100
        return 'className=\"' + classes.replace(/\btext-white\b/g, 'text-slate-100') + '\"';
      }
      return match;
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated ' + filePath);
    }
  }
});
