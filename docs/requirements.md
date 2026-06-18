# 📝 Requisitos del Sistema - PromptHub

Este documento detalla los requisitos funcionales, requisitos no funcionales, restricciones técnicas y suposiciones iniciales para el desarrollo de la plataforma PromptHub.

---

## 1. Requisitos Funcionales (RF)

Los requisitos funcionales definen los servicios, características y comportamientos específicos que el sistema debe proporcionar. Se organizan por módulos clave:

### 1.1 Módulo de Autenticación y Cuentas (RF-AUTH)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-AUTH-01** | Registro con Google | Los usuarios deben poder registrarse utilizando su cuenta de Google mediante Supabase Auth (OAuth 2.0). | Alta |
| **RF-AUTH-02** | Inicio de sesión único | Los usuarios ya registrados deben poder iniciar sesión con un solo clic usando Google. | Alta |
| **RF-AUTH-03** | Cierre de sesión (Logout) | El usuario debe poder cerrar sesión de manera segura, invalidando el token JWT local y la sesión en Supabase. | Alta |
| **RF-AUTH-04** | Persistencia de sesión | Las sesiones deben persistir en el cliente usando tokens de refresco, de modo que el usuario no deba autenticarse repetidamente. | Alta |
| **RF-AUTH-05** | Flujo de primer login | Al registrarse por primera vez, se debe solicitar al usuario que configure un nombre de usuario (`username`) único antes de interactuar. | Alta |

### 1.2 Módulo de Perfiles (RF-PROFILE)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-PROFILE-01** | Perfil público | Cada usuario debe tener una página de perfil público (`/profiles/:username`) accesible por cualquier visitante. | Alta |
| **RF-PROFILE-02** | Edición de perfil | Los usuarios autenticados deben poder editar sus datos personales: nombre a mostrar (`display_name`), biografía (máx. 500 caracteres), URL de sitio web y enlaces a redes sociales. | Alta |
| **RF-PROFILE-03** | Sincronización de Avatar | El avatar del usuario debe cargarse por defecto desde la foto de perfil de Google, pero debe ser actualizable si el usuario lo desea. | Media |
| **RF-PROFILE-04** | Pestañas del perfil | El perfil público debe mostrar pestañas para listar los recursos publicados, colecciones públicas y el recuento de seguidores/seguidos. | Alta |

### 1.3 Módulo de Gestión de Recursos de IA (RF-RESOURCES)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-RESOURCES-01** | CRUD de recursos | Los usuarios registrados deben poder Crear, Leer, Actualizar y Eliminar (CRUD) sus propios recursos de IA. | Alta |
| **RF-RESOURCES-02** | Soporte de tipos | El sistema debe clasificar y soportar formatos específicos para: prompts LLM, prompts de generación de imágenes, prompts de generación de video, agentes de IA, workflows/automatizaciones y otros. | Alta |
| **RF-RESOURCES-03** | Campos de recurso | Cada recurso debe incluir obligatoriamente: título, descripción, tipo de recurso, contenido principal (el prompt o instrucciones), categoría y modelos compatibles. | Alta |
| **RF-RESOURCES-04** | Ejemplos de entrada y salida | Soporte para que los creadores agreguen ejemplos estructurados de entrada (Input) y salida esperada (Output). | Media |
| **RF-RESOURCES-05** | Carga de archivos/imágenes | Los usuarios deben poder subir archivos asociados (ej. imágenes de ejemplo generadas o archivos JSON de workflows) mediante Supabase Storage. | Alta |
| **RF-RESOURCES-06** | Estado del recurso | Un recurso puede tener estado `draft` (privado para el autor) o `published` (visible públicamente). | Alta |
| **RF-RESOURCES-07** | Categorías y Etiquetas | Los recursos deben asociarse a una categoría del sistema (ej. Productividad, Marketing) y opcionalmente a múltiples etiquetas (tags) libres. | Alta |

