import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiFileText,
  FiSearch,
  FiTrash2,
  FiEye,
  FiCalendar,
  FiTag,
  FiX,
  FiSearch as FiSearchMatch,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiMapPin,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminType } from '../../utils/roles';
import { useConfirm } from '../../contexts/ConfirmContext';
import adminService from '../../services/adminService';
import Toast from '../../components/Toast';

const truncateCell = (text, max = 48) => {
  if (text == null || text === '') return '—';
  const s = String(text);
  return s.length <= max ? s : `${s.slice(0, max)}…`;
};

const statusPillClass = (statut) => {
  switch (statut) {
    case 'active':
    case 'ouverte':
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
    case 'inactive':
    case 'fermee':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
    case 'pending':
    case 'en_attente':
      return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
    case 'en_cours':
      return 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80';
    case 'terminee':
      return 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/80';
    case 'annulee':
      return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  }
};

function ProviderProfileModal({ open, onClose }) {
  if (!open) return null;
  const { raw } = open;

  const profile = raw?.profile || raw?.profile_fournisseur || {};
  const user = raw?.user || {};

  const row = (label, value) => (
    <div className="border-b border-slate-100 py-2 sm:grid sm:grid-cols-3 sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap break-words">
        {value == null || value === '' ? '—' : String(value)}
      </dd>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Fournisseur</p>
            <h2 id="provider-modal-title" className="mt-1 text-lg font-bold text-slate-900">
              {user.username || raw?.username || 'Profil fournisseur'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-5rem)] overflow-y-auto px-5 py-4">
          <dl>
            {row('Nom utilisateur', user.username || raw?.username)}
            {row('Email', user.email || raw?.email)}
            {row('Téléphone', profile.telephone || raw?.telephone)}
            {row('Ville', profile.ville || profile.localisation_ville || raw?.ville)}
            {row('Quartier', profile.quartier || profile.localisation_quartier || raw?.quartier)}
            {row('Secteur', profile.secteur_activite || profile.specialite || raw?.secteur_activite)}
            {row('Note moyenne', profile.note_moyenne)}
            {row('Bio / Présentation', profile.bio || profile.description || raw?.description)}
          </dl>
        </div>
      </div>
    </div>
  );
}

