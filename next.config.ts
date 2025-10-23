import type { NextConfig } from 'next';
import fs from 'fs';
import path from 'path';

// Copy WASM files from node_modules to public directory
function copyWasmFiles() {
  const sourceDir = path.join(process.cwd(), 'node_modules/@unit-mesh/treesitter-artifacts/wasm');
  const targetDir = path.join(process.cwd(), 'public/wasm');

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy all WASM files
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    files.forEach((file) => {
      if (file.endsWith('.wasm')) {
        const source = path.join(sourceDir, file);
        const target = path.join(targetDir, file);
        fs.copyFileSync(source, target);
        console.log(`Copied ${file} to public/wasm/`);
      }
    });
  }
}

// Run on build
if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
  copyWasmFiles();
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
