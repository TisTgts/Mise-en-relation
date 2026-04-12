import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Import du contexte d'authentification
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import des composants
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute, { FournisseurRoute, ClientRoute, AdministrateurRoute } from './components/ProtectedRoute';

// Import des pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Offers from './pages/Offers';
import Needs from './pages/Needs';

// Nouvelles pages avec terminologie française
import { 
  FournisseurDashboard, 
  CreerPrestation,
  PrestationDetail,
  ModifierPrestation,
  MesPrestations,
  DemandesDisponibles,
  MesTransactions,
  MonProfil,
  MesMessages,
  ToutesLesDemandes,
  MesCollaborations as FournisseurCollaborations
} from './pages/fournisseur';
import { 
  ClientDashboard, 
  CreerDemande,
  MesDemandes,
  PrestationsDisponibles,
  ClientTransactions as ClientTransactions,
  ClientMessages as ClientMessages,
  ClientProfil as ClientProfil,
  ToutesLesPrestations,
  ClientCollaborations as ClientCollaborations
} from './pages/client';
import DemandeDetail from './pages/client/DemandeDetail';
import DemandeEdit from './pages/client/DemandeEdit';
import TransactionDetail from './pages/client/TransactionDetail';
import { AdminDashboard, ManageUsers, ManageServices } from './pages/administrateur';

// Anciennes pages (à migrer)
import ProviderDashboard from './pages/provider/ProviderDashboard';
import TestDashboard from './pages/TestDashboard';
import CreateOffer from './pages/provider/CreateOffer';
import CreateNeed from './pages/fournisseur/CreateNeed';
import OffersList from './pages/OffersList';
import NeedsList from './pages/NeedsList';

// Composant pour les pages publiques (avec Header/Footer)
const PublicPage = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      {children}
    </main>
    <Footer />
  </div>
);

// Composant de protection des routes (remplacé par ProtectedRoute)

// Composant pour les pages protégées avec DashboardLayout
const ProtectedPage = ({ children }) => (
  <DashboardLayout>
    {children}
  </DashboardLayout>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={
            <PublicPage>
              <Home />
            </PublicPage>
          } />
          <Route path="/login" element={
            <PublicPage>
              <Login />
            </PublicPage>
          } />
          <Route path="/register" element={
            <PublicPage>
              <Register />
            </PublicPage>
          } />
          
          {/* Pages protégées avec DashboardLayout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedPage>
                <Dashboard />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/provider" element={
            <ProtectedRoute>
              <ProtectedPage>
                <ProviderDashboard />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client" element={
            <ProtectedRoute>
              <ProtectedPage>
                <ClientDashboard />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          
          {/* Nouvelles routes avec terminologie française et protection par type */}
          <Route path="/fournisseur/dashboard" element={
            <FournisseurRoute>
              <ProtectedPage>
                <FournisseurDashboard />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/mes-prestations" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MesPrestations />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/creer-prestation" element={
            <FournisseurRoute>
              <ProtectedPage>
                <CreerPrestation />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/demandes" element={
            <FournisseurRoute>
              <ProtectedPage>
                <DemandesDisponibles />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/toutes-les-demandes" element={
            <FournisseurRoute>
              <ProtectedPage>
                <ToutesLesDemandes />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/transactions" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MesTransactions />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/messages" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MesMessages />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/profil" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MonProfil />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/mes-collaborations" element={
            <FournisseurRoute>
              <ProtectedPage>
                <FournisseurCollaborations />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/client_dashboard" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientDashboard />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/mes-demandes" element={
            <ClientRoute>
              <ProtectedPage>
                <MesDemandes />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/demandes/:id" element={
            <ClientRoute>
              <ProtectedPage>
                <DemandeDetail />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/demandes/:id/edit" element={
            <ClientRoute>
              <ProtectedPage>
                <DemandeEdit />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/prestations" element={
            <ClientRoute>
              <ProtectedPage>
                <PrestationsDisponibles />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/toutes-les-prestations" element={
            <ClientRoute>
              <ProtectedPage>
                <ToutesLesPrestations />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/transactions" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientTransactions />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/transactions/:id" element={
            <ClientRoute>
              <ProtectedPage>
                <TransactionDetail />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/messages" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientMessages />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/profil" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientProfil />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/mes-collaborations" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientCollaborations />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/users" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageUsers />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/prestations" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageServices />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/categories" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/prestations" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/demandes" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/messages" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/settings" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminDashboard />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/fournisseur/creer-prestation" element={
            <FournisseurRoute>
              <ProtectedPage>
                <CreerPrestation />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/prestation/:id" element={
            <FournisseurRoute>
              <ProtectedPage>
                <PrestationDetail />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/modifier-prestation/:id" element={
            <FournisseurRoute>
              <ProtectedPage>
                <ModifierPrestation />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/transactions" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MesTransactions />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/transactions/:id" element={
            <FournisseurRoute>
              <ProtectedPage>
                <TransactionDetail />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/profil" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MonProfil />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/fournisseur/messages" element={
            <FournisseurRoute>
              <ProtectedPage>
                <MesMessages />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/client/creer-demande" element={
            <ClientRoute>
              <ProtectedPage>
                <CreerDemande />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/dashboard/provider/create-offer" element={
            <ProtectedRoute>
              <ProtectedPage>
                <CreateOffer />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/create-need" element={
            <ProtectedRoute>
              <ProtectedPage>
                <CreateNeed />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/test-dashboard" element={
            <ProtectedRoute>
              <TestDashboard />
            </ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute>
              <ProtectedPage>
                <Services />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/offers" element={
            <ProtectedRoute>
              <ProtectedPage>
                <Offers />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/offers/list" element={
            <PublicPage>
              <OffersList />
            </PublicPage>
          } />
          <Route path="/needs" element={
            <ProtectedRoute>
              <ProtectedPage>
                <Needs />
              </ProtectedPage>
            </ProtectedRoute>
          } />
          <Route path="/needs/list" element={
            <PublicPage>
              <NeedsList />
            </PublicPage>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
