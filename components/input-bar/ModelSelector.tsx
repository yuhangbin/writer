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
      <SelectTrigger className="w-[180px] h-[80px] shrink-0">
        <SelectValue placeholder="Select model">
          <div className="flex flex-col items-start">
            <span className="text-xs text-zinc-500">Model</span>
            <span className="text-sm font-medium truncate">
              {selectedModel?.name || 'Select model'}
            </span>
          </div>
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
