'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AVAILABLE_MODELS, getModelById } from '@/lib/ai-models';
import type { AIModel } from '@/types';

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const selectedModel = getModelById(selectedModelId);

  return (
    <Select
      value={selectedModelId}
      onValueChange={onModelChange}
      disabled={disabled}
    >
      <SelectTrigger className="px-3 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-400 min-w-[140px]">
        <SelectValue placeholder="Select model">
          {selectedModel?.name || 'Select model'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
