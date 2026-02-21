import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

export const dynamic = 'force-dynamic';

const WORKSPACE_ROOT =
  '/var/lib/docker/volumes/open-claw-openclaw-kttly8_openclaw-data/_data/workspace';

// Whitelist of allowed file patterns
function isAllowedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  // MEMORY.md or HEARTBEAT.md at root
  if (normalized === 'MEMORY.md' || normalized === 'HEARTBEAT.md') return true;
  // memory/*.md (daily logs)
  if (/^memory\/[\w-]+\.md$/.test(normalized)) return true;
  return false;
}

// GET /api/monitor/memory?file=MEMORY.md
// GET /api/monitor/memory (lists available files)
export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file');

  if (!file) {
    // List available memory files
    try {
      const files: { name: string; size: number; modified: number }[] = [];

      // Check root-level files
      for (const name of ['MEMORY.md', 'HEARTBEAT.md']) {
        try {
          const fullPath = join(WORKSPACE_ROOT, name);
          const s = await stat(fullPath);
          files.push({ name, size: s.size, modified: s.mtimeMs });
        } catch {
          // File doesn't exist, skip
        }
      }

      // Check memory/ directory for daily logs
      try {
        const memoryDir = join(WORKSPACE_ROOT, 'memory');
        const entries = await readdir(memoryDir);
        for (const entry of entries) {
          if (entry.endsWith('.md')) {
            const relPath = `memory/${entry}`;
            try {
              const fullPath = join(memoryDir, entry);
              const s = await stat(fullPath);
              files.push({ name: relPath, size: s.size, modified: s.mtimeMs });
            } catch {
              // Skip unreadable files
            }
          }
        }
      } catch {
        // memory/ directory doesn't exist
      }

      // Sort: root files first, then daily logs newest first
      files.sort((a, b) => {
        const aIsRoot = !a.name.includes('/');
        const bIsRoot = !b.name.includes('/');
        if (aIsRoot && !bIsRoot) return -1;
        if (!aIsRoot && bIsRoot) return 1;
        return b.modified - a.modified;
      });

      return NextResponse.json({ files });
    } catch (error) {
      console.error('Memory list error:', error);
      return NextResponse.json(
        { error: 'Failed to list memory files' },
        { status: 500 }
      );
    }
  }

  // Read a specific file
  if (!isAllowedPath(file)) {
    return NextResponse.json(
      { error: 'File not allowed' },
      { status: 403 }
    );
  }

  // Prevent directory traversal
  const fullPath = resolve(join(WORKSPACE_ROOT, file));
  if (!fullPath.startsWith(WORKSPACE_ROOT)) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 403 }
    );
  }

  try {
    const content = await readFile(fullPath, 'utf-8');
    return NextResponse.json({ file, content });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    console.error('Memory read error:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
