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
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/FYP/FYP-LMS/frontend/src/pages');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // we want to find class names of inputs that have border-slate-200 and change to border-2 border-slate-300 shadow-sm
    let newContent = content.replace(/border border-slate-200/g, 'border-2 border-slate-300 shadow-sm');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log('Updated ' + path.basename(file));
    }
});
