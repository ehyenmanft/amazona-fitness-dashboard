/**
 * AMAZONA FITNESS · WEB APP
 * Dashboard de clientes, planes, PDFs y Data de Plan individual.
 *
 * Incluye:
 * - Lectura desde Google Sheets.
 * - Lectura directa de archivos .md desde Drive aunque no estén en MD_Files.
 * - Sincronización automática de archivos .md hacia la hoja MD_Files.
 * - Cache temporal para evitar escanear Drive en cada carga.
 * - Triggers automáticos para sincronización periódica.
 */

const APP_TITLE = 'Amazona Fitness';

/**
 * ID de la Google Sheet nativa donde están:
 * Planes, Clientes, MD_Files, Resumen
 */
const SPREADSHEET_ID = '1qURCA92_nkD2htpCDuFJkVNKl-Y4IKcdRRGttFdrq7A';

const PLANES_SHEET_NAME = 'Planes';
const CLIENTES_SHEET_NAME = 'Clientes';
const MD_SHEET_NAME = 'MD_Files';

/**
 * ID de la carpeta principal donde cargas los archivos .md.
 * Puede ser la carpeta principal o una subcarpeta.
 * La función también escanea subcarpetas internas.
 */
const MD_FOLDER_ID = '19EsO0JACo3vk2JK6if7oxwEsOGFt3fRP';

const MD_CACHE_KEY = 'amazona_drive_md_files_v2';
const MD_CACHE_SECONDS = 300;


/**
 * Entrada principal de la web app.
 */
function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'data') {
      const data = getDashboardData();
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (e.parameter.action === 'markdown' && e.parameter.fileId) {
      try {
        const md = getMarkdownContent(e.parameter.fileId);
        return ContentService.createTextOutput(JSON.stringify(md))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Utilidad para incluir HTML parcial si luego agregas más archivos HTML.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/**
 * Lee una hoja como lista de objetos usando la fila 1 como encabezado.
 */
function readSheetObjects_(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('No existe la hoja: ' + sheetName);
  }

  const values = sheet.getDataRange().getDisplayValues();

  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0].map(h => String(h).trim());

  return values
    .slice(1)
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
}


/**
 * Lee una hoja de manera segura.
 * Si no existe, devuelve [] en vez de romper la app.
 */
function safeReadSheetObjects_(sheetName) {
  try {
    return readSheetObjects_(sheetName);
  } catch (err) {
    Logger.log('Aviso leyendo hoja ' + sheetName + ': ' + err.message);
    return [];
  }
}


/**
 * Datos principales que consume el dashboard.
 * Ahora combina:
 * - Planes
 * - Clientes
 * - MD_Files
 * - Archivos .md detectados directamente desde Drive
 */
function getDashboardData() {
  const plans = safeReadSheetObjects_(PLANES_SHEET_NAME);
  const clients = safeReadSheetObjects_(CLIENTES_SHEET_NAME);
  const mdFilesFromSheet = safeReadSheetObjects_(MD_SHEET_NAME);

  /**
   * Lee archivos .md directamente desde Drive, aunque no estén registrados
   * todavía en MD_Files.
   */
  const mdFilesFromDrive = getMDFilesDirectlyFromDrive_();

  /**
   * Une MD_Files + Drive directo, evitando duplicados por ID.
   */
  const mdFilesMap = new Map();

  mdFilesFromSheet.forEach(item => {
    const id = String(item['MD file ID'] || '').trim();

    if (id) {
      mdFilesMap.set(id, {
        'Cliente': item['Cliente'] || '',
        'Mes plan': item['Mes plan'] || '',
        'Archivo MD': item['Archivo MD'] || '',
        'MD file ID': id,
        'MD URL': item['MD URL'] || '',
        'Fecha carga MD': item['Fecha carga MD'] || '',
        'Fecha actualización MD': item['Fecha actualización MD'] || '',
        'Origen': item['Origen'] || 'MD_Files'
      });
    }
  });

  mdFilesFromDrive.forEach(item => {
    const id = String(item['MD file ID'] || '').trim();

    if (id && !mdFilesMap.has(id)) {
      mdFilesMap.set(id, item);
    }
  });

  const mdFiles = Array.from(mdFilesMap.values());

  const uniqueClients = Array.from(new Set([
    ...plans.map(p => p['Cliente']),
    ...clients.map(c => c['Cliente']),
    ...mdFiles.map(m => m['Cliente'])
  ].filter(Boolean))).sort();

  return {
    summary: {
      appTitle: APP_TITLE,
      spreadsheetId: SPREADSHEET_ID,
      generatedAt: new Date().toISOString(),
      clientsCount: uniqueClients.length,
      plansCount: plans.length,
      mdFilesCount: mdFiles.length,
      pdfMdCount: plans.filter(p => p['Estado'] === 'PDF+MD').length,
      missingMdCount: plans.filter(p => p['Estado'] === 'PDF sin MD exacto').length,
      mdOnlyCount: plans.filter(p => p['Estado'] === 'MD solo').length
    },
    plans: plans,
    clients: clients,
    mdFiles: mdFiles,
    uniqueClients: uniqueClients
  };
}


/**
 * Lee directamente desde Drive todos los archivos .md encontrados en la carpeta
 * configurada y sus subcarpetas.
 *
 * Usa cache de 5 minutos para no escanear Drive en cada recarga.
 */
function getMDFilesDirectlyFromDrive_() {
  const cache = CacheService.getScriptCache();

  try {
    const cached = cache.get(MD_CACHE_KEY);

    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    Logger.log('No se pudo leer cache MD: ' + err.message);
  }

  const folder = DriveApp.getFolderById(MD_FOLDER_ID);
  const results = [];

  scanDriveFolderForMDFilesAsObjects_(folder, results);

  try {
    const payload = JSON.stringify(results);

    /**
     * CacheService tiene límite de tamaño. Si algún día crece demasiado,
     * simplemente no cachea y sigue funcionando.
     */
    if (payload.length < 95000) {
      cache.put(MD_CACHE_KEY, payload, MD_CACHE_SECONDS);
    }
  } catch (err) {
    Logger.log('No se pudo guardar cache MD: ' + err.message);
  }

  return results;
}


/**
 * Escanea una carpeta y sus subcarpetas buscando archivos .md
 * y los devuelve como objetos compatibles con la webapp.
 */
function scanDriveFolderForMDFilesAsObjects_(folder, results) {
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (!name.toLowerCase().endsWith('.md')) continue;

    const parsed = extraerDatosDesdeNombreMD_(name);

    results.push({
      'Cliente': parsed.cliente,
      'Mes plan': parsed.mes,
      'Archivo MD': name,
      'MD file ID': file.getId(),
      'MD URL': file.getUrl(),
      'Fecha carga MD': file.getDateCreated()
        ? file.getDateCreated().toISOString()
        : '',
      'Fecha actualización MD': file.getLastUpdated()
        ? file.getLastUpdated().toISOString()
        : '',
      'Origen': 'Drive directo'
    });
  }

  const folders = folder.getFolders();

  while (folders.hasNext()) {
    scanDriveFolderForMDFilesAsObjects_(folders.next(), results);
  }
}


