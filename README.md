# Amazona Fitness · Dashboard

🌐 **URL de Producción (GitHub Pages)**: [https://ehyenmanft.github.io/amazona-fitness-dashboard/](https://ehyenmanft.github.io/amazona-fitness-dashboard/)  
📝 **Formulario Bilingüe**: [https://ehyenmanft.github.io/formulario-bilingue/](https://ehyenmanft.github.io/formulario-bilingue/)

Plataforma integral y optimizada para la visualización, control de atletas, gestión de planes de nutrición/entrenamiento, seguimiento de renovaciones periódicas y consulta de formularios de ingreso (Intake) estructurados conectados con **Supabase ("Amazona Fitness")** y Google Sheets.

---

## 🎨 Sistema de Diseño UI/UX
- **Paleta de Colores**: **Blanco**, **Verde (#10b981)** y **Fucsia (#e11474)** con degradados dinámicos, glassmorphism, tarjetas elevadas y micro-animaciones en toda la experiencia.
- **Vistas Multidimensionales**:
  1. **Atletas Formulario (Supabase)**: Tabla con filtros, búsqueda global por nombre/email/método de pago, ordenamiento por fecha y visualización en conjunto.
  2. **Dossier de Atleta Individual**: Modal interactivo con los **46 campos de anamnesis** y biometría agrupados temáticamente, además del comprobante de pago con visor directo.
  3. **Plan del Atleta**: Cálculo automático de ciclo, frecuencia y visor Markdown clasificado (Nutrición, Entrenamiento, Suplementación).
  4. **Tabla Maestra de Planes**: Registro histórico con alertas de renovación.

---

## 🗄️ Migración a Supabase ("Amazona Fitness")
1. Abre tu panel de control en [Supabase](https://supabase.com).
2. Crea un nuevo proyecto llamado **Amazona Fitness**.
3. Dirígete a **SQL Editor** y ejecuta el archivo [`supabase/schema.sql`](supabase/schema.sql) incluido en este repositorio.
4. En **Project Settings > API**, copia la **URL del Proyecto** y la **Anon Key**.
5. En el Dashboard de GitHub Pages, pulsa en el botón **"Conectar Supabase"** y pega tus credenciales. Los datos se sincronizarán en tiempo real.
6. El formulario bilingüe también cargará automáticamente las respuestas en la tabla `respuestas_formulario` y subirá los comprobantes al bucket `comprobantes`.

---
---

## 📁 Estructura del Repositorio

```
amazona-fitness-dashboard/
├── .clasp.json               # Configuración de Clasp para despliegue directo en Google Apps Script
├── .gitignore                # Reglas de exclusión para Git (node_modules, tokens, etc.)
├── README.md                 # Guía del proyecto y documentación
├── apps-script/              # Código nativo para Google Apps Script
│   ├── appsscript.json       # Manifiesto y permisos del proyecto Apps Script
│   ├── Código.js             # Backend GAS (lectura de Google Sheets, escaneo Drive y API JSON)
│   ├── Index.html            # Shell HTML limpio
│   ├── Styles.html           # Estilos CSS optimizados con variables CSS y temas día/noche
│   └── Scripts.html          # Lógica cliente modular para el entorno GAS
└── webapp/                   # Aplicación Web moderna (React + Vite)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx           # Orquestación de vistas, estado y filtros
        ├── index.css         # Sistema de diseño, tokens, animaciones y glassmorphism
        ├── components/
        │   ├── Header.jsx        # Encabezado, branding y conmutador de tema
        │   ├── RenewalBanner.jsx # Alertas de renovación en ventana ±10 días
        │   ├── KpiCards.jsx      # Indicadores clave con micro-interacciones
        │   ├── FilterBar.jsx     # Búsqueda global, selector de atleta, mes y estado
        │   ├── ClientDetail.jsx  # Ficha de atleta, cálculo de ciclo y links Drive
        │   ├── PlanViewer.jsx    # Visor clasificado de Data de Plan (Markdown)
        │   ├── PlansTable.jsx    # Tabla completa con enlaces directos y paginación
        │   └── ApiConfigModal.jsx# Conexión en vivo con Google Apps Script
        ├── utils/
        │   ├── planParser.js     # Parser robusto de Markdown a bloques interactivos
        │   ├── renewals.js       # Algoritmo de cálculo de frecuencia y predicción
        │   └── api.js            # Adaptador híbrido (GAS API en vivo + Mock fallback)
        └── data/
            └── mockData.js       # Dataset completo para desarrollo y demostración offline
```

---

## 🚀 Subir a GitHub

Para conectar este repositorio local con tu cuenta de GitHub, sigue estos pasos:

1. **Crea un nuevo repositorio vacío en GitHub** (por ejemplo, con el nombre `amazona-fitness-dashboard`). *No lo inicialices con README ni .gitignore*.
2. **Vincula tu repositorio remoto y sube el código**:

```bash
# Cambia a la rama main si lo prefieres
git branch -M main

# Añade la URL de tu repositorio remoto de GitHub
git remote add origin https://github.com/TU_USUARIO/amazona-fitness-dashboard.git

# Envía todos los commits iniciales
git push -u origin main
```

---

## 💻 Ejecución de la Web App Moderna (`webapp/`)

### 1. Iniciar en desarrollo local
```bash
cd webapp
npm install
npm run dev
```
Abre la URL local indicada (habitualmente `http://localhost:5173`) en tu navegador.

### 2. Conexión en Tiempo Real con Google Apps Script
1. En la esquina superior derecha del dashboard, haz clic en el indicador **"Modo Demostración / Conexión"**.
2. Pega la URL de tu Web App desplegada (terminada en `/exec`).
3. La aplicación sincronizará automáticamente los datos de Google Sheets y los archivos Markdown de Google Drive en tiempo real.
4. *Nota*: Si no configuras ninguna URL, la app opera automáticamente en modo demostración con datos de prueba completos.

### 3. Compilar para Producción
```bash
cd webapp
npm run build
```
Los archivos optimizados se generarán en la carpeta `webapp/dist/` listos para ser desplegados en Vercel, Netlify, Cloudflare Pages o GitHub Pages.

---

## ☁️ Despliegue en Google Apps Script (`apps-script/`)

Si deseas actualizar directamente el proyecto en Google Apps Script:

1. **Verificar estado de archivos rastreados**:
   ```bash
   npx @google/clasp status
   ```
2. **Subir los cambios a Google Apps Script**:
   ```bash
   npx @google/clasp push
   ```
3. **Abrir el editor de Apps Script**:
   ```bash
   npx @google/clasp open
   ```

---

## 🌟 Mejoras Implementadas Respecto a la Versión Original

- **Modularización Completa**: Eliminación del archivo monolítico de 3,500 líneas en Apps Script, separando responsabilidades en `Styles.html`, `Scripts.html`, `Index.html` y `Código.js`.
- **Modo API JSON Integrado**: `Código.js` ahora responde como endpoint REST JSON mediante `?action=data` y `?action=markdown&fileId=...`, permitiendo conectar cualquier frontend externo.
- **Web App React de Alta Gama**: Interfaz visual moderna, diseño fitness con colores coordinados, Dark y Light mode, animaciones fluidas y tipografía moderna (`Plus Jakarta Sans`).
- **Visor Inteligente de Planes**: Desglose automático de secciones (Nutrición, Rutina de pesas, Suplementación, Checklist, Recomendaciones) con buscador en tiempo real dentro del plan.
- **Predicción Inteligente de Renovaciones**: Detección del ciclo promedio entre planes de cada atleta y alerta visual automática de fechas de renovación en una ventana de ±10 días.
- **Independencia y Portabilidad**: Funciona tanto conectado a Google Workspace como de forma autónoma con datos de prueba para demos y desarrollo sin conexión.
