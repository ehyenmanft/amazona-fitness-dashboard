export function parseDateFlexible(value) {
  if (!value) return null;
  const parts = String(value).split(';').map(x => x.trim()).filter(Boolean);
  for (const raw of parts) {
    let s = raw;
    let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

export function formatDateES(date) {
  if (!date || isNaN(new Date(date).getTime())) return '—';
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffDays(a, b) {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.ceil((db - da) / (1000 * 60 * 60 * 24));
}

export function normalizeName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getClientRenewalSummary(client, plans = [], mdFiles = []) {
  const norm = normalizeName(client);
  const rows = plans.filter(p => normalizeName(p['Cliente']) === norm);
  const dates = [];

  rows.forEach(row => {
    const rawDate = row['Fecha carga PDF'];
    if (!rawDate) return;
    String(rawDate).split(';').map(x => x.trim()).filter(Boolean).forEach(piece => {
      const d = parseDateFlexible(piece);
      if (d && !isNaN(d.getTime())) {
        dates.push({
          date: d,
          month: row['Mes plan'] || '',
          state: row['Estado'] || ''
        });
      }
    });
  });

  if (!dates.length) {
    const mdRows = mdFiles.filter(m => normalizeName(m['Cliente']) === norm);
    const monthMap = {
      Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
      Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11
    };
    mdRows.forEach(m => {
      const mes = m['Mes plan'];
      if (monthMap[mes] !== undefined) {
        const d = new Date(new Date().getFullYear(), monthMap[mes], 1);
        dates.push({ date: d, month: mes, state: 'Data' });
      }
    });
  }

  dates.sort((a, b) => a.date - b.date);

  const uniqueDates = [];
  const seen = new Set();
  dates.forEach(item => {
    const key = formatDateES(item.date);
    if (!seen.has(key)) {
      uniqueDates.push(item);
      seen.add(key);
    }
  });

  if (!uniqueDates.length) {
    return {
      client,
      dates: [],
      frequency: null,
      frequencyText: 'Sin frecuencia calculable',
      renewalDate: null,
      renewalText: 'Sin fecha estimada',
      daysLeft: null,
      planCount: 0
    };
  }

  let frequency = 30;
  let frequencyText = '30 días estimados';

  if (uniqueDates.length >= 2) {
    const intervals = [];
    for (let i = 1; i < uniqueDates.length; i++) {
      const days = diffDays(uniqueDates[i - 1].date, uniqueDates[i].date);
      if (days > 0) intervals.push(days);
    }
    if (intervals.length) {
      frequency = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      frequencyText = intervals.length === 1
        ? `${intervals[0]} días`
        : `${frequency} días promedio (${intervals.join(', ')} días)`;
    }
  }

  const lastPlan = uniqueDates[uniqueDates.length - 1];
  const renewalDate = addDays(lastPlan.date, frequency);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = diffDays(today, renewalDate);

  return {
    client,
    dates: uniqueDates,
    lastPlanDate: lastPlan.date,
    lastPlanMonth: lastPlan.month,
    frequency,
    frequencyText,
    renewalDate,
    renewalText: formatDateES(renewalDate),
    daysLeft,
    planCount: uniqueDates.length
  };
}

export function calculateUpcomingRenewals(clients, plans, mdFiles, daysWindow = 10) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - daysWindow);

  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + daysWindow);

  return clients
    .map(c => getClientRenewalSummary(c, plans, mdFiles))
    .filter(item => item.renewalDate && item.renewalDate >= windowStart && item.renewalDate <= windowEnd)
    .sort((a, b) => a.renewalDate - b.renewalDate);
}
