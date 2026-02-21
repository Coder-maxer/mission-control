import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';

export const dynamic = 'force-dynamic';

// Inside the container, the OpenClaw data volume is mounted at /openclaw-data
const WORKSPACE_ROOT = '/openclaw-data/workspace';

// Whitelist of allowed file patterns — all .md files within known directories
function isAllowedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  // Root workspace .md files (MEMORY.md, HEARTBEAT.md, SOUL.md, AGENTS.md, etc.)
  if (/^[A-Z_]+\.md$/.test(normalized)) return true;
  // memory/*.md (daily logs, drive index)
  if (/^memory\/[\w.-]+\.md$/.test(normalized)) return true;
  // agents/<name>/*.md (agent personality files)
  if (/^agents\/[\w-]+\/[\w_]+\.md$/.test(normalized)) return true;
  // agents/<name>/skills/<name>/SKILL.md
  if (/^agents\/[\w-]+\/skills\/[\w-]+\/SKILL\.md$/.test(normalized)) return true;
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

      // Root-level .md files
      const ROOT_FILES = ['MEMORY.md', 'HEARTBEAT.md', 'SOUL.md', 'IDENTITY.md', 'AGENTS.md', 'TOOLS.md', 'USER.md', 'CLAUDE.md'];
      for (const name of ROOT_FILES) {
        try {
          const s = await stat(join(WORKSPACE_ROOT, name));
          files.push({ name, size: s.size, modified: s.mtimeMs });
        } catch {
          // File doesn't exist, skip
        }
      }

      // memory/ directory (daily logs, drive index)
      try {
        const memoryDir = join(WORKSPACE_ROOT, 'memory');
        const entries = await readdir(memoryDir);
        for (const entry of entries) {
          if (entry.endsWith('.md')) {
            try {
              const s = await stat(join(memoryDir, entry));
              files.push({ name: `memory/${entry}`, size: s.size, modified: s.mtimeMs });
            } catch { /* skip */ }
          }
        }
      } catch { /* directory doesn't exist */ }

      // Agent directories
      try {
        const agentsDir = join(WORKSPACE_ROOT, 'agents');
        const agentDirs = await readdir(agentsDir);
        for (const agentName of agentDirs) {
          try {
            const agentPath = join(agentsDir, agentName);
            const agentStat = await stat(agentPath);
            if (!agentStat.isDirectory()) continue;

            const agentFiles = await readdir(agentPath);
            for (const entry of agentFiles) {
              if (entry.endsWith('.md')) {
                try {
                  const s = await stat(join(agentPath, entry));
                  files.push({
                    name: `agents/${agentName}/${entry}`,
                    size: s.size,
                    modified: s.mtimeMs,
                  });
                } catch { /* skip */ }
              }
            }
          } catch { /* skip agent dir */ }
        }
      } catch { /* agents/ doesn't exist */ }

      // Sort: root files first, then memory/, then agents/ — newest first within groups
      files.sort((a, b) => {
        const groupOrder = (name: string) => {
          if (!name.includes('/')) return 0;
          if (name.startsWith('memory/')) return 1;
          return 2;
        };
        const ga = groupOrder(a.name);
        const gb = groupOrder(b.name);
        if (ga !== gb) return ga - gb;
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
  if (!fullPath.startsWith(resolve(WORKSPACE_ROOT))) {
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
