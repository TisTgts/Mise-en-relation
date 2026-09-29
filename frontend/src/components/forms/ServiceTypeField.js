import React, { useEffect, useState } from 'react';

const OTHER = '__autre__';

/** Type de prestation choisi dans la liste de la catégorie (la même que celle des besoins), ou saisi librement. */
export default function ServiceTypeField({ id = 'type_prestation', types = [], value, onChange, error }) {
  const [otherMode, setOtherMode] = useState(false);
  const typesKey = types.join('|');

  useEffect(() => {
    setOtherMode(false);
  }, [typesKey]);

  const showOther = types.length === 0 || otherMode || (value && !types.includes(value));

  return (
    <div>
      {types.length > 0 && (
        <select
          id={id}
          value={showOther ? OTHER : value}
          onChange={(e) => {
            if (e.target.value === OTHER) {
              setOtherMode(true);
              onChange('');
            } else {
              setOtherMode(false);
              onChange(e.target.value);
            }
          }}
          className={`form-select ${error && !showOther ? 'form-field-error' : ''}`}
        >
          <option value="">Choisir un type</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
          <option value={OTHER}>Autre (préciser)</option>
        </select>
      )}
      {showOther && (
        <input
          type="text"
          id={types.length ? `${id}_autre` : id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={types.length ? 'Précisez votre type de service' : 'Ex. Réparation de climatiseurs'}
          className={`form-input ${error ? 'form-field-error' : ''}`}
        />
      )}
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          {showOther && types.length
            ? 'Avec un type personnalisé, vous serez moins souvent proposé aux clients.'
            : 'Ce sont les mêmes types que ceux choisis par les clients : c\'est ce qui permet de vous proposer leurs besoins.'}
        </p>
      )}
    </div>
  );
}
