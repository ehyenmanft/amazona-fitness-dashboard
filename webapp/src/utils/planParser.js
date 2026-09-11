export const SECTION_ORDER = ['perfil', 'nutricion', 'suplementacion', 'entrenamiento', 'recomendaciones', 'checklist', 'otros'];

export const SECTION_META = {
  perfil: { label: 'Perfil y Evaluación', icon: 'UserCheck', color: '#3b82f6' },
  nutricion: { label: 'Nutrición y Macros', icon: 'Salad', color: '#10b981' },
  suplementacion: { label: 'Suplementación', icon: 'Pill', color: '#8b5cf6' },
  entrenamiento: { label: 'Entrenamiento y Rutina', icon: 'Dumbbell', color: '#ef3f68' },
  recomendaciones: { label: 'Recomendaciones y Hábitos', icon: 'Lightbulb', color: '#f59e0b' },
  checklist: { label: 'Checklist y Seguimiento', icon: 'CheckSquare', color: '#06b6d4' },
  otros: { label: 'Otros Detalles', icon: 'FileText', color: '#64748b' }
};

export function normalize(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function categorizeHeading(text) {
  const t = normalize(text);
  if (/perfil|datos.*cliente|cliente|evaluacion|diagnostico|objetivo|medidas|antropometr/.test(t)) return 'perfil';
  if (/nutricion|alimentacion|comida|menu|macros|caloria|proteina|carbohidrato|grasa|hidratacion|desayuno|almuerzo|cena|merienda/.test(t)) return 'nutricion';
  if (/suplement|creatina|proteina whey|omega|magnesio|vitamina|glutamina|bcaa|pre entreno|preentreno/.test(t)) return 'suplementacion';
  if (/entrenamiento|rutina|ejercicio|series|repeticiones|cardio|pierna|gluteo|pecho|espalda|hombro|biceps|triceps|pesas|gym|gimnasio/.test(t)) return 'entrenamiento';
  if (/recomendacion|habito|descanso|sueno|estres|indicacion|nota|observacion|seguimiento|ajuste/.test(t)) return 'recomendaciones';
  if (/checklist|lista|control|diario|semanal|cumplimiento|monitoreo/.test(t)) return 'checklist';
  return 'otros';
}

function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && isTableLine(lines[i])) {
    if (!isSeparator(lines[i])) {
      let cells = lines[i].trim();
      if (cells.startsWith('|')) cells = cells.slice(1);
      if (cells.endsWith('|')) cells = cells.slice(0, -1);
      rows.push(cells.split('|').map(c => c.trim()));
    }
    i++;
  }
  const headers = rows.shift() || [];
  return { headers, rows, next: i };
}

function parseList(lines, start) {
  const items = [];
  let i = start;
  while (i < lines.length && /^\s*(?:[-*•]|\d+\.)\s+/.test(lines[i])) {
    items.push(lines[i].replace(/^\s*(?:[-*•]|\d+\.)\s+/, '').trim());
    i++;
  }
  return { items, next: i };
}

function colonPairs(text) {
  const pairs = [];
  text.split('\n').forEach(line => {
    const m = line.match(/^\s*([^:]{2,60}):\s*(.+?)\s*$/);
    if (m) pairs.push({ key: m[1].trim(), value: m[2].trim() });
  });
  return pairs;
}

export function parsePlanMarkdown(md) {
  if (!md) return null;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const sections = {};
  
  SECTION_ORDER.forEach(k => {
    sections[k] = {
      key: k,
      label: SECTION_META[k]?.label || k,
      blocks: [],
      raw: []
    };
  });

  let current = 'otros';
  let currentTitle = 'Inicio';
  let buffer = [];

  function flushParagraph() {
    if (buffer.length) {
      const text = buffer.join('\n').trim();
      if (text) {
        sections[current].blocks.push({
          type: 'text',
          title: currentTitle,
          content: text
        });
      }
      buffer = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);

    if (h) {
      flushParagraph();
      currentTitle = h[2].replace(/[*_`]/g, '').trim();
      current = categorizeHeading(currentTitle);
      sections[current].raw.push(line);
      sections[current].blocks.push({
        type: 'heading',
        title: currentTitle,
        level: h[1].length
      });
      continue;
    }

    if (isTableLine(line)) {
      flushParagraph();
      const parsed = parseTable(lines, i);
      sections[current].blocks.push({
        type: 'table',
        title: currentTitle,
        headers: parsed.headers,
        rows: parsed.rows
      });
      i = parsed.next - 1;
      continue;
    }

    if (/^\s*(?:[-*•]|\d+\.)\s+/.test(line)) {
      flushParagraph();
      const parsed = parseList(lines, i);
      sections[current].blocks.push({
        type: 'list',
        title: currentTitle,
        items: parsed.items
      });
      i = parsed.next - 1;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      continue;
    }

    buffer.push(line);
  }

  flushParagraph();

  // Convert text blocks with >= 2 colon pairs to key-value grids
  Object.values(sections).forEach(sec => {
    sec.blocks = sec.blocks.map(b => {
      if (b.type === 'text') {
        const pairs = colonPairs(b.content);
        if (pairs.length >= 2) return { ...b, type: 'kv', pairs };
      }
      return b;
    });
  });

  return sections;
}
