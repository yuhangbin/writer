'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading?: boolean;
  maxLength?: number;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
}

const MAX_LENGTH = 2000;

export function InputBar({
  value,
  onChange,
  onGenerate,
  isLoading = false,
  maxLength = MAX_LENGTH,
  selectedModelId,
  onModelChange,
}: InputBarProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        setLocalValue(newValue);
        onChange(newValue);
      }
    },
    [onChange, maxLength]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onGenerate();
      }
    },
    [onGenerate]
  );

  const handleGenerate = useCallback(() => {
    if (localValue.trim()) {
      onGenerate();
    }
  }, [localValue, onGenerate]);

  const canGenerate = localValue.trim().length > 0 && !isLoading;

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Compact horizontal bar */}
      <div className="flex items-end gap-2 p-3 rounded-xl border border-zinc-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-zinc-900 focus-within:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-zinc-400 dark:focus-within:border-zinc-400 transition-all">
        {/* Textarea */}
        <Textarea
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to write? (⌘+Enter)"
          className="flex-1 min-h-[60px] max-h-[200px] p-2 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
          disabled={isLoading}
          maxLength={maxLength}
        />

        {/* Model Selector */}
        {selectedModelId && onModelChange && (
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            disabled={isLoading}
          />
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          title="Generate (⌘+Enter)"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Press ⌘+Enter to generate</p>
    </div>
  );
}
