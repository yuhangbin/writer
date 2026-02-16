'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ExportDialogProps } from './editor.types';
import type { ExportFormat } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Check } from 'lucide-react';

export function ExportDialog({
  open,
  onOpenChange,
  content,
}: ExportDialogProps) {
  const t = useTranslations('editor.export');
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const htmlToMarkdown = useCallback((html: string): string => {
    let markdown = html;

    // Convert headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

    // Convert bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Convert line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&amp;/g, '&');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&quot;/g, '"');
    markdown = markdown.replace(/&#39;/g, "'");

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return markdown.trim();
  }, []);

  const convertContent = useCallback(
    (format: ExportFormat): string => {
      if (!content) return '';

      switch (format) {
        case 'html':
          return content;
        case 'plain':
          // Strip HTML tags for plain text
          const tmp = document.createElement('div');
          tmp.innerHTML = content;
          return tmp.textContent || tmp.innerText || '';
        case 'markdown':
          // Convert HTML to basic Markdown
          return htmlToMarkdown(content);
        default:
          return content;
      }
    },
    [content, htmlToMarkdown]
  );

  const getExportContent = useCallback(() => {
    return convertContent(activeFormat);
  }, [activeFormat, convertContent]);

  const handleCopy = useCallback(() => {
    const text = getExportContent();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getExportContent]);

  const handleDownload = useCallback(() => {
    const text = getExportContent();
    const extensions: Record<ExportFormat, string> = {
      markdown: 'md',
      html: 'html',
      plain: 'txt',
    };
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t('filename')}.${extensions[activeFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getExportContent, activeFormat, t]);

  // Reset copied state when dialog opens
  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeFormat}
          onValueChange={(v) => setActiveFormat(v as ExportFormat)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markdown">{t('markdown')}</TabsTrigger>
            <TabsTrigger value="html">{t('html')}</TabsTrigger>
            <TabsTrigger value="plain">{t('plainText')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeFormat} className="mt-4">
            <Textarea
              value={getExportContent()}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t('copiedButton')}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {t('copyButton')}
              </>
            )}
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            {t('downloadButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
