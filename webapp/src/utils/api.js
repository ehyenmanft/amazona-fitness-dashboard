import { MOCK_DASHBOARD_DATA, SAMPLE_MARKDOWN_PLAN_1 } from '../data/mockData';

const LOCAL_STORAGE_URL_KEY = 'amazona_gas_webapp_url';
export const DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxSu99PSOWYxuH44sUwIDbtsNdnIIukpFOmEHYWB-RFwTOx423_nP5AIeNwDLRbqjZyhQ/exec';

export function getGasWebappUrl() {
  return localStorage.getItem(LOCAL_STORAGE_URL_KEY) || import.meta.env.VITE_GAS_WEBAPP_URL || DEFAULT_GAS_WEBAPP_URL;
}

export function setGasWebappUrl(url) {
  if (!url) {
    localStorage.removeItem(LOCAL_STORAGE_URL_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
  }
}

export async function fetchDashboardData() {
  const url = getGasWebappUrl();
  if (!url) {
    return { data: MOCK_DASHBOARD_DATA, isLive: false };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}action=data`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.summary) {
      throw new Error('Formato de datos no válido desde Apps Script');
    }

    return { data, isLive: true };
  } catch (err) {
    console.warn('No se pudo conectar con Apps Script Web App en vivo. Usando datos locales:', err);
    return { data: MOCK_DASHBOARD_DATA, isLive: false, error: err.message };
  }
}

export async function fetchMarkdownPlan(fileId) {
  const url = getGasWebappUrl();
  if (!url || !fileId) {
    // Check mock data
    const found = (MOCK_DASHBOARD_DATA.mdFiles || []).find(m => m['MD file ID'] === fileId);
    if (found && found.content) {
      return {
        fileId,
        name: found['Archivo MD'],
        url: found['MD URL'],
        content: found.content,
        updatedAt: found['Fecha actualización MD'] || ''
      };
    }
    return {
      fileId,
      name: 'Plan_Ejemplo.md',
      url: `https://drive.google.com/file/d/${fileId}/view`,
      content: SAMPLE_MARKDOWN_PLAN_1,
      updatedAt: new Date().toISOString()
    };
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}action=markdown&fileId=${encodeURIComponent(fileId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`Error obteniendo markdown para ${fileId}:`, err);
    const found = (MOCK_DASHBOARD_DATA.mdFiles || []).find(m => m['MD file ID'] === fileId);
    return {
      fileId,
      name: found ? found['Archivo MD'] : 'Plan_Ejemplo.md',
      url: `https://drive.google.com/file/d/${fileId}/view`,
      content: found && found.content ? found.content : SAMPLE_MARKDOWN_PLAN_1,
      updatedAt: new Date().toISOString()
    };
  }
}
