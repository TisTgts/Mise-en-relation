import React from 'react';

/** Questions propres à une catégorie (config serveur : key, label, type, options, placeholder, help, required). */
export default function CategoryQuestions({ fields = [], values = {}, onChange, errors = {} }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {fields.map((field) => {
        const value = values?.[field.key] ?? '';
        const options =
          field.options && value && !field.options.includes(value) ? [value, ...field.options] : field.options;
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-slate-700">
              {field.label}
              {field.required && <> <span className="text-red-500">*</span></>}
            </label>
            {options ? (
              <select
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                className={`form-select ${errors[field.key] ? 'form-field-error' : ''}`}
              >
                <option value="">Choisir une réponse</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || ''}
                className={`form-input ${errors[field.key] ? 'form-field-error' : ''}`}
              />
            )}
            {errors[field.key] ? (
              <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
            ) : (
              field.help && <p className="mt-1 text-xs text-slate-500">{field.help}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