### 1.4 Módulo de Colecciones (RF-COLLECTIONS)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-COLLECTIONS-01** | Creación de colecciones | Los usuarios autenticados pueden crear carpetas/tableros llamados "Colecciones" para agrupar recursos de IA. | Alta |
| **RF-COLLECTIONS-02** | Privacidad de colecciones | Cada colección puede configurarse como pública (cualquiera la ve) o privada (solo el creador). | Alta |
| **RF-COLLECTIONS-03** | Agregar/Eliminar recursos | Los usuarios pueden guardar cualquier recurso público de la plataforma en una de sus colecciones personales. | Alta |
| **RF-COLLECTIONS-04** | Guardado rápido (Bookmarks) | Acceso de un solo clic para guardar un recurso en la sección general de "Guardados", sin necesidad de asignarlo a una colección específica. | Alta |

### 1.5 Módulo Social (RF-SOCIAL)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-SOCIAL-01** | Sistema de Likes | Los usuarios autenticados pueden dar "Like" a los recursos. Un usuario no puede dar más de un like al mismo recurso. | Alta |
| **RF-SOCIAL-02** | Comentarios en recursos | Los usuarios pueden escribir comentarios (máx. 2000 caracteres) en los recursos públicos. | Alta |
| **RF-SOCIAL-03** | Respuestas a comentarios | Permite respuestas de un nivel (anidadas) a comentarios existentes para fomentar el debate técnico. | Media |
| **RF-SOCIAL-04** | Sistema de Seguimiento | Los usuarios pueden seguir (`follow`) a otros creadores de contenido. | Alta |
| **RF-SOCIAL-05** | Feed de actividad | Los usuarios autenticados dispondrán de un feed personalizado que mostrará los recursos recientemente publicados por las personas que siguen. | Media |

### 1.6 Módulo de Búsqueda y Descubrimiento (RF-SEARCH)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-SEARCH-01** | Búsqueda por texto | Búsqueda difusa de recursos en base a su título, descripción y contenido utilizando PostgreSQL Full-Text Search. | Alta |
| **RF-SEARCH-02** | Filtros avanzados | Filtros combinados por categoría, tipo de recurso (prompt, agente, workflow), etiquetas y modelos de IA compatibles. | Alta |
| **RF-SEARCH-03** | Ordenamiento | Posibilidad de ordenar resultados por más recientes (`published_at`), más votados (`likes_count`) o relevancia de búsqueda. | Alta |
| **RF-SEARCH-04** | Recursos en tendencia (Trending) | Sección en la Home que muestre recursos más populares basados en un algoritmo que compute vistas y likes en las últimas 72 horas. | Media |

### 1.7 Módulo de Estadísticas (RF-STATS)

| ID | Requisito | Descripción | Prioridad |
|---|---|---|---|
| **RF-STATS-01** | Contadores básicos | Cada recurso debe registrar e incrementar de manera única el número de vistas (`views_count`), guardados (`saves_count`) e interacciones. | Alta |
| **RF-STATS-02** | Panel de Creador | Un minidashboard privado para usuarios con estadísticas agregadas de sus recursos publicados (total vistas, total likes, número de seguidores). | Media |

---

## 2. Requisitos No Funcionales (RNF)

Los requisitos no funcionales especifican criterios que juzgan la operación de un sistema en lugar de comportamientos específicos.

### 2.1 Rendimiento (Performance)

- **RNF-PERF-01**: El tiempo de renderizado inicial de la página de inicio (Landing/Explore) no debe superar los **2.0 segundos** (LCP - Largest Contentful Paint) bajo condiciones de red móvil estándar.
- **RNF-PERF-02**: Las llamadas a la API interna (BFF) deben responder en un percentil 95 (p95) menor a **500 ms**.
- **RNF-PERF-03**: Optimización extrema de imágenes de ejemplo usando el componente `next/image` de Next.js para minimizar el tamaño de transferencia.

### 2.2 Escalabilidad y Disponibilidad

