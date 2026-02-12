'use client';

import { useState } from 'react';
import type { CreativeZoneProps } from './editor.types';
import { ArticleEditor } from './ArticleEditor';
import { ExportDialog } from './ExportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download } from 'lucide-react';
import type { ExportFormat } from '@/types';

export function CreativeZone({
  content,
  onChange,
  onExport,
  hasWorkspace,
  articleTitle,
  onTitleChange,
}: CreativeZoneProps) {
  const [exportOpen, setExportOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setExportOpen(false);
  };

  if (!hasWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Select or create a workspace to start writing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header with Title input and Export button */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-8 py-5 dark:border-zinc-800">
        <Input
          type="text"
          value={articleTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Article"
          className="h-8 max-w-md border-none text-xl font-semibold text-zinc-900 focus-visible:ring-0 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <Button
          onClick={() => setExportOpen(true)}
          className="ml-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <ArticleEditor content={content} onChange={onChange} />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        content={content}
      />
    </div>
  );
}
