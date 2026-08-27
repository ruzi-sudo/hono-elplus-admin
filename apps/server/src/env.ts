import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

function findWorkspaceEnv(startDir: string): string | null {
  let currentDir = startDir;
  const rootDir = parse(currentDir).root;
  const envFileNames =
    !process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? ['.env.dev', '.env'] : ['.env'];

  while (true) {
    for (const envFileName of envFileNames) {
      const envPath = join(currentDir, envFileName);
      if (existsSync(envPath)) return envPath;
    }
    if (currentDir === rootDir) return null;
    currentDir = dirname(currentDir);
  }
}

const envPath = findWorkspaceEnv(process.cwd());

if (envPath) {
  process.loadEnvFile(envPath);
}
