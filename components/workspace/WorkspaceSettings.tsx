'use client';

import { useState, useEffect } from 'react';
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
      name: name.trim() || 'Untitled Workspace',
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
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Configure your workspace settings to help the AI understand your
            target audience and writing style.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Tech Blog"
              maxLength={100}
            />
          </div>

          {/* Target Reader */}
          <div className="space-y-2">
            <Label htmlFor="target-reader">Target Reader</Label>
            <Textarea
              id="target-reader"
              value={targetReader}
              onChange={(e) => setTargetReader(e.target.value)}
              placeholder="Describe your target audience... e.g., Software engineers interested in web development"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-zinc-500">
              {targetReader.length}/500 characters
            </p>
          </div>

          {/* Reference Example */}
          <div className="space-y-2">
            <Label htmlFor="reference-example">Reference Example</Label>
            <Textarea
              id="reference-example"
              value={referenceExample}
              onChange={(e) => setReferenceExample(e.target.value)}
              placeholder="Provide an example of your writing style or a reference article..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-zinc-500">
              {referenceExample.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Workspace creation info */}
        {workspace && (
          <div className="flex items-center justify-start pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              Created {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'Unknown'}
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
                if (confirm(`Are you sure you want to delete "${workspace.name}"?`)) {
                  onDeleteWorkspace(workspace.id);
                  onOpenChange(false);
                }
              }}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete Workspace
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
