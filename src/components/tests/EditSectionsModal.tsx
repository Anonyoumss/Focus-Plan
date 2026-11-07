/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TRANSLATIONS } from '../../i18n/translations';
import { TestSection, UserTestGoal, StandardizedTestDefinition } from '../../data/tests/catalog';
import { MaterialIcon } from '../common/MaterialIcon';
import { MdDialog } from '../common/MdControls';
import { validateTestSections, sectionIdFromName, resolveGoalSections } from '../../lib/testSections';

interface EditSectionsModalProps {
  goal: UserTestGoal;
  definition: StandardizedTestDefinition | undefined;
  onClose: () => void;
}

export const EditSectionsModal: React.FC<EditSectionsModalProps> = ({ goal, definition, onClose }) => {
  const { locale, updateTestGoal } = useAppStore();
  const t = TRANSLATIONS[locale];
  const isAr = locale === 'ar';

  const [sections, setSections] = useState<TestSection[]>(() =>
    resolveGoalSections(goal, definition).map((s) => ({ ...s }))
  );
  const [error, setError] = useState<string | null>(null);

  const update = (idx: number, patch: Partial<TestSection>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    setError(null);
  };

  const remove = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    setError(null);
  };

  const add = () => {
    setSections((prev) => [
      ...prev,
      {
        id: sectionIdFromName(`section_${prev.length + 1}`),
        nameEn: isAr ? 'New Section' : 'New Section',
        nameAr: 'قسم جديد',
        minScore: 0,
        maxScore: 100,
        defaultTargetScore: 50,
      },
    ]);
    setError(null);
  };

  const save = () => {
    const { ok } = validateTestSections(sections);
    if (!ok) {
      setError(isAr ? 'تحقق من القيم: الحد الأدنى أقل من الأقصى، والهدف ضمن النطاق، والأسماء غير فارغة.' : 'Check values: min must be below max, target within range, names non-empty.');
      return;
    }
    updateTestGoal(goal.id, {
      customSections: sections,
      // Re-key section targets for renamed/removed sections, keeping valid ones.
      sectionTargets: Object.fromEntries(
        sections
          .map((s) => [s.id, goal.sectionTargets[s.id] ?? s.defaultTargetScore])
          .filter(([, v]) => typeof v === 'number')
      ),
    });
    onClose();
  };

  const reset = () => {
    if (definition?.sections) {
      setSections(definition.sections.map((s) => ({ ...s })));
      setError(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--md-sys-color-surface-container)',
    borderColor: 'var(--md-sys-color-outline-variant)',
    color: 'var(--md-sys-color-on-surface)',
  };

  return (
    <MdDialog open onClose={onClose} label={isAr ? 'تحرير الأقسام' : 'Edit sections'}>
      <div slot="content" className="p-5 space-y-3 max-h-[70vh] overflow-y-auto" style={{ minWidth: 'min(92vw, 480px)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: 'var(--md-sys-color-on-surface)' }}>
            {isAr ? 'أقسام الاختبار' : 'Test sections'}
          </h3>
          <button onClick={add} className="text-xs font-semibold flex items-center gap-1 cursor-pointer" style={{ color: 'var(--md-sys-color-primary)' }}>
            <MaterialIcon name="add" size={14} /> {isAr ? 'إضافة قسم' : 'Add section'}
          </button>
        </div>

        {sections.map((sec, idx) => (
          <div key={`${sec.id}-${idx}`} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center p-2 rounded-xl border" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
            <input
              value={sec.nameEn}
              onChange={(e) => update(idx, { nameEn: e.target.value })}
              placeholder={isAr ? 'الاسم (EN)' : 'Name (EN)'}
              className="col-span-2 sm:col-span-1 px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
              maxLength={120}
            />
            <input
              value={sec.nameAr}
              onChange={(e) => update(idx, { nameAr: e.target.value })}
              placeholder={isAr ? 'الاسم (AR)' : 'Name (AR)'}
              className="col-span-2 sm:col-span-1 px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
              maxLength={120}
            />
            <input
              type="number"
              value={sec.minScore}
              onChange={(e) => update(idx, { minScore: Number(e.target.value) })}
              placeholder="min"
              className="px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
            />
            <input
              type="number"
              value={sec.maxScore}
              onChange={(e) => update(idx, { maxScore: Number(e.target.value) })}
              placeholder="max"
              className="px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
            />
            <input
              type="number"
              value={sec.defaultTargetScore}
              onChange={(e) => update(idx, { defaultTargetScore: Number(e.target.value) })}
              placeholder={isAr ? 'الهدف' : 'target'}
              className="px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={inputStyle}
            />
            <button
              onClick={() => remove(idx)}
              aria-label={isAr ? 'حذف القسم' : 'Remove section'}
              className="justify-self-end p-1.5 rounded-lg cursor-pointer"
              style={{ color: 'var(--md-sys-color-error)' }}
            >
              <MaterialIcon name="delete" size={16} />
            </button>
          </div>
        ))}

        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-error)' }} role="alert">{error}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}>
          <button onClick={reset} className="text-xs cursor-pointer" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {isAr ? 'استعادة أقسام الكتالوج' : 'Restore catalog sections'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer" style={{ borderColor: 'var(--md-sys-color-outline-variant)', color: 'var(--md-sys-color-on-surface)' }}>
              {t.tasks.cancel}
            </button>
            <button onClick={save} className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer" style={{ backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' }}>
              {t.tasks.save}
            </button>
          </div>
        </div>
      </div>
    </MdDialog>
  );
};
