# 📚 PromptHub — Documentación del Proyecto

<!-- Status Badges -->
![Estado del Proyecto](https://img.shields.io/badge/estado-en%20desarrollo-yellow)
![Versión](https://img.shields.io/badge/versión-0.1.0--alpha-blue)
![Licencia](https://img.shields.io/badge/licencia-privada-red)
![Cobertura de Tests](https://img.shields.io/badge/tests-pendiente-lightgrey)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## 🧭 Descripción del Producto

**PromptHub** es una plataforma comunitaria para practicantes de Inteligencia Artificial que permite **descubrir, guardar, organizar, compartir y publicar recursos de IA** — incluyendo prompts, agentes, workflows y más.

Combina las funcionalidades de una **biblioteca de recursos**, una **red social especializada** y un **motor de descubrimiento de contenido**, todo diseñado específicamente para el ecosistema de herramientas de IA.

## 🎯 Visión

> Convertirse en **la plataforma de referencia** para practicantes de IA que buscan encontrar, compartir y colaborar en torno a prompts, agentes, workflows y otros recursos de inteligencia artificial.

PromptHub aspira a ser el puente entre creadores de contenido de IA y la comunidad que consume y adapta esos recursos, creando un ciclo virtuoso de descubrimiento, reutilización y mejora continua.

---

## 🏗️ Módulos Principales

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| 🔐 **Auth & Usuarios** | Registro e inicio de sesión con Google OAuth, gestión de perfiles, avatares y preferencias de usuario | 🟡 Planificado |
| 📦 **Gestión de Recursos** | CRUD completo de recursos de IA (prompts, agentes, workflows), soporte para Markdown, ejemplos de uso, modelos compatibles y adjuntos | 🟡 Planificado |
| 📂 **Colecciones** | Creación y gestión de colecciones públicas/privadas para organizar recursos guardados | 🟡 Planificado |
| 💬 **Social** | Sistema de follows entre usuarios, likes en recursos, comentarios y feed de actividad | 🟡 Planificado |
| 🔍 **Búsqueda y Descubrimiento** | Búsqueda full-text, filtros por categoría/tipo/tags/modelo, ordenamiento, recursos trending y destacados | 🟡 Planificado |
| 📊 **Analíticas** | Contadores de vistas, likes y guardados por recurso; dashboard básico para creadores | 🟡 Planificado |

---

## 📖 Índice de Documentos

### Producto y Requisitos

| Documento | Descripción |
|-----------|-------------|
| [📋 Product Overview](./product-overview.md) | Visión general del producto: tipos de usuario, casos de uso principales, flujos de aplicación y tipos de recursos soportados |
| [📝 Requirements](./requirements.md) | Requisitos funcionales (por módulo), no funcionales, restricciones técnicas y supuestos iniciales |
| [📅 Project Phases](./project-phases.md) | Plan de desarrollo por fases, hitos del MVP y funcionalidades futuras (Roadmap) |

### Arquitectura y Diseño Técnico

| Documento | Descripción |
|-----------|-------------|
| [🏛️ Architecture](./architecture.md) | Arquitectura del sistema, diagramas de componentes, decisiones técnicas (ADRs) y evolución |
| [🛠️ Tech Stack](./tech-stack.md) | Evaluación y justificación de tecnologías elegidas, alternativas y comparativas |
| [🗄️ Database Design](./database-design.md) | Diseño lógico y conceptual, entidad-relación, índices, denormalización y políticas RLS |
| [🔌 API Design](./api-design.md) | Diseño de API REST, endpoints, contratos, códigos de estado y reglas de autorización |

### Seguridad y Autenticación

| Documento | Descripción |
|-----------|-------------|
| [🔐 Authentication](./authentication.md) | Integración con Supabase Auth y Google OAuth, sincronización de perfiles y sesiones |
| [🛡️ Security](./security.md) | Análisis de seguridad, protección de recursos privados, validación con Zod, Rate Limiting y mitigaciones XSS/SQLi |

### Operaciones y Despliegue

| Documento | Descripción |
|-----------|-------------|
| [🚀 Deployment](./deployment.md) | Estrategia de despliegue en Vercel y Supabase, variables de entorno, CI/CD y backups |

---

## 🛠️ Stack Tecnológico

```
Frontend:    Next.js 14+ (App Router) · TypeScript · Tailwind CSS
Backend:     Next.js API Routes · Supabase (PostgreSQL)
Auth:        Supabase Auth · Google OAuth
Storage:     Supabase Storage
Búsqueda:    PostgreSQL Full-Text Search (MVP) → Meilisearch (futuro)
Cache:       Vercel Edge Cache · React Server Components
Hosting:     Vercel
Testing:     Vitest · Playwright
```

---

## ⚡ Guía de Inicio Rápido

> [!NOTE]
> Esta sección se completará una vez que el proyecto tenga su estructura inicial configurada.

### Prerrequisitos

- **Node.js** v18.17 o superior
- **pnpm** (gestor de paquetes recomendado)
- Cuenta en **Supabase** (tier gratuito)
- Cuenta en **Vercel** (tier gratuito)
- Proyecto de **Google Cloud Console** con OAuth 2.0 configurado

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd prompthub

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase y Google OAuth

# 4. Ejecutar migraciones de base de datos
pnpm db:migrate

# 5. Iniciar el servidor de desarrollo
pnpm dev
```

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Google OAuth (configurado en Supabase Dashboard)
# No requiere variables adicionales en Next.js

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Comandos Principales

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo en `localhost:3000` |
| `pnpm build` | Genera el build de producción |
| `pnpm start` | Inicia el servidor de producción |
| `pnpm test` | Ejecuta los tests unitarios con Vitest |
| `pnpm test:e2e` | Ejecuta los tests E2E con Playwright |
| `pnpm lint` | Ejecuta el linter (ESLint) |
| `pnpm db:migrate` | Ejecuta las migraciones de base de datos |
| `pnpm db:seed` | Carga datos de ejemplo para desarrollo |

---

## 📐 Convenciones del Proyecto

- **Idioma del código**: Inglés (variables, funciones, componentes, entidades, casos de uso)
- **Idioma de la documentación**: Español
- **Idioma de los commits**: Inglés, siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
- **Estructura de carpetas**: Arquitectura Onion en el backend (`src/backend/`) y Feature-based en el frontend (`src/features/`)
- **Estilo de código**: Definido por ESLint + Prettier


---

## 👤 Equipo

| Rol | Persona | Responsabilidades |
|-----|---------|-------------------|
| Desarrollador principal | Rodrigo | Diseño, desarrollo, despliegue y mantenimiento del MVP |

---

## 📄 Licencia

Este proyecto es de uso privado. Todos los derechos reservados.

---

*Última actualización: Junio 2026*
