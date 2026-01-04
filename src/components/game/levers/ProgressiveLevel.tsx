/**
 * ProgressiveLevel Component
 *
 * @module components/game/levers/ProgressiveLevel
 * @description Selector for progressive lever levels (US-035)
 */

'use client';

import React from 'react';
import type {
    LeverLevel,
    ActiveLeversState,
    LevelStatus,
    IndicesState
} from '@/lib/engine';
import {
    getLevelStatus,
    getLevelMissingPrerequisites
} from '@/lib/engine';

interface ProgressiveLevelProps {
    leverId: string;
    levels: Record<string, LeverLevel>;
    activeLevers: ActiveLeversState;
    selectedLevelId?: string;
    indices?: IndicesState;
    onSelectLevel: (levelId: string) => void;
    locale?: 'fr' | 'en';
    readOnly?: boolean;
}

const levelTranslations = {
    fr: {
        cost: 'Coût',
        acquired: 'Acquis',
        available: 'Disponible',
        selected: 'Sélectionné',
        locked: 'Verrouillé',
        missingReqs: 'Prérequis manquants :'
    },
    en: {
        cost: 'Cost',
        acquired: 'Acquired',
        available: 'Available',
        selected: 'Selected',
        locked: 'Locked',
        missingReqs: 'Missing prerequisites:'
    }
};

export function ProgressiveLevel({
    leverId,
    levels,
    activeLevers,
    selectedLevelId,
    indices,
    onSelectLevel,
    locale = 'fr',
    readOnly = false,
}: ProgressiveLevelProps): React.ReactElement {
    const t = levelTranslations[locale];

    // Sort levels by ID (assuming N1, N2, N3...)
    const sortedLevels = Object.values(levels).sort((a, b) => a.id.localeCompare(b.id));

    return (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
            {sortedLevels.map((level) => {
                const status: LevelStatus = getLevelStatus(leverId, level.id, activeLevers, level, indices);
                const isLocked = status === 'locked';
                const isAcquired = status === 'acquired';
                const isSelected = level.id === selectedLevelId;

                // Determine styling based on status
                let cardStyle = '';

                if (isAcquired) {
                    cardStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                } else if (isSelected) {
                    cardStyle = 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 text-indigo-900';
                } else if (isLocked) {
                    cardStyle = 'bg-slate-50 border-slate-200 border-dashed text-slate-400 opacity-60';
                } else {
                    cardStyle = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-md';
                }

                // Tooltip content for locked levels
                const missingReqs = isLocked
                    ? getLevelMissingPrerequisites(level, activeLevers, indices)
                    : [];

                return (
                    <div key={level.id} className="relative group flex-shrink-0" style={{ minWidth: '140px', maxWidth: '180px' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!readOnly && !isLocked && !isAcquired) {
                                    onSelectLevel(level.id);
                                }
                            }}
                            disabled={readOnly || isLocked || isAcquired}
                            className={`
                                w-full text-left p-3 rounded-lg border-2 transition-all h-full
                                flex flex-col
                                ${cardStyle}
                                ${(!readOnly && !isLocked && !isAcquired) ? 'cursor-pointer' : 'cursor-default'}
                            `}
                            type="button"
                            aria-label={`${level.id} - ${isAcquired ? t.acquired : isSelected ? t.selected : isLocked ? t.locked : t.available}`}
                        >
                            {/* Header with Level ID and Status Icon */}
                            <div className="flex justify-between items-center w-full mb-2">
                                <span className="font-bold text-base">{level.id}</span>
                                {isAcquired && <span className="text-emerald-600 text-lg">✓</span>}
                                {isSelected && <span className="text-indigo-600 text-lg">✓</span>}
                                {isLocked && <span className="text-slate-400">🔒</span>}
                            </div>

                            {/* Description */}
                            <p className="text-xs leading-relaxed mb-3 line-clamp-2 flex-grow" title={level.description}>
                                {level.description}
                            </p>

                            {/* Cost Footer */}
                            <div className="text-sm font-semibold mt-auto pt-2 border-t border-current/10">
                                {isAcquired ? (
                                    <span className="text-emerald-600">{t.acquired}</span>
                                ) : isSelected ? (
                                    <span className="text-indigo-600">{t.selected}</span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        💰 {level.cost.budgetUnits}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Tooltip for locked levels */}
                        {isLocked && missingReqs.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                <p className="font-bold mb-1">{t.missingReqs}</p>
                                <ul className="list-disc pl-3 space-y-1">
                                    {missingReqs.map((req, idx) => (
                                        <li key={idx}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
