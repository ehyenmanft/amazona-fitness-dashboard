-- =========================================================
-- ESQUEMA COMPLETO DE SUPABASE: "Amazona Fitness"
-- Proyecto: Amazona Fitness
-- Incluye: Respuestas de Formulario (46 columnas), Clientes, Planes y Storage
-- =========================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: respuestas_formulario (Migración de la hoja de Google Sheets "Respuestas de formulario 2")
CREATE TABLE IF NOT EXISTS public.respuestas_formulario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    marca_temporal TIMESTAMPTZ DEFAULT now(),
    email_direccion TEXT,
    nombre_completo TEXT NOT NULL,
    edad INTEGER,
    genero TEXT,
    email TEXT,
    telefono TEXT,
    pais_ciudad TEXT,
    estatura_m NUMERIC(4,2),
    peso_actual_kg NUMERIC(5,2),
    peso_ideal_kg NUMERIC(5,2),
    objetivo_principal TEXT,
    importancia_objetivo INTEGER,
    motivacion TEXT,
    fecha_limite TEXT,
    objetivos_especificos TEXT,
    disciplina_deportiva TEXT,
    nivel_experiencia TEXT,
    dias_entrenamiento TEXT,
    experiencia_pesas TEXT,
    deporte_regular TEXT,
    lugar_entrenamiento TEXT,
    equipo_casa TEXT,
    tiempo_ejercicio TEXT,
    tipo_ejercicio_actual TEXT,
    horas_sueno TEXT,
    nivel_estres TEXT,
    consumo_agua_litros TEXT,
    consumo_cafe TEXT,
    dieta_actual TEXT,
    alergias_alimenticias TEXT,
    alimentos_evitar TEXT,
    alimentos_preferidos TEXT,
    horarios_comidas TEXT,
    reduccion_macros_comodo TEXT,
    condicion_medica TEXT,
    medicamentos TEXT,
    tratamiento_medico TEXT,
    problemas_previos TEXT,
    lesion_condicion TEXT,
    suplementos_actuales TEXT,
    interes_suplementacion TEXT,
    alergia_suplementos TEXT,
    consentimiento_testimonios TEXT,
    metodo_pago TEXT,
    comprobante_url TEXT,
    estado_pago TEXT DEFAULT 'Pendiente de verificación',
    idioma TEXT DEFAULT 'ES',
    raw_data JSONB
);

-- 3. TABLA: clientes (Atletas consolidados)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    nombre TEXT NOT NULL UNIQUE,
    email TEXT,
    telefono TEXT,
    pais_ciudad TEXT,
    estado TEXT DEFAULT 'Activo',
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    notas TEXT
);

-- 4. TABLA: planes (Histórico de planes, PDFs y Markdown)
CREATE TABLE IF NOT EXISTS public.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    cliente TEXT NOT NULL,
    mes_plan TEXT,
    fecha_carga_pdf DATE,
    url_pdf TEXT,
    pdf_existe TEXT DEFAULT 'Sí',
    md_existe TEXT DEFAULT 'No',
    estado TEXT DEFAULT 'PDF+MD',
    archivo_pdf TEXT,
    archivo_md TEXT,
    md_file_id TEXT,
    observacion TEXT
);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.respuestas_formulario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;

-- Permitir inserción anónima desde el formulario web (formulario-bilingue)
CREATE POLICY "Permitir envíos anónimos de formulario" 
ON public.respuestas_formulario 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Permitir lectura a usuarios autenticados y con clave anon
CREATE POLICY "Permitir lectura de respuestas" 
ON public.respuestas_formulario 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Permitir lectura de clientes" 
ON public.clientes 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Permitir gestión de clientes" 
ON public.clientes 
FOR ALL 
TO anon, authenticated 
USING (true);

CREATE POLICY "Permitir lectura de planes" 
ON public.planes 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Permitir gestión de planes" 
ON public.planes 
FOR ALL 
TO anon, authenticated 
USING (true);

-- 6. CONFIGURACIÓN DEL BUCKET DE STORAGE PARA COMPROBANTES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Permitir subida de comprobantes pública"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Permitir lectura pública de comprobantes"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'comprobantes');

-- 7. VISTA ÚTIL: vista_resumen_atletas
CREATE OR REPLACE VIEW public.vista_resumen_atletas AS
SELECT 
    r.id,
    r.marca_temporal,
    r.nombre_completo,
    r.email,
    r.telefono,
    r.pais_ciudad,
    r.edad,
    r.peso_actual_kg,
    r.peso_ideal_kg,
    r.objetivo_principal,
    r.metodo_pago,
    r.comprobante_url,
    r.estado_pago,
    r.dias_entrenamiento,
    r.dieta_actual,
    (SELECT COUNT(*) FROM public.planes p WHERE LOWER(p.cliente) = LOWER(r.nombre_completo)) as total_planes
FROM public.respuestas_formulario r
ORDER BY r.marca_temporal DESC;
