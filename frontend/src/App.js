import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Import du contexte d'authentification
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

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

// Nouvelles pages avec terminologie française
import { 
  FournisseurDashboard, 
  PrestationCreate,
  PrestationDetail,
  PrestationEdit,
  MesPrestations,
  MesTransactions,
  MonProfil,
  MesMessages,
  MesCollaborations as FournisseurCollaborations,
  FournisseurCollaborationWorkspace,
  FournisseurTransactionDetail,
} from './pages/fournisseur';
import { 
  ClientDashboard, 
  BesoinCreate,
  MesBesoins,
  ClientTransactions,
  ClientMessages,
  ClientProfil,
  ClientCollaborations,
  ClientCollaborationWorkspace,
  BesoinDetail,
  BesoinEdit,
  TransactionDetail,
  MesMatchings,
  BesoinMatching,
} from './pages/client';
import {
  AdminDashboard,
  ManageUsers,
  ManageServices,
  ManageMatchings,
  ManageMatchingNeedDetails,
  ManageCategories,
  ManageTransactions,
  ManageCollaborations,
  AdminCollaborationWorkspace,
  ManageAdminMessages,
  AdminSettings,
} from './pages/administrateur';

import TestDashboard from './pages/TestDashboard';

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
        <NotificationProvider>
        <ConfirmProvider>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={
            <PublicPage>
              <Home />
            </PublicPage>
          } />
          <Route path="/login" element={
            <Login />
          } />
          <Route path="/register" element={
            <Register />
          } />

          {/* Anciennes URLs → chemins canoniques */}
          <Route path="/dashboard/client" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/dashboard/provider" element={<Navigate to="/fournisseur/dashboard" replace />} />
          <Route path="/client_dashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/dashboard/provider/create-offer" element={<Navigate to="/fournisseur/creer-prestation" replace />} />
          
          {/* Pages protégées avec DashboardLayout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedPage>
                <Dashboard />
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
                <PrestationCreate />
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
          <Route path="/fournisseur/parametres" element={
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
          <Route path="/fournisseur/collaborations/:id/workspace" element={
            <FournisseurRoute>
              <ProtectedPage>
                <FournisseurCollaborationWorkspace />
              </ProtectedPage>
            </FournisseurRoute>
          } />
          <Route path="/client/dashboard" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientDashboard />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/mes-demandes" element={
            <ClientRoute>
              <ProtectedPage>
                <MesBesoins />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/mes-besoins" element={
            <ClientRoute>
              <ProtectedPage>
                <MesBesoins />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/besoins/:id" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinDetail />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/besoins/:id/edit" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinEdit />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/demandes/:id" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinDetail />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/demandes/:id/edit" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinEdit />
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
          <Route path="/client/parametres" element={
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
          <Route path="/client/collaborations/:id/workspace" element={
            <ClientRoute>
              <ProtectedPage>
                <ClientCollaborationWorkspace />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/matchings" element={
            <ClientRoute>
              <ProtectedPage>
                <MesMatchings />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/besoins/:id/matching" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinMatching />
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
          <Route path="/admin/besoins" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageServices />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/demandes" element={<Navigate to="/admin/besoins" replace />} />
          <Route path="/admin/categories" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageCategories />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/transactions" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageTransactions />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/collaborations" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageCollaborations />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/collaborations/:id/workspace" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminCollaborationWorkspace />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/correspondances" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageMatchings />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/correspondances/besoin/:besoinId" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageMatchingNeedDetails />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/messages" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <ManageAdminMessages />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/admin/settings" element={
            <AdministrateurRoute>
              <ProtectedPage>
                <AdminSettings />
              </ProtectedPage>
            </AdministrateurRoute>
          } />
          <Route path="/fournisseur/creer-prestation" element={
            <FournisseurRoute>
              <ProtectedPage>
                <PrestationCreate />
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
                <PrestationEdit />
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
                <FournisseurTransactionDetail />
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
          <Route path="/fournisseur/parametres" element={
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
          <Route path="/client/creer-besoin" element={
            <ClientRoute>
              <ProtectedPage>
                <BesoinCreate />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/client/creer-demande" element={<Navigate to="/client/creer-besoin" replace />} />
          <Route path="/test-dashboard" element={
            <ProtectedRoute>
              <TestDashboard />
            </ProtectedRoute>
          } />
          <Route path="/services" element={
            <PublicPage>
              <Services />
            </PublicPage>
          } />
        </Routes>
        </ConfirmProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
