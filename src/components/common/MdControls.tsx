import React, { useEffect, useRef } from 'react';

interface MdSwitchProps {
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  label?: string;
  className?: string;
}

/** Thin React wrapper around <md-switch> (property is `selected`, event is `change`). */
export const MdSwitch: React.FC<MdSwitchProps> = ({ selected, onSelectedChange, label, className }) => {
  const ref = useRef<HTMLElement & { selected: boolean }>(null);

  useEffect(() => {
    if (ref.current) ref.current.selected = selected;
  }, [selected]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onSelectedChange(el.selected);
    el.addEventListener('change', handler);
    return () => el.removeEventListener('change', handler);
  }, [onSelectedChange]);

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className ?? ''}`}>
      <md-switch ref={ref as any} aria-label={label} />
      {label && <span>{label}</span>}
    </label>
  );
};

interface MdSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  label?: string;
  className?: string;
}

/** Thin React wrapper around <md-slider>. */
export const MdSlider: React.FC<MdSliderProps> = ({ value, min, max, step, onValueChange, label, className }) => {
  const ref = useRef<HTMLElement & { value: number }>(null);

  useEffect(() => {
    if (ref.current) ref.current.value = value;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onValueChange(el.value);
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
    return () => {
      el.removeEventListener('input', handler);
      el.removeEventListener('change', handler);
    };
  }, [onValueChange]);

  return (
    <md-slider ref={ref as any} min={min} max={max} step={step} aria-label={label} className={className} />
  );
};

interface MdDialogProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}

/** Thin React wrapper around <md-dialog>. The element owns the scrim and panel. */
export const MdDialog: React.FC<MdDialogProps> = ({ open, onClose, label, children }) => {
  const ref = useRef<HTMLElement & { open: boolean }>(null);

  useEffect(() => {
    if (ref.current) ref.current.open = open;
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  if (!open) return null;
  return (
    <md-dialog ref={ref as any} aria-label={label}>
      <div slot="content" className="contents">
        {children}
      </div>
    </md-dialog>
  );
};
