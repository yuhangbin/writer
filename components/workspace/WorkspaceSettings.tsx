'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { Workspace } from '@/types';
import type { WorkspaceSettingsProps } from './workspace.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

export function WorkspaceSettings({
  workspace,
  open,
  onOpenChange,
  onSave,
  onDeleteWorkspace,
}: WorkspaceSettingsProps) {
  const t = useTranslations('workspace.settings');
  const [name, setName] = useState('');
  const [targetReader, setTargetReader] = useState('');
  const [referenceExample, setReferenceExample] = useState('');

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setTargetReader(workspace.targetReader || '');
      setReferenceExample(workspace.referenceExample || '');
    }
  }, [workspace]);

  const handleSave = () => {
    if (!workspace) return;

    const updatedWorkspace: Workspace = {
      ...workspace,
      name: name.trim() || t('untitledWorkspace'),
      targetReader: targetReader.trim() || null,
      referenceExample: referenceExample.trim() || null,
      updatedAt: new Date(),
    };

    onSave(updatedWorkspace);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="workspace-name">{t('name')}</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={100}
            />
          </div>

          {/* Target Reader */}
          <div className="space-y-2">
            <Label htmlFor="target-reader">{t('targetReader')}</Label>
            <Textarea
              id="target-reader"
              value={targetReader}
              onChange={(e) => setTargetReader(e.target.value)}
              placeholder={t('targetReaderPlaceholder')}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-zinc-500">
              {t('targetReaderLimit', { count: targetReader.length })}
            </p>
          </div>

          {/* Reference Example */}
          <div className="space-y-2">
            <Label htmlFor="reference-example">{t('referenceExample')}</Label>
            <Textarea
              id="reference-example"
              value={referenceExample}
              onChange={(e) => setReferenceExample(e.target.value)}
              placeholder={t('referenceExamplePlaceholder')}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-zinc-500">
              {t('referenceExampleLimit', { count: referenceExample.length })}
            </p>
          </div>
        </div>

        {/* Workspace creation info */}
        {workspace && (
          <div className="flex items-center justify-start pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              {t('createdLabel', {
                date: workspace.createdAt
                  ? new Date(workspace.createdAt).toLocaleDateString()
                  : t('createdUnknown')
              })}
            </span>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          {workspace && onDeleteWorkspace && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (confirm(t('deleteConfirm', { name: workspace.name }))) {
                  onDeleteWorkspace(workspace.id);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              {t('deleteButton')}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              {t('cancelButton')}
            </Button>
            <Button onClick={handleSave}>{t('saveButton')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
