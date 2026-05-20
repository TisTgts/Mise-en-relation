import React from 'react';

/**
 * Indicateur d’étapes (inscription client / fournisseur).
 * @param {{ current: number, steps: { label: string }[] }} props
 */
const StepIndicator = ({ current, steps }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, index) => {
        const n = index + 1;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={step.label}>
            {index > 0 && (
              <div
                className={`mx-1 h-0.5 flex-1 rounded-full ${done ? 'bg-emerald-400' : 'bg-slate-200'}`}
                aria-hidden
              />
            )}
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  active
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span
                className={`hidden max-w-[5rem] truncate text-center text-[10px] font-medium sm:block ${
                  active ? 'text-indigo-700' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
    <p className="mt-3 text-center text-xs text-slate-500 sm:hidden">
      Étape {current} sur {steps.length} — {steps[current - 1]?.label}
    </p>
  </div>
);

export default StepIndicator;
