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
    <div className="flex h-full flex-col">
      {/* Header with Title input and Export button */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Input
          type="text"
          value={articleTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Article"
          className="h-8 max-w-md border-none text-lg font-semibold text-zinc-900 focus-visible:ring-0 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportOpen(true)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
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
