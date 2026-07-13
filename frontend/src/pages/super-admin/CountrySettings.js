import React, { useCallback, useEffect, useState } from 'react';
import { FiGlobe, FiCheck, FiRefreshCw, FiAlertTriangle, FiMapPin, FiDollarSign, FiPhone } from 'react-icons/fi';
import { useConfirm } from '../../contexts/ConfirmContext';
import superAdminService from '../../services/superAdminService';
import Toast from '../../components/Toast';
import { applyCountryCode } from '../../pays/runtime';

const FLAGS = { bf: '🇧🇫', tg: '🇹🇬' };

const CountrySettings = () => {
  const confirm = useConfirm();
  const [countries, setCountries] = useState([]);
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getCountry();
      setCountries(data.countries || []);
      setActive(data.active || '');
    } catch (e) {
      setToast({ message: e.message || 'Chargement impossible.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = async (country) => {
    if (country.code === active) return;
    const ok = await confirm({
      title: `Basculer l'application vers ${country.name} ?`,
      message:
        'Tout le contenu régional (villes, devise, format de téléphone, textes) sera mis à jour ' +
        "pour l'ensemble des utilisateurs. La page se rechargera pour appliquer le changement.",
      confirmLabel: 'Changer le pays',
    });
    if (!ok) return;

    setSavingCode(country.code);
    try {
      await superAdminService.setCountry(country.code);
      // Aligne l'UI locale et recharge immédiatement.
      applyCountryCode(country.code);
    } catch (e) {
      setToast({ message: e.message || 'Changement impossible.', type: 'error' });
      setSavingCode(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">
              <FiGlobe className="h-3.5 w-3.5" />
              Super administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Pays de l'application</h1>
            <p className="mt-1 text-sm text-slate-600">
              Définit le contexte régional actif : villes, devise, indicatif téléphonique et textes.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Le changement s'applique à <strong>tous les utilisateurs</strong>. Chaque session se
          synchronise automatiquement au prochain chargement de page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {countries.map((country) => {
          const isActive = country.code === active;
          const isSaving = savingCode === country.code;
          return (
            <button
              key={country.code}
              type="button"
              onClick={() => handleSelect(country)}
              disabled={isSaving || isActive}
              className={`group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                isActive
                  ? 'border-fuchsia-400 bg-fuchsia-50 ring-1 ring-fuchsia-200'
                  : 'border-slate-200 bg-white hover:border-fuchsia-300 hover:shadow-md'
              } disabled:cursor-default`}
            >
              <span className="text-4xl" aria-hidden>{FLAGS[country.code] || '🌍'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-slate-900">{country.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{country.code}</p>
              </div>
              {isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
                  <FiCheck className="h-3.5 w-3.5" />
                  Actif
                </span>
              ) : isSaving ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-600">
                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Application…
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 group-hover:border-fuchsia-300 group-hover:text-fuchsia-700">
                  Activer
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Ce que le pays contrôle</h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-slate-600">
          <li className="flex items-center gap-2"><FiMapPin className="h-4 w-4 text-fuchsia-500" /> Villes & quartiers</li>
          <li className="flex items-center gap-2"><FiDollarSign className="h-4 w-4 text-fuchsia-500" /> Devise (FCFA…)</li>
          <li className="flex items-center gap-2"><FiPhone className="h-4 w-4 text-fuchsia-500" /> Indicatif téléphonique</li>
        </ul>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CountrySettings;
