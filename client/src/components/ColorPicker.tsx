// ============================================================
// UniAgenda — Color Picker Component
// Design: Fresh Academic
// ============================================================

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const DISCIPLINA_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#84CC16', // lime
  '#14B8A6', // teal
  '#F43F5E', // rose
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export default function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DISCIPLINA_COLORS.map(color => (
        <button
          key={color}
          type="button"
          className={cn(
            "w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center",
            value === color && "ring-2 ring-offset-2 ring-slate-900 scale-110"
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        >
          {value === color && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Disciplina Color Chip
// ============================================================

interface DisciplinaChipProps {
  nome: string;
  cor: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function DisciplinaChip({ nome, cor, className, size = 'md' }: DisciplinaChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
      style={{
        backgroundColor: cor + '20',
        color: cor,
        border: `1px solid ${cor}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: cor }}
      />
      {nome}
    </span>
  );
}
