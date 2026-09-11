/**
 * Utilidades de Parseo de Fechas y Normalización de Respuestas de Atletas (Intake)
 * Compatible con Google Sheets (D/M/YYYY H:mm:ss) y Supabase (ISO TIMESTAMPTZ).
 */

/**
 * Parsea de manera segura cualquier fecha (string D/M/YYYY, ISO, timestamp numérico o Date).
 * Devuelve un objeto Date válido o null si no se puede parsear.
 */
export function parseSheetDate(rawDate) {
  if (!rawDate) return null;
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) return rawDate;

  if (typeof rawDate === 'number') {
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // 1. Intento con formato D/M/YYYY o DD/MM/YYYY con o sin hora (típico de Google Sheets)
  // Ejemplos: "8/11/2024 20:17:20", "14/11/2024 23:52:40", "03/12/2024"
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed en JS
    const year = parseInt(dmyMatch[3], 10);
    const hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // 2. Intento con formato ISO (YYYY-MM-DD o YYYY/MM/DD)
  const isoMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?/);
  if (isoMatch) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // 3. Intento genérico Date.parse
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Formatea una fecha para visualización en español.
 * Ej: "08/11/2024, 8:17 p. m." o "08/11/2024"
 */
export function formatDateDisplay(rawDate, { withTime = true, shortMonth = false } = {}) {
  const d = parseSheetDate(rawDate);
  if (!d) return '—';

  try {
    if (shortMonth) {
      // Ej: "8 nov 2024, 20:17"
      const day = d.getDate();
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      if (!withTime) return `${day} ${month} ${year}`;
      const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${day} ${month} ${year}, ${timeStr}`;
    }

    // Formato estándar DD/MM/YYYY con hora
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const datePart = `${day}/${month}/${year}`;

    if (!withTime) return datePart;

    const timePart = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return '—';
  }
}

/**
 * Normaliza un registro de atleta proveniente de Google Sheets o Supabase
 * asegurando compatibilidad total con los 46 campos del formulario.
 */
export function normalizeAthlete(raw, index = 0) {
  if (!raw) return null;

  // Fecha
  const rawDate = raw.marca_temporal || raw.fecha || raw['Marca temporal'] || raw.created_at || '';
  const parsedDate = parseSheetDate(rawDate);
  const timestamp = parsedDate ? parsedDate.getTime() : 0;
  const fechaDisplay = formatDateDisplay(parsedDate, { withTime: true });

  // Nombre
  const nombreCompleto = (
    raw.nombre_completo ||
    raw.nombre ||
    raw['Nombre Completo'] ||
    raw['Nombre completo'] ||
    ''
  ).trim();

  // Contacto
  const email = (
    raw.email ||
    raw.email_direccion ||
    raw['Correo electrónico'] ||
    raw['Correo electrnico'] ||
    raw['Dirección de correo electrónico'] ||
    raw['Direccin de correo electrnico'] ||
    ''
  ).trim();

  const telefono = (
    raw.telefono ||
    raw['Número de Teléfono de contacto (Mensajería, Whatsapp...)'] ||
    raw['Nmero de Telfono de contacto (Mensajera, Whatsapp...)'] ||
    raw['Teléfono'] ||
    ''
  ).trim();

  // Ubicación y medidas
  const paisCiudad = (
    raw.pais_ciudad ||
    raw['País y Ciudad de Residencia (Para tener en cuenta zonas horarias y opciones de alimentos locales):'] ||
    raw['Pas y Ciudad de Residencia (Para tener en cuenta zonas horarias y opciones de alimentos locales):'] ||
    raw['Pais y Ciudad de Residencia'] ||
    ''
  ).trim();

  const edad = raw.edad || raw['Edad'] || '';
  const genero = (raw.genero || raw['Genero'] || raw['Género'] || '').trim();
  const estaturaM = raw.estatura_m || raw['Estatura (en mtrs):'] || raw['Estatura'] || '';
  const pesoActualKg = raw.peso_actual_kg || raw['Peso Actual  (en kg):'] || raw['Peso Actual (en kg):'] || raw['Peso Actual'] || '';
  const pesoIdealKg = raw.peso_ideal_kg || raw['Peso ideal o meta (en kg):'] || raw['Peso ideal'] || '';

  // Objetivos
  const objetivoPrincipal = (
    raw.objetivo_principal ||
    raw.plan_interes ||
    raw['¿Cuál es tu objetivo principal?'] ||
    raw['Cul es tu objetivo principal?'] ||
    raw['Cual es tu objetivo principal?'] ||
    ''
  ).trim();

  const importanciaObjetivo = raw.importancia_objetivo || raw['¿Qué tan importante es este objetivo para ti? (1 a 10):'] || raw['Qu tan importante es este objetivo para ti? (1 a 10):'] || '';
  const motivacion = (raw.motivacion || raw['¿Qué te motiva a alcanzar este objetivo? (Salud, apariencia, bienestar mental, etc.)'] || raw['Qu te motiva a alcanzar este objetivo? (Salud, apariencia, bienestar mental, etc.)'] || '').trim();
  const fechaLimite = (raw.fecha_limite || raw['¿Tienes una fecha límite o meta de tiempo para alcanzar tu objetivo? (Especificar meses):'] || raw['Tienes una fecha lmite o meta de tiempo para alcanzar tu objetivo? (Especificar meses):'] || '').trim();
  const objetivosEspecificos = (raw.objetivos_especificos || raw['¿Tienes objetivos específicos adicionales? (Ej.: reducir cintura, aumentar fuerza, etc.):'] || raw['Tienes objetivos especficos adicionales? (Ej.: reducir cintura, aumentar fuerza, etc.):'] || '').trim();

  // Entrenamiento
  const disciplinaDeportiva = (raw.disciplina_deportiva || raw['Práctica alguna disciplina deportiva? (Si no está en la lista, seleccione "Otra")'] || raw['Prctica alguna disciplina deportiva? (Si no est en la lista, seleccione "Otra")'] || '').trim();
  const nivelExperiencia = (raw.nivel_experiencia || raw['¿Cuál es tu nivel de experiencia en entrenamiento?'] || raw['Cul es tu nivel de experiencia en entrenamiento?'] || '').trim();
  const diasEntrenamiento = (raw.dias_entrenamiento || raw['¿Cuántos días a la semana estás dispuesto a entrenar?'] || raw['Cuntos das a la semana ests dispuesto a entrenar?'] || '').trim();
  const experienciaPesas = (raw.experiencia_pesas || raw['¿Tienes experiencia previa con pesas o máquinas de gimnasio?'] || raw['Tienes experiencia previa con pesas o mquinas de gimnasio?'] || '').trim();
  const deporteRegular = (raw.deporte_regular || raw['¿Realizas o realizabas algún deporte regularmente? (Especificar):'] || raw['Realizas o realizabas algn deporte regularmente? (Especificar):'] || '').trim();
  const lugarEntrenamiento = (raw.lugar_entrenamiento || raw['¿Tienes acceso a un gimnasio o prefieres entrenar en casa?'] || raw['Tienes acceso a un gimnasio o prefieres entrenar en casa?'] || '').trim();
  const equipoCasa = (raw.equipo_casa || raw['¿Qué equipo tienes disponible para entrenar en casa? (Pesas, bandas, etc.):'] || raw['Qu equipo tienes disponible para entrenar en casa? (Pesas, bandas, etc.):'] || '').trim();
  const tiempoEjercicio = (raw.tiempo_ejercicio || raw['¿Cuántos horas al día o minutos puedes dedicar al ejercicio? (aproximadamente):'] || raw['Cuntos horas al da o minutos puedes dedicar al ejercicio? (aproximadamente):'] || '').trim();
  const tipoEjercicioActual = (raw.tipo_ejercicio_actual || raw['¿Qué tipo de ejercicio haces actualmente? (Cardio, pesas, yoga, etc.):'] || raw['Qu tipo de ejercicio haces actualmente? (Cardio, pesas, yoga, etc.):'] || '').trim();

  // Hábitos y Nutrición
  const horasSueno = (raw.horas_sueno || raw['¿Cuántas horas duermes por noche en promedio?'] || raw['Cuntas horas duermes por noche en promedio?'] || '').trim();
  const nivelEstres = (raw.nivel_estres || raw['¿Cómo calificarías tu nivel de estrés? (Bajo, medio, alto):'] || raw['Cmo calificaras tu nivel de estrs? (Bajo, medio, alto):'] || '').trim();
  const consumoAguaLitros = (raw.consumo_agua_litros || raw['¿Cuánto agua consumes al día (en litros)?'] || raw['Cunto agua consumes al da (en litros)?'] || '').trim();
  const consumoCafe = (raw.consumo_cafe || raw['¿Consumes café o bebidas energéticas? (Especificar cantidad diaria):'] || raw['Consumes caf o bebidas energticas? (Especificar cantidad diaria):'] || '').trim();
  const dietaActual = (raw.dieta_actual || raw['¿Sigues algún tipo de dieta actualmente? (Keto, vegetariana, omnívora, etc.):'] || raw['Sigues algn tipo de dieta actualmente? (Keto, vegetariana, omnvora, etc.):'] || '').trim();
  const alergiasAlimenticias = (raw.alergias_alimenticias || raw['¿Tienes alergias o intolerancias alimenticias? (Ej.: gluten, lactosa):'] || raw['Tienes alergias o intolerancias alimenticias? (Ej.: gluten, lactosa):'] || '').trim();
  const alimentosEvitar = (raw.alimentos_evitar || raw['¿Hay alimentos que prefieres evitar? (Especificar):'] || raw['Hay alimentos que prefieres evitar? (Especificar):'] || '').trim();
  const alimentosPreferidos = (raw.alimentos_preferidos || raw['¿Qué alimentos prefieres incluir en tu dieta? (Ej.: pescados, carnes magras, vegetales):'] || raw['Qu alimentos prefieres incluir en tu dieta? (Ej.: pescados, carnes magras, vegetales):'] || '').trim();
  const horariosComidas = (raw.horarios_comidas || raw['¿Tienes horarios específicos para tus comidas principales? (Desayuno, almuerzo, cena):'] || raw['Tienes horarios especficos para tus comidas principales? (Desayuno, almuerzo, cena):'] || '').trim();
  const reduccionMacrosComodo = (raw.reduccion_macros_comodo || raw['¿Qué tan cómodo estás con reducir carbohidratos o grasas si fuera necesario?'] || raw['Qu tan cmodo ests con reducir carbohidratos o grasas si fuera necesario?'] || '').trim();

  // Salud
  const condicionMedica = (raw.condicion_medica || raw['¿Tienes alguna condición médica diagnosticada? (Ej.: hipertensión, diabetes):'] || raw['Tienes alguna condicin mdica diagnosticada? (Ej.: hipertensin, diabetes):'] || '').trim();
  const medicamentos = (raw.medicamentos || raw['¿Tomas medicamentos regularmente? (Especificar):'] || raw['Tomas medicamentos regularmente? (Especificar):'] || '').trim();
  const tratamientoMedico = (raw.tratamiento_medico || raw['¿Estás en tratamiento médico o fisioterapia actualmente? (Sí/No):'] || raw['Ests en tratamiento mdico o fisioterapia actualmente? (S/No):'] || '').trim();
  const problemasPrevios = (raw.problemas_previos || raw['¿Has tenido problemas con entrenamientos previos? (Dolores, falta de energía, etc.):'] || raw['Has tenido problemas con entrenamientos previos? (Dolores, falta de energa, etc.):'] || '').trim();
  const lesionCondicion = (raw.lesion_condicion || raw['¿Tienes alguna lesión o condición actual que debamos considerar? (Ej.: post-operatorio, dolor crónico):'] || raw['Tienes alguna lesin o condicin actual que debamos considerar? (Ej.: post-operatorio, dolor crnico):'] || '').trim();
  const suplementosActuales = (raw.suplementos_actuales || raw['¿Utilizas suplementos actualmente? (Ej.: proteína, creatina, vitaminas):'] || raw['Utilizas suplementos actualmente? (Ej.: protena, creatina, vitaminas):'] || '').trim();
  const interesSuplementacion = (raw.interes_suplementacion || raw['¿Estarías interesado en recomendaciones de suplementación? (Sí/No):'] || raw['Estaras interesado en recomendaciones de suplementacin? (S/No):'] || '').trim();
  const alergiaSuplementos = (raw.alergia_suplementos || raw['¿Es usted alérgico a algún tipo de suplementos? De ser así indique:'] || raw['Es usted alrgico a algn tipo de suplementos? De ser as indique:'] || '').trim();
  const consentimientoTestimonios = (raw.consentimiento_testimonios || raw['Consentimiento para Compartir Progreso y Testimonios (Opcional: Sí o No)'] || '').trim();

  // Pago y Comprobante
  const metodoPago = (
    raw.metodo_pago ||
    raw.tipo_pago ||
    raw['Método de Pago'] ||
    raw['Mtodo de Pago'] ||
    ''
  ).trim();

  const comprobanteUrl = (
    raw.comprobante_url ||
    raw['Cargue su comprobante de pago'] ||
    ''
  ).trim();

  const estadoPago = raw.estado_pago || (raw.id && raw.id.toString().startsWith('intake-') ? (raw.estado_pago || 'Aprobado y Verificado') : 'Pendiente de verificación');

  return {
    ...raw,
    id: raw.id || `resp_${index + 1}`,
    nombre_completo: nombreCompleto || email.split('@')[0] || `Atleta #${index + 1}`,
    email,
    telefono,
    pais_ciudad: paisCiudad,
    edad,
    genero,
    estatura_m: estaturaM,
    peso_actual_kg: pesoActualKg,
    peso_ideal_kg: pesoIdealKg,
    objetivo_principal: objetivoPrincipal,
    importancia_objetivo: importanciaObjetivo,
    motivacion,
    fecha_limite: fechaLimite,
    objetivos_especificos: objetivosEspecificos,
    disciplina_deportiva: disciplinaDeportiva,
    nivel_experiencia: nivelExperiencia,
    dias_entrenamiento: diasEntrenamiento,
    experiencia_pesas: experienciaPesas,
    deporte_regular: deporteRegular,
    lugar_entrenamiento: lugarEntrenamiento,
    equipo_casa: equipoCasa,
    tiempo_ejercicio: tiempoEjercicio,
    tipo_ejercicio_actual: tipoEjercicioActual,
    horas_sueno: horasSueno,
    nivel_estres: nivelEstres,
    consumo_agua_litros: consumoAguaLitros,
    consumo_cafe: consumoCafe,
    dieta_actual: dietaActual,
    alergias_alimenticias: alergiasAlimenticias,
    alimentos_evitar: alimentosEvitar,
    alimentos_preferidos: alimentosPreferidos,
    horarios_comidas: horariosComidas,
    reduccion_macros_comodo: reduccionMacrosComodo,
    condicion_medica: condicionMedica,
    medicamentos,
    tratamiento_medico: tratamientoMedico,
    problemas_previos: problemasPrevios,
    lesion_condicion: lesionCondicion,
    suplementos_actuales: suplementosActuales,
    interes_suplementacion: interesSuplementacion,
    alergia_suplementos: alergiaSuplementos,
    consentimiento_testimonios: consentimientoTestimonios,
    metodo_pago: metodoPago,
    comprobante_url: comprobanteUrl,
    estado_pago: estadoPago,
    marca_temporal: rawDate,
    timestamp,
    fecha_display: fechaDisplay
  };
}