- **RNF-ESC-01**: El sistema debe estar diseñado para soportar hasta **10,000 usuarios registrados** y 100 usuarios activos concurrentes en su infraestructura inicial sin degradación del servicio.
- **RNF-ESC-02**: El backend de Supabase (PostgreSQL) y el frontend en Vercel deben asegurar una disponibilidad del **99.5%** anual.

### 2.3 Seguridad y Privacidad

- **RNF-SEC-01**: Protección de la capa de persistencia utilizando Row Level Security (RLS) en PostgreSQL, garantizando que un usuario no pueda editar o eliminar datos de otros.
- **RNF-SEC-02**: Todas las APIs deben validar los tokens de acceso JWT provistos por Supabase Auth.
- **RNF-SEC-03**: Los datos sensibles (como tokens de refresco OAuth de Google) no deben ser accesibles desde el código frontend de la aplicación.
- **RNF-SEC-04**: Sanitización estricta de cualquier código de prompt introducido por usuarios antes de renderizarse para evitar ataques XSS (Cross-Site Scripting).

### 2.4 SEO y Accesibilidad

- **RNF-SEO-01**: Generación estática o renderizado del lado del servidor (SSR/ISR) para todas las páginas públicas de recursos para asegurar la indexación correcta de motores de búsqueda como Google.
- **RNF-SEO-02**: Metadatos dinámicos (título, descripción open-graph, Twitter cards) para cada recurso de IA.
- **RNF-ACC-01**: La interfaz web debe cumplir con las pautas de accesibilidad **WCAG 2.1 Nivel AA**, incluyendo contrastes de color apropiados y compatibilidad con lectores de pantalla.

### 2.5 Portabilidad y Diseño Responsivo

- **RNF-RESP-01**: Enfoque de diseño "Mobile-First". La interfaz de usuario debe adaptarse automáticamente a pantallas de dispositivos móviles (mínimo 320px de ancho), tablets y escritorio.

---

## 3. Restricciones Técnicas

Las restricciones técnicas limitan las opciones de diseño e implementación del equipo de desarrollo.

- **Autenticación Única**: El MVP utilizará exclusivamente Google OAuth. No se implementará flujo de correo/contraseña local inicialmente para reducir la superficie de ataque y simplificar el flujo de usuario.
- **Base de Datos Relacional**: La base de datos debe ser PostgreSQL, aprovechando la infraestructura gestionada de Supabase. No se permite la inclusión de bases de datos NoSQL para el core de datos.
- **Entorno Serverless**: Next.js se desplegará en Vercel. Por lo tanto, el backend debe diseñarse para ser stateless utilizando Serverless Functions y Edge Functions de Vercel y Supabase.
- **Presupuesto Inicial Cero (Free Tier)**: La arquitectura debe ser completamente desplegable y operativa dentro de los planes gratuitos de Vercel y Supabase.
- **Tecnología del Framework**: El desarrollo se limita estrictamente a Next.js (versión 14+) utilizando el App Router y TypeScript.

---

## 4. Suposiciones Iniciales

Hipótesis que se consideran verdaderas para el diseño del sistema, pero que de fallar podrían alterar los planes:

- **Desarrollador Único (Solo Developer)**: Se asume que el proyecto será construido, desplegado y mantenido por un único desarrollador durante sus fases iniciales, lo que prioriza simplicidad, velocidad de desarrollo y bajo mantenimiento operativo.
- **Idioma del Público Objetivo**: El mercado objetivo inicial es hispanohablante. La interfaz de usuario y la base de datos de categorías se crearán originalmente en español, con i18n planeado para fases avanzadas.
- **Uso Responsable del Plan Gratuito**: Se asume que el tráfico diario inicial no superará las 1,000 visitas al día, lo cual encaja perfectamente dentro de las cuotas de Supabase Free (500MB DB, 50,000 usuarios activos mensuales).
- **Acceso a Google Cloud Console**: El desarrollador cuenta con las credenciales necesarias para configurar el proyecto en Google Cloud y obtener las claves del cliente OAuth para la autenticación externa.