function ServiceDetailModal({ open, onClose, onOpenProviderProfile, providerLoadingId }) {
  if (!open) return null;
  const { kind, data } = open;

  const row = (label, value) => (
    <div className="border-b border-slate-100 py-2 sm:grid sm:grid-cols-3 sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap break-words">
        {value == null || value === '' ? '—' : String(value)}
      </dd>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {kind === 'prestation' ? 'Prestation' : kind === 'type_group' ? 'Type de prestation' : 'Besoin'}
            </p>
            <h2 id="detail-modal-title" className="mt-1 text-lg font-bold text-slate-900">
              {kind === 'type_group' ? data.type : (data.intitule || `ID ${data.id}`)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Fermer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-5rem)] overflow-y-auto px-5 py-4">
          <dl>
            {kind === 'type_group' ? (
              <>
                {row('Type', data.type_prestation)}
                {row('Prestations', data.totalPrestations)}
                {row('Offres fournisseurs', data.offers.length)}
                {row('Fournisseurs', data.fournisseurs.length)}
                {row('Offres actives', data.actifs)}
                {row('Catégories couvertes', data.categories.join(', '))}
                {row(
                  'Fourchette globale',
                  data.globalTarifText || '—'
                )}
                {row('Zones d’intervention couvertes', (data.zones || []).join(', ') || '—')}
                <div className="grid grid-cols-2 gap-3 py-3 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Fournisseurs</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{data.fournisseurs.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Offres</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{data.offers.length}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Actives</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{data.actifs}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Catégories</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{data.categories.length}</p>
                  </div>
                </div>
                <div className="py-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fournisseurs et offres
                  </dt>
                  <dd className="mt-2">
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-slate-700">Fournisseur</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Intitulé offre</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Description</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Tarification</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Mode</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Disponibilité</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Statut</th>
                            <th className="px-3 py-2 font-semibold text-slate-700">Profil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {data.offers.map((offer) => (
                            <tr key={offer.id}>
                              <td className="px-3 py-2 text-slate-800">{offer.fournisseur_nom || '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{offer.intitule || '—'}</td>
                              <td className="max-w-[18rem] px-3 py-2 text-slate-700" title={offer.description}>
                                {truncateCell(offer.description, 80)}
                              </td>
                              <td className="px-3 py-2 text-slate-700">
                                {offer.tarif_min != null || offer.tarif_max != null
                                  ? `${offer.tarif_min != null ? Number(offer.tarif_min).toLocaleString('fr-FR') : '—'} – ${offer.tarif_max != null ? Number(offer.tarif_max).toLocaleString('fr-FR') : '—'} FCFA`
                                  : '—'}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{offer.mode_tarification || '—'}</td>
                              <td className="px-3 py-2 text-slate-700">
                                {offer.disponibilite_debut ? adminService.formatDate(offer.disponibilite_debut) : '—'} {'->'} {offer.disponibilite_fin ? adminService.formatDate(offer.disponibilite_fin) : '—'}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{adminService.formatServiceStatus(offer.statut)}</td>
                              <td className="px-3 py-2 text-slate-700">
                                <button
                                  type="button"
                                  onClick={() => onOpenProviderProfile(offer)}
                                  disabled={providerLoadingId === offer.id}
                                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                                >
                                  {providerLoadingId === offer.id ? 'Chargement...' : 'Voir profil'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </dd>
                </div>
                <div className="py-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fournisseurs concernés
                  </dt>
                  <dd className="mt-2 space-y-3">
                    {Object.values(
                      data.offers.reduce((acc, offer) => {
                        const key = offer.fournisseur || offer.fournisseur_nom || `f-${offer.id}`;
                        if (!acc[key]) {
                          acc[key] = {
                            fournisseur: offer.fournisseur,
                            fournisseur_nom: offer.fournisseur_nom || 'Fournisseur',
                            offres: [],
                            zones: new Set(),
                            minTarif: null,
                            maxTarif: null,
                            actifs: 0,
                          };
                        }
                        acc[key].offres.push(offer);
                        if (offer.statut === 'active') acc[key].actifs += 1;
                        const vals = [offer.tarif_min, offer.tarif_max].filter((v) => v != null).map(Number);
                        if (vals.length) {
                          const localMin = Math.min(...vals);
                          const localMax = Math.max(...vals);
                          acc[key].minTarif = acc[key].minTarif == null ? localMin : Math.min(acc[key].minTarif, localMin);
                          acc[key].maxTarif = acc[key].maxTarif == null ? localMax : Math.max(acc[key].maxTarif, localMax);
                        }
                        const zones = Array.isArray(offer.zones_intervention) ? offer.zones_intervention : [offer.zones_intervention];
                        zones.filter(Boolean).forEach((z) => acc[key].zones.add(z));
                        return acc;
                      }, {})
                    ).map((provider) => (
                      <div key={provider.fournisseur || provider.fournisseur_nom} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{provider.fournisseur_nom}</p>
                            <p className="text-xs text-slate-600">
                              {provider.offres.length} offre(s), {provider.actifs} active(s)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenProviderProfile(provider.offres[0])}
                            disabled={providerLoadingId === provider.offres[0]?.id}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                          >
                            {providerLoadingId === provider.offres[0]?.id ? 'Chargement...' : 'Voir profil'}
                          </button>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-700 md:grid-cols-3">
                          <p><span className="font-medium">Tarifs:</span> {provider.minTarif != null ? `${provider.minTarif.toLocaleString('fr-FR')} - ${provider.maxTarif.toLocaleString('fr-FR')} FCFA` : '—'}</p>
                          <p><span className="font-medium">Zones:</span> {Array.from(provider.zones).join(', ') || '—'}</p>
                          <p><span className="font-medium">Prestations:</span> {provider.offres.map((o) => o.intitule).filter(Boolean).slice(0, 2).join(' | ') || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </dd>
                </div>
              </>
            ) : kind === 'prestation' ? (
              <>
                {row('ID', data.id)}
                {row('Description', data.description)}
                {row('Fournisseur', data.fournisseur_nom)}
                {row('Catégorie', data.categorie_nom)}
                {row('Sous-catégorie', data.sous_categorie_nom)}
                {row('Type', data.type_prestation)}
                {row(
                  'Tarification',
                  data.tarif_min != null || data.tarif_max != null
                    ? `${data.tarif_min?.toLocaleString?.('fr-FR') ?? '—'} – ${data.tarif_max?.toLocaleString?.('fr-FR') ?? '—'} FCFA`
                    : null
                )}
                {row('Statut', adminService.formatServiceStatus(data.statut))}
                {row('Zones', Array.isArray(data.zones_intervention) ? data.zones_intervention.join(', ') : data.zones_intervention)}
                {row(
                  'Disponibilité',
                  `${data.disponibilite_debut ? adminService.formatDate(data.disponibilite_debut) : '—'} → ${data.disponibilite_fin ? adminService.formatDate(data.disponibilite_fin) : '—'}`
                )}
                {row('Créée le', data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : null)}
              </>
            ) : (
              <>
                {row('ID', data.id)}
                {row('Description', data.description)}
                {row('Client', data.client_nom)}
                {row('E-mail client', data.client_email)}
                {row('Catégorie', data.categorie_nom)}
                {row('Sous-catégorie', data.sous_categorie_nom)}
                {row('Type de service', data.type_service)}
                {row('Lieu', data.lieu_intervention)}
                {row('Budget', data.budget != null ? `${Number(data.budget).toLocaleString('fr-FR')} FCFA` : null)}
                {row('Urgence', data.urgence)}
                {row('Statut', adminService.formatServiceStatus(data.statut))}
                {row('Date souhaitée', adminService.formatDate(data.date_souhaitee))}
                {row('Date limite', adminService.formatDate(data.date_limite))}
                {row('Exigences', data.exigences)}
                {row('Créée le', data.created_at ? new Date(data.created_at).toLocaleString('fr-FR') : null)}
              </>
            )}
          </dl>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50/80">
          {kind === 'besoin' && (
            <Link
              to={`/admin/correspondances/besoin/${data.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              <FiSearchMatch className="h-4 w-4" />
              Correspondances
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const ManageServices = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const location = useLocation();
  const navigate = useNavigate();
  const [prestations, setPrestations] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('prestations');
  const [prestationView, setPrestationView] = useState('liste');
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailOpen, setDetailOpen] = useState(null);
  const [providerProfileOpen, setProviderProfileOpen] = useState(null);
  const [providerLoadingId, setProviderLoadingId] = useState(null);
  /** Totaux issus de l’agrégation serveur (alignés sur le tableau de bord admin). */
  const [serverTotals, setServerTotals] = useState(null);

  useEffect(() => {
    const path = location.pathname || '';
    if (path.includes('/admin/besoins') || path.includes('/admin/demandes')) {
      setActiveTab('besoins');
    } else {
      setActiveTab('prestations');
    }
  }, [location.pathname]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [prestationsList, besoinsList, serverStats] = await Promise.all([
        adminService.getAllPrestations(),
        adminService.getAllDemandes(),
        adminService.getDetailedStatistics().catch(() => null),
      ]);

      setPrestations(Array.isArray(prestationsList) ? prestationsList : []);
      setDemandes(Array.isArray(besoinsList) ? besoinsList : []);
      if (serverStats?.prestations || serverStats?.besoins) {
        setServerTotals({
          totalPrestations: serverStats.prestations?.total_prestations,
          prestationsActives: serverStats.prestations?.active_prestations,
          totalBesoins: serverStats.besoins?.total_besoins,
          besoinsOuverts: serverStats.besoins?.ouvertes_besoins,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setToast({
        message: 'Impossible de charger les prestations et besoins',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdminType(user)) {
      fetchData();
    }
  }, [user]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilter('all');
    setSearchTerm('');
    navigate(tab === 'prestations' ? '/admin/prestations' : '/admin/besoins');
  };

  const handleDeletePrestation = async (id) => {
    const ok = await confirm({
      title: 'Supprimer cette prestation ?',
      message: 'Cette action est irréversible.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;

    try {
      await adminService.deletePrestation(id);
      setPrestations(prev => prev.filter(p => p.id !== id));
      setToast({
        message: 'Prestation supprimée avec succès',
        type: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression de la prestation',
        type: 'error'
      });
    }
  };

  const handleDeleteDemande = async (id) => {
    const ok = await confirm({
      title: 'Supprimer ce besoin ?',
      message: 'Cette action est irréversible.',
      tone: 'danger',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;

    try {
      await adminService.deleteDemande(id);
      setDemandes(prev => prev.filter(d => d.id !== id));
      setToast({
        message: 'Besoin supprimé avec succès',
        type: 'success',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setToast({
        message: 'Erreur lors de la suppression du besoin',
        type: 'error'
      });
    }
  };

  const filteredPrestations = prestations.filter((prestation) => {
    const matchesSearch = 
      prestation.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prestation.fournisseur_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return prestation.statut === 'active' && matchesSearch;
    if (filter === 'inactive') return prestation.statut === 'inactive' && matchesSearch;
    if (filter === 'en_cours') return prestation.statut === 'en_cours' && matchesSearch;
    
    return matchesSearch;
  });

  const prestationsByType = useMemo(() => (
    Object.values(
      filteredPrestations.reduce((acc, prestation) => {
        const typeKey = prestation.type_prestation || 'Non défini';
        if (!acc[typeKey]) {
          acc[typeKey] = {
            type: typeKey,
            type_prestation: typeKey,
            offers: [],
          };
        }
        acc[typeKey].offers.push(prestation);
        return acc;
      }, {})
    ).map((group) => {
      const tarifs = group.offers.flatMap((o) => [o.tarif_min, o.tarif_max]).filter((v) => v != null).map(Number);
      const globalTarifText = tarifs.length
        ? `${Math.min(...tarifs).toLocaleString('fr-FR')} – ${Math.max(...tarifs).toLocaleString('fr-FR')} FCFA`
        : null;
      const fournisseurs = [...new Set(group.offers.map((o) => o.fournisseur_nom).filter(Boolean))];
      const categories = [...new Set(group.offers.map((o) => o.categorie_nom).filter(Boolean))];
      const zones = [...new Set(group.offers.flatMap((o) => (Array.isArray(o.zones_intervention) ? o.zones_intervention : [o.zones_intervention])).filter(Boolean))];
      const actifs = group.offers.filter((o) => o.statut === 'active').length;
      const totalPrestations = new Set(group.offers.map((o) => o.intitule || o.id)).size;
      return { ...group, globalTarifText, fournisseurs, categories, zones, actifs, totalPrestations };
    }).sort((a, b) => a.type.localeCompare(b.type, 'fr'))
  ), [filteredPrestations]);

  const filteredBesoins = demandes.filter((demande) => {
    const matchesSearch = 
      demande.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.client_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'ouverte') return demande.statut === 'ouverte' && matchesSearch;
    if (filter === 'pourvue') return demande.statut === 'pourvue' && matchesSearch;
    if (filter === 'annulee') return demande.statut === 'annulee' && matchesSearch;
    if (filter === 'en_cours') return demande.statut === 'en_cours' && matchesSearch;
    
    return matchesSearch;
  });

  const statsFromList = {
    totalPrestations: prestations.length,
    prestationsActives: prestations.filter((p) => p.statut === 'active').length,
    totalBesoins: demandes.length,
    besoinsOuverts: demandes.filter((d) => d.statut === 'ouverte').length,
  };

  const stats = serverTotals
    ? {
        totalPrestations: serverTotals.totalPrestations ?? statsFromList.totalPrestations,
        prestationsActives: serverTotals.prestationsActives ?? statsFromList.prestationsActives,
        totalBesoins: serverTotals.totalBesoins ?? statsFromList.totalBesoins,
        besoinsOuverts: serverTotals.besoinsOuverts ?? statsFromList.besoinsOuverts,
      }
    : statsFromList;

  const handleOpenProviderProfile = async (offer) => {
    try {
      setProviderLoadingId(offer.id);
      const profile = await adminService.getProviderProfileForAdmin(offer.fournisseur);
      setProviderProfileOpen({ raw: profile });
    } catch (error) {
      setToast({
        message: error?.message || 'Impossible de charger le profil fournisseur',
        type: 'error',
      });
    } finally {
      setProviderLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Prestations &amp; Besoins</h1>
            <p className="mt-1 text-sm text-slate-600">Offres fournisseurs et besoins clients</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full">
              <FiBriefcase className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Prestations</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalPrestations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full">
              <FiTag className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Prestations Actives</p>
              <p className="text-xl font-semibold text-gray-900">{stats.prestationsActives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full">
              <FiFileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Besoins</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalBesoins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full">
              <FiCalendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Besoins ouverts</p>
              <p className="text-xl font-semibold text-gray-900">{stats.besoinsOuverts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'prestations' ? 'Intitulé, fournisseur…' : 'Intitulé, client…'}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtre
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Tous les services</option>
              {activeTab === 'prestations' ? (
                <>
                  <option value="active">Prestations actives</option>
                  <option value="inactive">Prestations inactives</option>
                  <option value="en_cours">En cours</option>
                </>
              ) : (
                <>
                  <option value="ouverte">Besoins ouverts</option>
                  <option value="pourvue">Pourvus</option>
                  <option value="en_cours">En cours</option>
                  <option value="annulee">Annulés</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => switchTab('prestations')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'prestations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prestations ({prestations.length})
            </button>
            <button
              type="button"
              onClick={() => switchTab('besoins')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'besoins'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Besoins ({demandes.length})
            </button>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <p className="text-sm text-slate-600">
            {activeTab === 'prestations'
              ? `${filteredPrestations.length} prestation(s)`
              : `${filteredBesoins.length} besoin(s)`}
          </p>
          {activeTab === 'prestations' && (
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                type="button"
                onClick={() => setPrestationView('liste')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  prestationView === 'liste' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FiList className="h-3.5 w-3.5" />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setPrestationView('type')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  prestationView === 'type' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FiGrid className="h-3.5 w-3.5" />
                Par type
              </button>
            </div>
          )}
        </div>

        <div className="p-0">
          {activeTab === 'prestations' ? (
            <div className="overflow-x-auto">
              {prestationView === 'liste' ? (
                filteredPrestations.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    {prestations.length === 0 ? 'Aucune prestation' : 'Aucune prestation ne correspond aux filtres'}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Intitulé</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Fournisseur</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Catégorie</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Tarifs</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredPrestations.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/80">
                          <td className="max-w-[12rem] px-4 py-3 font-medium text-gray-900" title={p.intitule}>
                            {truncateCell(p.intitule, 48)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{truncateCell(p.fournisseur_nom, 28)}</td>
                          <td className="px-4 py-3 text-gray-600">{truncateCell(p.categorie_nom, 24)}</td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">
                            {p.tarif_min != null || p.tarif_max != null
                              ? `${p.tarif_min != null ? Number(p.tarif_min).toLocaleString('fr-FR') : '—'} – ${p.tarif_max != null ? Number(p.tarif_max).toLocaleString('fr-FR') : '—'} FCFA`
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(p.statut)}`}>
                              {adminService.formatServiceStatus(p.statut)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailOpen({ kind: 'prestation', data: p })}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                              >
                                <FiEye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrestation(p.id)}
                                className="inline-flex items-center rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : prestationsByType.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  {prestations.length === 0 ? 'Aucune prestation' : 'Aucune prestation ne correspond aux filtres'}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Catégories</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Offres</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">Fournisseurs</th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {prestationsByType.map((typeGroup) => (
                      <tr key={typeGroup.type} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-medium text-gray-900">{typeGroup.type}</td>
                        <td className="max-w-[14rem] px-4 py-3 text-gray-700" title={typeGroup.categories.join(', ')}>
                          {truncateCell(typeGroup.categories.join(', ') || '—', 60)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {typeGroup.offers.length} <span className="text-gray-400">({typeGroup.actifs} actives)</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">{typeGroup.fournisseurs.length}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailOpen({ kind: 'type_group', data: typeGroup })}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                          >
                            <FiEye className="h-3.5 w-3.5" />
                            Détail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredBesoins.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  {demandes.length === 0 ? 'Aucun besoin trouvé' : 'Aucun besoin ne correspond aux filtres'}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        ID
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Intitulé
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Client
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Catégorie
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Lieu
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                        Budget
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Statut
                      </th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-700">
                        Date limite
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredBesoins.map((demande) => (
                      <tr key={demande.id} className="hover:bg-gray-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{demande.id}</td>
                        <td className="max-w-[14rem] px-4 py-3">
                          <span className="font-medium text-gray-900" title={demande.intitule}>
                            {truncateCell(demande.intitule, 56)}
                          </span>
                        </td>
                        <td className="max-w-[10rem] px-4 py-3 text-gray-700" title={demande.client_nom}>
                          {truncateCell(demande.client_nom, 28)}
                        </td>
                        <td className="max-w-[9rem] px-4 py-3 text-gray-700" title={demande.categorie_nom}>
                          {truncateCell(demande.categorie_nom, 24)}
                        </td>
                        <td className="max-w-[8rem] px-4 py-3 text-gray-600" title={demande.lieu_intervention}>
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            {truncateCell(demande.lieu_intervention, 18)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-800">
                          {demande.budget != null ? `${Number(demande.budget).toLocaleString('fr-FR')} FCFA` : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusPillClass(demande.statut)}`}
                          >
                            {adminService.formatServiceStatus(demande.statut)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {demande.date_limite ? adminService.formatDate(demande.date_limite) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailOpen({ kind: 'besoin', data: demande })}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                              title="Détail"
                            >
                              <FiEye className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              to={`/admin/correspondances/besoin/${demande.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                              title="Voir les correspondances"
                            >
                              <FiSearchMatch className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteDemande(demande.id)}
                              className="inline-flex items-center rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <ServiceDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(null)}
        onOpenProviderProfile={handleOpenProviderProfile}
        providerLoadingId={providerLoadingId}
      />
      <ProviderProfileModal
        open={providerProfileOpen}
        onClose={() => setProviderProfileOpen(null)}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ManageServices;
