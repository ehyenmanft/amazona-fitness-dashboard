import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import RenewalBanner from './components/RenewalBanner';
import KpiCards from './components/KpiCards';
import FilterBar from './components/FilterBar';
import ClientDetail from './components/ClientDetail';
import PlanViewer from './components/PlanViewer';
import PlansTable from './components/PlansTable';
import IntakeListView from './components/IntakeListView';
import IntakeDetailModal from './components/IntakeDetailModal';
import ApiConfigModal from './components/ApiConfigModal';
import LoginScreen from './components/LoginScreen';

import { getCurrentUser, logoutUser } from './utils/auth';
import { fetchDashboardData, fetchMarkdownPlan } from './utils/api';
import { parsePlanMarkdown, normalize } from './utils/planParser';
import { calculateUpcomingRenewals } from './utils/renewals';
import {
  fetchFormResponsesFromSupabase,
  updateResponseStatusInSupabase,
  getSupabaseConfig
} from './utils/supabase';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('amazona_theme') === 'dark';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLiveGAS, setIsLiveGAS] = useState(false);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data state
  const [dashboardData, setDashboardData] = useState(null);
  const [intakeResponses, setIntakeResponses] = useState([]);
  const [selectedIntakeAthlete, setSelectedIntakeAthlete] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mdFilter, setMdFilter] = useState('');
  const [activeTab, setActiveTab] = useState('intake'); // 'intake' | 'client' | 'table'

  // Selected client & plan state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [planInfo, setPlanInfo] = useState(null);
  const [planStruct, setPlanStruct] = useState(null);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Apply dark mode class to root body
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('amazona_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Load all dashboard & intake data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Cargar datos de Planes y Clientes (GAS / Mock)
      const { data: gasData, isLive: gasLive } = await fetchDashboardData();
      setDashboardData(gasData);
      setIsLiveGAS(gasLive);

      if (gasData.uniqueClients && gasData.uniqueClients.length > 0 && !selectedClient) {
        setSelectedClient(gasData.uniqueClients[0]);
      }

      // 2. Cargar datos de Formulario e Intake (Supabase / Mock)
      const { data: formResp, isLive: sbLive } = await fetchFormResponsesFromSupabase();
      setIntakeResponses(formResp);
      setIsLiveSupabase(sbLive);
    } catch (err) {
      console.error('Error general cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  // When selected client changes in Plan Viewer, auto-select latest MD file
  useEffect(() => {
    if (!dashboardData || !selectedClient) return;

    const clientMdFiles = (dashboardData.mdFiles || []).filter(
      m => (m['Cliente'] || '').toLowerCase() === selectedClient.toLowerCase()
    );

    if (clientMdFiles.length > 0) {
      const latestFileId = clientMdFiles[0]['MD file ID'];
      setSelectedFileId(latestFileId);
      loadPlanContent(latestFileId);
    } else {
      setSelectedFileId('');
      setPlanInfo(null);
      setPlanStruct(null);
      setRawMarkdown('');
    }
  }, [selectedClient, dashboardData]);

  const loadPlanContent = async (fileId) => {
    if (!fileId) return;
    setIsLoadingPlan(true);
    try {
      const plan = await fetchMarkdownPlan(fileId);
      setPlanInfo(plan);
      setRawMarkdown(plan.content || '');
      const parsed = parsePlanMarkdown(plan.content || '');
      setPlanStruct(parsed);
    } catch (err) {
      console.error('Error cargando plan markdown:', err);
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleSelectFile = (fileId) => {
    setSelectedFileId(fileId);
    loadPlanContent(fileId);
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    if (!dashboardData || !dashboardData.plans) return [];
    const q = normalize(searchQuery.trim());

    return dashboardData.plans.filter(p => {
      if (clientFilter && p['Cliente'] !== clientFilter) return false;
      if (monthFilter && p['Mes plan'] !== monthFilter) return false;
      if (statusFilter && p['Estado'] !== statusFilter) return false;
      if (mdFilter && p['MD existe'] !== mdFilter) return false;

      if (q) {
        const haystack = normalize(Object.values(p).join(' '));
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [dashboardData, searchQuery, clientFilter, monthFilter, statusFilter, mdFilter]);

  // Upcoming renewals
  const upcomingRenewals = useMemo(() => {
    if (!dashboardData) return [];
    return calculateUpcomingRenewals(
      dashboardData.uniqueClients || [],
      dashboardData.plans || [],
      dashboardData.mdFiles || [],
      10
    );
  }, [dashboardData]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setClientFilter('');
    setMonthFilter('');
    setStatusFilter('');
    setMdFilter('');
  };

  const handleSelectClientFromAnywhere = (client) => {
    setSelectedClient(client);
    setActiveTab('client');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleUpdateIntakeStatus = async (id, newStatus) => {
    await updateResponseStatusInSupabase(id, newStatus);
    setIntakeResponses(prev =>
      prev.map(item => item.id === id ? { ...item, estado_pago: newStatus } : item)
    );
    if (selectedIntakeAthlete && selectedIntakeAthlete.id === id) {
      setSelectedIntakeAthlete(prev => ({ ...prev, estado_pago: newStatus }));
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Si no está autenticado, mostrar pantalla de inicio de sesión
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="app-container">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isLiveSupabase={isLiveSupabase}
        onOpenSettings={() => setIsConfigOpen(true)}
        onRefresh={loadAllData}
        isLoading={isLoading}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="app-main-content">
        {/* Banner de Renovaciones Predictivas */}
        <RenewalBanner
          renewals={upcomingRenewals}
          onSelectClient={handleSelectClientFromAnywhere}
        />

        {/* Tarjetas KPI Superiores */}
        <KpiCards
          summary={dashboardData?.summary}
          onFilterStatus={(status) => {
            setStatusFilter(status);
            setActiveTab('table');
          }}
        />

        {/* Barra de Filtros y Selector de Pestañas */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          monthFilter={monthFilter}
          onMonthFilterChange={setMonthFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          mdFilter={mdFilter}
          onMdFilterChange={setMdFilter}
          uniqueClients={dashboardData?.uniqueClients || []}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetFilters={handleResetFilters}
          resultCount={activeTab === 'intake' ? intakeResponses.length : filteredPlans.length}
          intakeCount={intakeResponses.length}
        />

        {/* VISTA 1: Atletas del Formulario (Respuestas / Intake) */}
        {activeTab === 'intake' && (
          <IntakeListView
            responses={intakeResponses}
            onSelectResponse={setSelectedIntakeAthlete}
            onUpdateStatus={handleUpdateIntakeStatus}
            isLiveSupabase={isLiveSupabase}
          />
        )}

        {/* VISTA 2: Ficha Atleta + Data de Plan */}
        {activeTab === 'client' && (
          <div className="dashboard-split-view">
            <ClientDetail
              uniqueClients={dashboardData?.uniqueClients || []}
              selectedClient={selectedClient}
              onSelectClient={setSelectedClient}
              plans={dashboardData?.plans || []}
              mdFiles={dashboardData?.mdFiles || []}
              selectedFileId={selectedFileId}
              onSelectFile={handleSelectFile}
            />

            <PlanViewer
              planInfo={planInfo}
              planStruct={planStruct}
              rawMarkdown={rawMarkdown}
              isLoading={isLoadingPlan}
              clientName={selectedClient}
            />
          </div>
        )}

        {/* VISTA 3: Tabla General de Planes */}
        {activeTab === 'table' && (
          <PlansTable
            plans={filteredPlans}
            onSelectClient={handleSelectClientFromAnywhere}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-left">
          <strong>AMAZONA FITNESS DASHBOARD</strong>
          <span>Entrenamiento de precisión · Nutrición clínica · Optimización metabólica</span>
        </div>
        <div className="footer-right">
          <span>Versión 2.0 Pro · Blanco, Verde & Fucsia · Supabase & Clasp</span>
        </div>
      </footer>

      {/* Modal Ficha Individual Exhaustiva de Atleta (46 preguntas) */}
      <IntakeDetailModal
        athlete={selectedIntakeAthlete}
        onClose={() => setSelectedIntakeAthlete(null)}
        onUpdateStatus={handleUpdateIntakeStatus}
      />

      {/* Modal de Configuración Supabase & GAS */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={loadAllData}
      />
    </div>
  );
}
