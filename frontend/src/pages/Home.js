import React from 'react';
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiCompass, FiMapPin, FiMessageCircle, FiSearch, FiUsers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const handleSearch = (e) => {
    e.preventDefault();
    const searchTerm = e.target.search.value;
    navigate(`/services${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-indigo-100">
              Plateforme de mise en relation
            </p>
            <h1 className="text-4xl font-bold md:text-5xl">
              Démarrez vite. Trouvez le bon partenaire de service.
            </h1>
            <p className="mt-4 text-lg text-indigo-100">
              Publiez un besoin, trouvez un fournisseur qualifié, et collaborez dans un espace d’échange dédié.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-2xl">
              <div className="relative">
                <FiSearch className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Rechercher un service, un domaine, une prestation..."
                  className="w-full rounded-xl border-0 py-4 pl-12 pr-36 text-slate-900 shadow-sm focus:ring-4 focus:ring-indigo-200"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Rechercher
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="rounded-xl bg-white px-7 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">
                    Créer un compte
                  </Link>
                  <Link to="/login" className="rounded-xl border-2 border-white px-7 py-3 font-semibold text-white transition hover:bg-white hover:text-indigo-700">
                    Se connecter
                  </Link>
                </>
              ) : (
                <Link
                  to={
                    user?.type_utilisateur === 'administrateur'
                      ? '/admin/dashboard'
                      : user?.type_utilisateur === 'fournisseur'
                        ? '/fournisseur/dashboard'
                        : '/client/dashboard'
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Aller à mon tableau de bord
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>

            {!isAuthenticated && (
              <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/25 bg-white/10 p-5 text-left shadow-sm backdrop-blur-sm sm:p-6">
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-indigo-100">
                  Choisir mon parcours
                </p>
                <p className="mt-2 text-center text-sm text-indigo-100/95">
                  Inscription avec le bon profil — vous pourrez le modifier avant de valider le formulaire.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    to="/register?type=client"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50 sm:flex-none sm:min-w-[220px]"
                  >
                    <FiUsers className="h-4 w-4 shrink-0" />
                    Je cherche un prestataire
                  </Link>
                  <Link
                    to="/register?type=fournisseur"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-white/80 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:flex-none sm:min-w-[220px]"
                  >
                    <FiBriefcase className="h-4 w-4 shrink-0" />
                    Je propose mes services
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">Ce que vous pouvez faire dès maintenant</h2>
            <p className="mt-2 text-slate-600">Un parcours simple pour lancer vos premières collaborations.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex rounded-full bg-indigo-100 p-3">
                <FiUsers className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Côté client</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                Publiez vos besoins et suivez vos matchings jusqu’à la collaboration.
              </p>
              {!isAuthenticated && (
                <Link
                  to="/register?type=client"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Créer un compte client <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex rounded-full bg-emerald-100 p-3">
                <FiBriefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Côté fournisseur</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                Gérez vos prestations et recevez des demandes alignées à vos domaines.
              </p>
              {!isAuthenticated && (
                <Link
                  to="/register?type=fournisseur"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Créer un compte fournisseur <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex rounded-full bg-amber-100 p-3">
                <FiMessageCircle className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Collaboration</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">
                Espace de messages dédié pour fluidifier les échanges client-fournisseur.
              </p>
              {!isAuthenticated && (
                <Link to="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950">
                  Se connecter pour échanger <FiArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Aperçu de la plateforme</h2>
            <Link to="/services" className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700">
              Explorer les services
              <FiArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiCompass className="mb-3 h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Matching orienté domaine</h3>
              <p className="mt-2 text-sm text-slate-600">Le score privilégie la pertinence métier entre besoin et prestation.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiMapPin className="mb-3 h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Couverture locale</h3>
              <p className="mt-2 text-sm text-slate-600">Données et scénarios ancrés sur Ouagadougou et Bobo-Dioulasso.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FiCheckCircle className="mb-3 h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Parcours complet</h3>
              <p className="mt-2 text-sm text-slate-600">Du besoin initial à la transaction, avec suivi et historique.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-700 to-blue-800 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Prêt à lancer votre première collaboration ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-indigo-100">
            Créez un compte pour accéder à un parcours guidé côté client ou fournisseur.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/register" className="rounded-xl bg-white px-8 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">
              S'inscrire
            </Link>
            <Link to="/login" className="rounded-xl border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white hover:text-indigo-700">
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