/**
 * Limpia la cache de archivos MD detectados desde Drive.
 * Útil si acabas de subir un archivo y quieres verlo de inmediato.
 */
function limpiarCacheMDFilesDrive() {
  CacheService.getScriptCache().remove(MD_CACHE_KEY);
  Logger.log('Cache de archivos MD eliminada.');
}


/**
 * Lee el contenido crudo de un archivo .md desde Drive.
 */
function getMarkdownContent(fileId) {
  if (!fileId) {
    throw new Error('Falta fileId de la Data de Plan.');
  }

  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();

  let text = blob.getDataAsString('UTF-8');
  text = text.replace(/^\uFEFF/, '');

  return {
    fileId: fileId,
    name: file.getName(),
    url: file.getUrl(),
    content: text,
    updatedAt: file.getLastUpdated()
      ? file.getLastUpdated().toISOString()
      : '',
    createdAt: file.getDateCreated()
      ? file.getDateCreated().toISOString()
      : ''
  };
}


/****************************************************
 * SINCRONIZADOR DE DATA DE PLAN
 * Escanea Drive y agrega archivos .md nuevos a MD_Files.
 ****************************************************/

function sincronizarMDFilesDesdeCarpeta() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateMDFilesSheet_(ss);

  ensureMDFilesHeaders_(sheet);

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  const idCol = headers.indexOf('MD file ID');

  if (idCol === -1) {
    throw new Error('No existe la columna "MD file ID" en MD_Files.');
  }

  const existingIds = new Set(
    data
      .slice(1)
      .map(row => String(row[idCol] || '').trim())
      .filter(Boolean)
  );

  const folder = DriveApp.getFolderById(MD_FOLDER_ID);
  const nuevosObjetos = [];

  scanFolderForMDFilesToSync_(folder, existingIds, nuevosObjetos);

  if (!nuevosObjetos.length) {
    limpiarCacheMDFilesDrive();

    Logger.log('No se encontraron Data de Plan nuevas.');

    return {
      added: 0,
      message: 'No se encontraron Data de Plan nuevas.'
    };
  }

  const rows = nuevosObjetos.map(obj =>
    headers.map(header => obj[header] || '')
  );

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
    .setValues(rows);

  limpiarCacheMDFilesDrive();

  Logger.log('Data de Plan nuevas agregadas: ' + rows.length);

  return {
    added: rows.length,
    message: 'Data de Plan nuevas agregadas: ' + rows.length
  };
}


