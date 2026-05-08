import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const truncate = (s, n = 120) => {
  if (!s) return '—';
  const str = String(s);
  return str.length <= n ? str : `${str.slice(0, n)}…`;
};

const ManageAdminMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (user?.type_utilisateur !== 'administrateur') return;
      try {
        setLoading(true);
        const data = await adminService.getAdminMessages();
        setMessages(Array.isArray(data) ? data : []);
      } catch {
        setToast({ message: 'Impossible de charger les messages.', type: 'error' });
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filtered = messages.filter((m) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      m.sujet?.toLowerCase().includes(q) ||
      m.contenu?.toLowerCase().includes(q) ||
      m.expediteur_nom?.toLowerCase().includes(q) ||
      m.destinataire_nom?.toLowerCase().includes(q) ||
      String(m.transaction ?? '').includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Lecture seule de tous les échanges liés aux transactions ({messages.length} messages).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">Recherche</label>
        <div className="relative max-w-xl">
          <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sujet, contenu, expéditeur, destinataire…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">De</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Vers</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Transaction</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Sujet</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Aperçu</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Lu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Aucun message à afficher.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-900">{m.expediteur_nom || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-900">{m.destinataire_nom || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{m.transaction ?? '—'}</td>
                    <td className="max-w-[200px] px-4 py-3 font-medium text-slate-900">{m.sujet || '—'}</td>
                    <td className="max-w-md px-4 py-3 text-slate-700">{truncate(m.contenu)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.lu ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {m.lu ? 'Oui' : 'Non'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ManageAdminMessages;
