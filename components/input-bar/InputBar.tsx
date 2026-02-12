'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, X } from 'lucide-react';
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

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

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
    <div className="flex flex-col gap-3 p-4">
      {/* Visual wrapper for unified appearance */}
      <div className="flex items-end gap-2 rounded-lg border border-zinc-300 bg-white p-2 shadow-sm transition-shadow duration-200 focus-within:border-zinc-400 focus-within:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
        {/* Textarea */}
        <div className="flex-1">
          <Textarea
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your writing prompt here... (⌘+Enter to generate)"
            className="min-h-[80px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            maxLength={maxLength}
          />
        </div>

        {/* Model Selector */}
        {selectedModelId && onModelChange && (
          <ModelSelector
            selectedModelId={selectedModelId}
            onModelChange={onModelChange}
            disabled={isLoading}
          />
        )}

        {/* Button Group */}
        <div className="flex gap-1">
          {localValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={isLoading}
              className="h-[80px] w-[80px] shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Clear input"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="h-[80px] w-[80px] shrink-0 bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
            title="Generate content"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Character count and keyboard shortcut hint */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <p>
          {localValue.length}/{maxLength} characters
        </p>
        <p>Press ⌘+Enter to generate</p>
      </div>
    </div>
  );
}
