const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const cssFiles = walk('c:\\Users\\ivika\\Downloads\\AR Collections Agent\\app\\src');

cssFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    if (content.includes('background: white')) {
        content = content.replace(/background:\s*white;?/g, 'background: var(--bg-surface);');
        changed = true;
    }
    if (content.includes('background: #fff')) {
        content = content.replace(/background:\s*#fff;?/g, 'background: var(--bg-surface);');
        changed = true;
    }
    if (content.includes('background-color: white')) {
        content = content.replace(/background-color:\s*white;?/g, 'background-color: var(--bg-surface);');
        changed = true;
    }
    if (content.includes('background-color: #fff')) {
        content = content.replace(/background-color:\s*#fff;?/g, 'background-color: var(--bg-surface);');
        changed = true;
    }
    
    // Also change dark text that might be hardcoded
    if (content.includes('color: #0f172a')) {
        content = content.replace(/color:\s*#0f172a;?/g, 'color: var(--text-primary);');
        changed = true;
    }
    if (content.includes('color: #475569')) {
        content = content.replace(/color:\s*#475569;?/g, 'color: var(--text-secondary);');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
});

console.log("CSS Hardcoded Colors Replaced.");