/**
 * Obtiene o crea la hoja MD_Files.
 */
function getOrCreateMDFilesSheet_(ss) {
  let sheet = ss.getSheetByName(MD_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(MD_SHEET_NAME);
    sheet.appendRow(getMDFilesHeaders_());
    return sheet;
  }

  return sheet;
}


/**
 * Encabezados estándar para MD_Files.
 */
function getMDFilesHeaders_() {
  return [
    'Cliente',
    'Mes plan',
    'Archivo MD',
    'MD file ID',
    'MD URL',
    'Fecha carga MD',
    'Fecha actualización MD',
    'Origen'
  ];
}


/**
 * Asegura que MD_Files tenga todos los encabezados necesarios.
 * Si faltan columnas, las agrega al final sin borrar datos existentes.
 */
function ensureMDFilesHeaders_(sheet) {
  const required = getMDFilesHeaders_();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(required);
    return;
  }

  const currentRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1));
  const current = currentRange.getValues()[0].map(h => String(h).trim());

  if (!current.some(Boolean)) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    return;
  }

  const missing = required.filter(header => !current.includes(header));

  if (missing.length) {
    sheet
      .getRange(1, current.length + 1, 1, missing.length)
      .setValues([missing]);
  }
}


/**
 * Escanea carpeta y subcarpetas para sincronizar nuevos .md hacia MD_Files.
 */
function scanFolderForMDFilesToSync_(folder, existingIds, nuevosObjetos) {
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (!name.toLowerCase().endsWith('.md')) continue;
    if (existingIds.has(file.getId())) continue;

    const parsed = extraerDatosDesdeNombreMD_(name);

    nuevosObjetos.push({
      'Cliente': parsed.cliente,
      'Mes plan': parsed.mes,
      'Archivo MD': name,
      'MD file ID': file.getId(),
      'MD URL': file.getUrl(),
      'Fecha carga MD': file.getDateCreated()
        ? file.getDateCreated().toISOString()
        : '',
      'Fecha actualización MD': file.getLastUpdated()
        ? file.getLastUpdated().toISOString()
        : '',
      'Origen': 'Sincronizado desde Drive'
    });

    existingIds.add(file.getId());
  }

  const folders = folder.getFolders();

  while (folders.hasNext()) {
    scanFolderForMDFilesToSync_(folders.next(), existingIds, nuevosObjetos);
  }
}


/**
 * Compatibilidad con versiones anteriores.
 * Si en tu código viejo se llama scanFolderForMDFiles_, esta función redirige.
 */
function scanFolderForMDFiles_(folder, existingIds, nuevos) {
  const nuevosObjetos = [];

  scanFolderForMDFilesToSync_(folder, existingIds, nuevosObjetos);

  nuevosObjetos.forEach(obj => {
    nuevos.push([
      obj['Cliente'],
      obj['Mes plan'],
      obj['Archivo MD'],
      obj['MD file ID'],
      obj['MD URL']
    ]);
  });
}


/**
 * Extrae cliente y mes desde el nombre del archivo MD.
 */
function extraerDatosDesdeNombreMD_(filename) {
  const clean = filename.replace(/\.md$/i, '');

  let mes = '';

  if (/enero/i.test(clean)) mes = 'Enero';
  else if (/febrero/i.test(clean)) mes = 'Febrero';
  else if (/marzo/i.test(clean)) mes = 'Marzo';
  else if (/abril/i.test(clean)) mes = 'Abril';
  else if (/mayo/i.test(clean)) mes = 'Mayo';
  else if (/junio/i.test(clean)) mes = 'Junio';
  else if (/julio/i.test(clean)) mes = 'Julio';
  else if (/agosto/i.test(clean)) mes = 'Agosto';
  else if (/septiembre/i.test(clean)) mes = 'Septiembre';
  else if (/octubre/i.test(clean)) mes = 'Octubre';
  else if (/noviembre/i.test(clean)) mes = 'Noviembre';
  else if (/diciembre/i.test(clean)) mes = 'Diciembre';

  let cliente = clean
    .replace(/plan/gi, ' ')
    .replace(/completo/gi, ' ')
    .replace(/renovacion|renovación/gi, ' ')
    .replace(/ajuste/gi, ' ')
    .replace(/protocolo/gi, ' ')
    .replace(/suplementacion|suplementación/gi, ' ')
    .replace(/data/gi, ' ')
    .replace(/nutricion|nutrición/gi, ' ')
    .replace(/entrenamiento/gi, ' ')
    .replace(/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/gi, ' ')
    .replace(/2024|2025|2026|2027|2028|2029|2030/gi, ' ')
    .replace(/v\d+/gi, ' ')
    .replace(/\(\d+\)/g, ' ')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cliente) {
    cliente = clean;
  }

  return {
    cliente: normalizarNombreCliente_(cliente),
    mes: mes || 'Sin mes'
  };
}


