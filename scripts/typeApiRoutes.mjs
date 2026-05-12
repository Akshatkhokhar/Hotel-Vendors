import fs from 'fs/promises';
import path from 'path';

async function walk(dir, callback) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = await fs.stat(filepath);
    if (stats.isDirectory()) {
      await walk(filepath, callback);
    } else if (filepath.endsWith('.ts')) {
      await callback(filepath);
    }
  }
}

async function processAPI() {
  await walk('app/api', async (filepath) => {
    let content = await fs.readFile(filepath, 'utf8');
    
    // Check if it already has NextRequest import
    if (!content.includes('import type { NextRequest }')) {
      content = `import type { NextRequest } from 'next/server'\n` + content;
    }
    
    // Determine dynamic param type from filepath
    let dynamicParam = null;
    if (filepath.includes('[slug]')) dynamicParam = 'slug';
    if (filepath.includes('[id]')) dynamicParam = 'id';

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      // With params: export async function GET(request, { params }) {
      const regexParams = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*request\\s*,\\s*\\{\\s*params\\s*\\}\\s*\\)\\s*\\{`, 'g');
      if (dynamicParam) {
        content = content.replace(regexParams, `export async function ${method}(request: NextRequest, { params }: { params: { ${dynamicParam}: string } }): Promise<NextResponse> {`);
      }

      // With params but maybe 'req' instead of 'request': export async function GET(req, { params }) {
      const regexParamsReq = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req\\s*,\\s*\\{\\s*params\\s*\\}\\s*\\)\\s*\\{`, 'g');
      if (dynamicParam) {
        content = content.replace(regexParamsReq, `export async function ${method}(req: NextRequest, { params }: { params: { ${dynamicParam}: string } }): Promise<NextResponse> {`);
      }

      // Without params: export async function GET(request) {
      const regexNoParams = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*request\\s*\\)\\s*\\{`, 'g');
      content = content.replace(regexNoParams, `export async function ${method}(request: NextRequest): Promise<NextResponse> {`);

      // Without params 'req': export async function GET(req) {
      const regexNoParamsReq = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req\\s*\\)\\s*\\{`, 'g');
      content = content.replace(regexNoParamsReq, `export async function ${method}(req: NextRequest): Promise<NextResponse> {`);
      
      // Without any arguments: export async function GET() {
      const regexNoArgs = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*\\)\\s*\\{`, 'g');
      content = content.replace(regexNoArgs, `export async function ${method}(): Promise<NextResponse> {`);
    }

    // if it uses NextResponse but doesn't import it, maybe it's already imported. Wait, if we use Promise<NextResponse> we need NextResponse imported.
    // Let's import NextResponse if not present. Actually, we use NextResponse as a type here, so importing it is required.
    // If we only need it for types, `import { NextResponse }` might already be there. If not, typescript will complain and we will fix it.
    
    await fs.writeFile(filepath, content);
    console.log(`Processed ${filepath}`);
  });
}

processAPI();
