'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { ArticleEditorProps } from './editor.types';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const MenuButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      'rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800',
      active && 'bg-zinc-200 dark:bg-zinc-800'
    )}
    title={title}
  >
    {children}
  </Button>
);

const HeadingButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn(
      'rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800',
      active && 'bg-zinc-200 dark:bg-zinc-800'
    )}
    title={title}
  >
    {children}
  </Button>
);

export function ArticleEditor({
  content,
  onChange,
  placeholder = 'Start writing your article here...',
}: ArticleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const insertHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-zinc-50 px-8 py-3 dark:bg-zinc-950">
        <HeadingButton
          onClick={() => insertHeading(1)}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </HeadingButton>
        <HeadingButton
          onClick={() => insertHeading(2)}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </HeadingButton>
        <HeadingButton
          onClick={() => insertHeading(3)}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </HeadingButton>
        <Separator orientation="vertical" className="mx-2 h-4 bg-zinc-300 dark:bg-zinc-700" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <Separator orientation="vertical" className="mx-2 h-4 bg-zinc-300 dark:bg-zinc-700" />
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
        <Separator orientation="vertical" className="mx-2 h-4 bg-zinc-300 dark:bg-zinc-700" />
        <MenuButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          height: 100%;
        }
        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 2.25rem;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 2rem;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.75rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
