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
  FournisseurTransactionDetail,
} from './pages/fournisseur';
import { 
  ClientDashboard, 
  BesoinCreate,
  MesBesoins,
  ClientTransactions as ClientTransactions,
  ClientMessages as ClientMessages,
  ClientProfil as ClientProfil,
  ClientCollaborations as ClientCollaborations,
  BesoinDetail,
  BesoinEdit,
  TransactionDetail,
} from './pages/client';
import { AdminDashboard, ManageUsers, ManageServices } from './pages/administrateur';

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
                <FournisseurDashboard />
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
          <Route path="/admin/besoins" element={
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
                <BesoinCreate />
              </ProtectedPage>
            </ClientRoute>
          } />
          <Route path="/dashboard/provider/create-offer" element={
            <ProtectedRoute>
              <ProtectedPage>
                <PrestationCreate />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