/**
 * Normaliza nombres extraídos desde archivos.
 */
function normalizarNombreCliente_(name) {
  return String(name || '')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}


/****************************************************
 * TRIGGERS
 ****************************************************/

/**
 * Crea un trigger automático para sincronizar cada hora.
 * Ejecuta esta función una sola vez manualmente.
 */
function crearTriggerSincronizacionMD() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sincronizarMDFilesDesdeCarpeta') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sincronizarMDFilesDesdeCarpeta')
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log('Trigger creado: sincronizarMDFilesDesdeCarpeta cada hora.');
}


/**
 * Crea un trigger automático cada 15 minutos.
 * Usa este si quieres una actualización más rápida.
 */
function crearTriggerSincronizacionMD15Min() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sincronizarMDFilesDesdeCarpeta') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('sincronizarMDFilesDesdeCarpeta')
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log('Trigger creado: sincronizarMDFilesDesdeCarpeta cada 15 minutos.');
}


/**
 * Elimina triggers de sincronización.
 */
function eliminarTriggerSincronizacionMD() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sincronizarMDFilesDesdeCarpeta') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log('Trigger de sincronización eliminado.');
}


/****************************************************
 * FUNCIONES DE PRUEBA
 ****************************************************/

/**
 * Prueba conexión con la Google Sheet.
 */
function testConexionBase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  Logger.log('Archivo conectado: ' + ss.getName());
  Logger.log('URL: ' + ss.getUrl());

  const hojas = ss.getSheets().map(s => s.getName());
  Logger.log('Hojas encontradas: ' + hojas.join(', '));

  const planes = ss.getSheetByName(PLANES_SHEET_NAME);
  const clientes = ss.getSheetByName(CLIENTES_SHEET_NAME);
  const md = ss.getSheetByName(MD_SHEET_NAME);

  Logger.log('Planes existe: ' + Boolean(planes));
  Logger.log('Clientes existe: ' + Boolean(clientes));
  Logger.log('MD_Files existe: ' + Boolean(md));

  if (planes) {
    Logger.log('Filas Planes: ' + planes.getLastRow());
    Logger.log('Columnas Planes: ' + planes.getLastColumn());
  }

  if (md) {
    Logger.log('Filas MD_Files: ' + md.getLastRow());
    Logger.log('Columnas MD_Files: ' + md.getLastColumn());
  }
}


/**
 * Prueba lectura de un archivo MD.
 * Cambia el ID si quieres probar otro archivo.
 */
function testMarkdownAccess() {
  const testId = '1tTuBvdA6rJZkASjftNTTn2MGmyARuY_8';
  const result = getMarkdownContent(testId);

  Logger.log('Nombre: ' + result.name);
  Logger.log('URL: ' + result.url);
  Logger.log('Creado: ' + result.createdAt);
  Logger.log('Actualizado: ' + result.updatedAt);
  Logger.log('Contenido inicial:');
  Logger.log(result.content.substring(0, 500));
}


/**
 * Prueba general de datos del dashboard.
 */
function testDashboardData() {
  const data = getDashboardData();

  Logger.log('Clientes: ' + data.summary.clientsCount);
  Logger.log('Planes: ' + data.summary.plansCount);
  Logger.log('Data de Plan indexada + Drive directo: ' + data.summary.mdFilesCount);

  if (data.uniqueClients.length) {
    Logger.log('Primer cliente: ' + data.uniqueClients[0]);
  }
}


/**
 * Prueba lectura directa de Drive sin depender de MD_Files.
 */
function testMDFilesDirectosDrive() {
  limpiarCacheMDFilesDrive();

  const files = getMDFilesDirectlyFromDrive_();

  Logger.log('Archivos MD encontrados directamente en Drive: ' + files.length);

  files.slice(0, 10).forEach(file => {
    Logger.log(file['Cliente'] + ' | ' + file['Mes plan'] + ' | ' + file['Archivo MD']);
  });
}