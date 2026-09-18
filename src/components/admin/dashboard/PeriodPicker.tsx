import { PERIOD_PRESETS, type PeriodFilter, type PeriodPreset } from "../../../lib/dateRanges";

interface PeriodPickerProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  function handlePresetChange(preset: PeriodPreset) {
    if (preset === "personalizado") {
      const today = new Date().toISOString().slice(0, 10);
      onChange({ preset, from: value.from ?? today, to: value.to ?? today });
      return;
    }
    onChange({ preset });
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <select
        value={value.preset}
        onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)}
        className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
      >
        {PERIOD_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {value.preset === "personalizado" && (
        <>
          <input
            type="date"
            value={value.from ?? ""}
            max={value.to}
            onChange={(e) => {
              const from = e.target.value;
              onChange({ ...value, from, to: value.to && value.to < from ? from : value.to });
            }}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
          />
          <span className="text-sm text-neutral-400">até</span>
          <input
            type="date"
            value={value.to ?? ""}
            min={value.from}
            onChange={(e) => {
              const to = e.target.value;
              onChange({ ...value, to, from: value.from && value.from > to ? to : value.from });
            }}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-ink"
          />
        </>
      )}
    </div>
  );
}
