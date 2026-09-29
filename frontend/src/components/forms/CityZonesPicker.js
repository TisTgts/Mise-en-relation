import React, { useState } from 'react';
import { FiMapPin, FiPlus, FiX } from 'react-icons/fi';
import useCountryCities from '../../hooks/useCountryCities';

const chipClass = (selected) =>
  `inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
    selected
      ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-800'
      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
  }`;

/** Choix des zones d'intervention : villes du pays + ville/quartier libre. */
export default function CityZonesPicker({ selected = [], onChange, error }) {
  const cities = useCountryCities();
  const [other, setOther] = useState('');
  const custom = selected.filter((zone) => !cities.includes(zone));

  const toggle = (city) => {
    onChange(selected.includes(city) ? selected.filter((z) => z !== city) : [...selected, city]);
  };

  const addOther = () => {
    const value = other.trim();
    if (!value) return;
    const exists = selected.some((z) => z.toLowerCase() === value.toLowerCase());
    if (!exists) onChange([...selected, value]);
    setOther('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => (
          <button key={city} type="button" onClick={() => toggle(city)} className={chipClass(selected.includes(city))}>
            {selected.includes(city) && <FiMapPin className="h-3.5 w-3.5" />}
            {city}
          </button>
        ))}
        {custom.map((zone) => (
          <span key={zone} className={chipClass(true)}>
            <FiMapPin className="h-3.5 w-3.5" />
            {zone}
            <button
              type="button"
              onClick={() => onChange(selected.filter((z) => z !== zone))}
              className="ml-1 text-indigo-600 hover:text-indigo-800"
              aria-label={`Retirer ${zone}`}
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOther();
            }
          }}
          placeholder="Autre ville ou quartier"
          className="form-input !mt-0 flex-1"
        />
        <button
          type="button"
          onClick={addOther}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FiPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Les clients qui ont un besoin dans ces villes verront votre prestation.
        </p>
      )}
    </div>
  );
}
