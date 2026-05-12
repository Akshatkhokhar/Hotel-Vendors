import fs from 'fs/promises';
import path from 'path';

async function walk(dir, callback) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = await fs.stat(filepath);
    if (stats.isDirectory()) {
      await walk(filepath, callback);
    } else if (filepath.endsWith('.js')) {
      await callback(filepath);
    }
  }
}

async function renameJS() {
  const dirs = ['lib', 'app/api', 'scripts'];
  for (const dir of dirs) {
    try {
      await walk(dir, async (filepath) => {
        const newpath = filepath.slice(0, -3) + '.ts';
        await fs.rename(filepath, newpath);
        console.log(`Renamed ${filepath} -> ${newpath}`);
      });
    } catch (e) {
      console.log(`Error walking ${dir}:`, e.message);
    }
  }
  
  if (await fs.stat('middleware.js').catch(()=>false)) {
    await fs.rename('middleware.js', 'middleware.ts');
    console.log(`Renamed middleware.js -> middleware.ts`);
  }
}

renameJS();
