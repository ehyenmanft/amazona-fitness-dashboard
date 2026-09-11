import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import RenewalBanner from './components/RenewalBanner';
import KpiCards from './components/KpiCards';
import FilterBar from './components/FilterBar';
import ClientDetail from './components/ClientDetail';
import PlanViewer from './components/PlanViewer';
import PlansTable from './components/PlansTable';
import ApiConfigModal from './components/ApiConfigModal';
import { fetchDashboardData, fetchMarkdownPlan } from './utils/api';
import { parsePlanMarkdown, normalize } from './utils/planParser';
import { calculateUpcomingRenewals } from './utils/renewals';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('amazona_theme') !== 'light';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Data state
  const [dashboardData, setDashboardData] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mdFilter, setMdFilter] = useState('');
  const [activeTab, setActiveTab] = useState('client');

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

  // Load dashboard data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, isLive: live } = await fetchDashboardData();
      setDashboardData(data);
      setIsLive(live);

      // Default select first client if none selected
      if (data.uniqueClients && data.uniqueClients.length > 0 && !selectedClient) {
        const firstClient = data.uniqueClients[0];
        setSelectedClient(firstClient);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected client changes, auto-select the latest MD file
  useEffect(() => {
    if (!dashboardData || !selectedClient) return;

    const clientMdFiles = (dashboardData.mdFiles || []).filter(
      m => (m['Cliente'] || '').toLowerCase() === selectedClient.toLowerCase()
    );

    if (clientMdFiles.length > 0) {
      const latestFileId = clientMdFiles[0]['MD file ID'];
      setSelectedFileId(latestFileId);
      loadPlanContent(latestFileId, selectedClient);
    } else {
      setSelectedFileId('');
      setPlanInfo(null);
      setPlanStruct(null);
      setRawMarkdown('');
    }
  }, [selectedClient, dashboardData]);

  // Load individual plan markdown
  const loadPlanContent = async (fileId, clientName) => {
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
    loadPlanContent(fileId, selectedClient);
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

  // Calculated upcoming renewals
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

  return (
    <div className="app-container">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isLive={isLive}
        onOpenSettings={() => setIsConfigOpen(true)}
        onRefresh={loadData}
        isLoading={isLoading}
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

        {/* Barra de Filtros y Tabs */}
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
          resultCount={filteredPlans.length}
        />

        {/* Vista: Ficha Atleta + Data de Plan */}
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

        {/* Vista: Tabla General de Planes */}
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
          <span>Versión 2.0 Pro · Compatible con Google Apps Script & Clasp</span>
        </div>
      </footer>

      {/* Modal de Configuración API */}
      <ApiConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={loadData}
      />
    </div>
  );
}
