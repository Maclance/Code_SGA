/**
 * LeverOptions Component
 *
 * @module components/game/levers/LeverOptions
 * @description Selector for mutually exclusive lever options (US-035)
 */

'use client';

import React from 'react';
import type { LeverOption } from '@/lib/engine';

interface LeverOptionsProps {
    options: LeverOption[];
    selectedOptionId?: string;
    onSelect: (optionId: string) => void;
    locale?: 'fr' | 'en';
    readOnly?: boolean;
}

export function LeverOptions({
    options,
    selectedOptionId,
    onSelect,
    readOnly = false,
}: LeverOptionsProps): React.ReactElement {
    return (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {options.map((option) => {
                const isSelected = option.id === selectedOptionId;

                return (
                    <button
                        key={option.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!readOnly) onSelect(option.id);
                        }}
                        disabled={readOnly}
                        type="button"
                        className={`
                            relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 text-center h-full min-h-[60px]
                            ${isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm z-10'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                            }
                            ${readOnly ? 'opacity-70 cursor-default' : 'cursor-pointer'}
                        `}
                        title={option.meta?.description}
                    >
                        {/* Label */}
                        <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {option.label}
                        </span>

                        {/* Selected Indicator (Bottom Bar) */}
                        {isSelected && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-b-md" />
                        )}

                        {/* Checkmark for active selection */}
                        {isSelected && (
                            <div className="absolute top-1 right-1 text-indigo-600">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
