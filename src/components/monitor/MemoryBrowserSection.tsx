'use client';

import { useEffect, useState, useCallback } from 'react';
import { Brain, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import SectionCard from './SectionCard';

interface MemoryFile {
  name: string;
  size: number;
  modified: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MemoryBrowserSection() {
  const [files, setFiles] = useState<MemoryFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const res = await fetch('/api/monitor/memory');
      const json = await res.json();
      if (json.files) {
        setFiles(json.files);
        // Auto-select MEMORY.md if nothing selected
        if (!selectedFile && json.files.length > 0) {
          const memoryMd = json.files.find(
            (f: MemoryFile) => f.name === 'MEMORY.md'
          );
          if (memoryMd) {
            setSelectedFile(memoryMd.name);
          }
        }
      }
    } catch {
      setError('Failed to load file list');
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedFile]);

  const fetchContent = useCallback(async (fileName: string) => {
    try {
      setLoadingContent(true);
      setError(null);
      const res = await fetch(
        `/api/monitor/memory?file=${encodeURIComponent(fileName)}`
      );
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setContent(null);
      } else {
        setContent(json.content);
      }
    } catch {
      setError('Failed to load file');
      setContent(null);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    if (selectedFile) {
      fetchContent(selectedFile);
    }
  }, [selectedFile, fetchContent]);

  return (
    <SectionCard
      title="Memory Browser"
      icon={<Brain />}
      count={files.length || undefined}
      actions={
        <button
          onClick={fetchFiles}
          className="text-mc-text-secondary hover:text-mc-text cursor-pointer transition-colors p-1"
          title="Refresh file list"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex min-h-[200px] max-h-[500px]">
        {/* File list sidebar */}
        <div className="w-56 border-r border-mc-border overflow-y-auto flex-shrink-0">
          {loadingFiles ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded bg-mc-bg-tertiary animate-pulse"
                />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="p-4 text-xs text-mc-text-secondary text-center">
              No memory files found
            </div>
          ) : (
            <div className="py-1">
              {files.map((file) => {
                const isSelected = selectedFile === file.name;
                const isDaily = file.name.startsWith('memory/');
                const displayName = isDaily
                  ? file.name.replace('memory/', '').replace('.md', '')
                  : file.name;

                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file.name)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-mc-accent/10 text-mc-accent'
                        : 'text-mc-text-secondary hover:bg-mc-bg-tertiary hover:text-mc-text'
                    }`}
                  >
                    <ChevronRight
                      className={`w-3 h-3 flex-shrink-0 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`}
                    />
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] opacity-60">
                        {formatSize(file.size)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content viewer */}
        <div className="flex-1 overflow-auto">
          {!selectedFile ? (
            <div className="flex items-center justify-center h-full text-mc-text-secondary text-sm">
              Select a file to view
            </div>
          ) : loadingContent ? (
            <div className="p-4 space-y-2">
              <div className="h-3 w-3/4 rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-3 w-full rounded bg-mc-bg-tertiary animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-mc-bg-tertiary animate-pulse" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-mc-accent-red text-sm">
              {error}
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-mc-text-secondary">
                  {selectedFile}
                </span>
                <span className="text-[10px] text-mc-text-secondary/60">
                  {files.find((f) => f.name === selectedFile)
                    ? formatDate(
                        files.find((f) => f.name === selectedFile)!.modified
                      )
                    : ''}
                </span>
              </div>
              <pre className="text-xs text-mc-text font-mono whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
