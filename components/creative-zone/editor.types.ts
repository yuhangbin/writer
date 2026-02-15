import type { ExportFormat } from '@/types';

export interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  isPreviewMode?: boolean;
}

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
}

export interface CreativeZoneProps {
  content: string;
  onChange: (content: string) => void;
  onExport: (format: ExportFormat) => void;
  hasWorkspace: boolean;
  articleTitle: string;
  onTitleChange: (title: string) => void;
  onSave?: () => void;
}
