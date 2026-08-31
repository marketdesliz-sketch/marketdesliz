const fs = require('fs');
const path = require('path');

function scanDir(dir, prefix = '', exclude = [
    'node_modules', '.git', 'dist', 'build', '.next',
    'pb_data', 'pb_hooks', 'pb_migrations',  // 👈 Excluye PocketBase
    'storage', 'backups', '__pycache__', '.cache'
]) {
    if (!fs.existsSync(dir)) return;
    
    let items = fs.readdirSync(dir);
    
    // Filtrar archivos vacíos y excluidos
    items = items.filter(item => {
        if (exclude.includes(item)) return false;
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) return true;
        return fs.statSync(fullPath).size > 0;
    });
    
    items.sort((a, b) => {
        const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
    });
    
    items.forEach((item, index) => {
        const fullPath = path.join(dir, item);
        const isLast = index === items.length - 1;
        const isDir = fs.statSync(fullPath).isDirectory();
        
        // Iconos diferentes según tipo
        let icon = isDir ? '📁' : '📄';
        if (item === 'src') icon = '🎯';
        if (item === 'pages') icon = '🌐';
        if (item === 'components') icon = '🧩';
        if (item === 'lib') icon = '⚙️';
        if (item === 'hooks') icon = '🪝';
        if (item === 'styles') icon = '🎨';
        
        console.log(`${prefix}${isLast ? '└── ' : '├── '}${icon} ${item}`);
        
        if (isDir) {
            scanDir(fullPath, prefix + (isLast ? '    ' : '│   '), exclude);
        }
    });
}

console.log('📁 ESTRUCTURA LIMPIA DEL PROYECTO\n');
console.log('🎯 ' + path.basename(process.cwd()) + '/\n');
scanDir(process.cwd());