# Diseño de API — PromptHub

> Documento de referencia para el diseño de la API REST de PromptHub. Define convenciones globales, endpoints organizados por módulo, matriz de autorización y ejemplos detallados de request/response.

---

## Tabla de Contenidos

1. [Convenciones Generales](#1-convenciones-generales)
2. [Módulo 1 — Auth](#2-módulo-1--auth)
3. [Módulo 2 — Users / Profiles](#3-módulo-2--users--profiles)
4. [Módulo 3 — Resources](#4-módulo-3--resources)
5. [Módulo 4 — Categories](#5-módulo-4--categories)
6. [Módulo 5 — Tags](#6-módulo-5--tags)
7. [Módulo 6 — Collections](#7-módulo-6--collections)
8. [Módulo 7 — Likes](#8-módulo-7--likes)
9. [Módulo 8 — Saved Resources](#9-módulo-8--saved-resources)
10. [Módulo 9 — Comments](#10-módulo-9--comments)
11. [Módulo 10 — Follows](#11-módulo-10--follows)
12. [Módulo 11 — Search](#12-módulo-11--search)
13. [Módulo 12 — Discovery / Trending](#13-módulo-12--discovery--trending)
14. [Módulo 13 — Statistics (Creator Dashboard)](#14-módulo-13--statistics-creator-dashboard)
15. [Matriz de Autorización](#15-matriz-de-autorización)
16. [Ejemplos Detallados de Request / Response](#16-ejemplos-detallados-de-request--response)

---

## 1. Convenciones Generales

### 1.1 Base Path

Todos los endpoints de la API pública utilizan el prefijo:

```
/api/v1
```

El versionado se realiza en la URL para permitir la coexistencia de versiones futuras sin romper clientes existentes.

### 1.2 Formato de Respuesta (Envelope)

Todas las respuestas siguen una estructura envelope consistente:

```jsonc
{
  "data": { /* payload principal — objeto o array */ },
  "error": null,
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_abc123def456"
  }
}
```

| Campo   | Tipo              | Descripción                                                        |
|---------|-------------------|--------------------------------------------------------------------|
| `data`  | `object \| array \| null` | Payload principal. `null` cuando hay error.              |
| `error` | `object \| null`  | Objeto de error. `null` cuando la petición es exitosa.             |
| `meta`  | `object`          | Metadatos de la respuesta (timestamp, request_id, paginación, etc.)|

### 1.3 Paginación (Cursor-Based)

Se utiliza paginación basada en cursor en lugar de offset para garantizar consistencia cuando se insertan o eliminan registros entre páginas.

**Parámetros de request:**

| Parámetro | Tipo     | Default | Descripción                                      |
|-----------|----------|---------|--------------------------------------------------|
| `cursor`  | `string` | `null`  | Cursor opaco del último elemento de la página anterior. |
| `limit`   | `number` | `20`    | Cantidad de elementos por página (máx. `100`).   |

**Campos de respuesta (dentro de `meta`):**

```jsonc
{
  "meta": {
    "pagination": {
      "next_cursor": "eyJpZCI6MTAwfQ==",
      "has_more": true,
      "limit": 20
    }
  }
}
```

| Campo         | Tipo      | Descripción                                    |
|---------------|-----------|------------------------------------------------|
| `next_cursor` | `string \| null` | Cursor para la siguiente página. `null` si no hay más. |
| `has_more`    | `boolean` | Indica si existen más elementos después del cursor.    |
| `limit`       | `number`  | Límite aplicado en esta consulta.              |

### 1.4 Formato de Errores

```jsonc
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'title' es obligatorio.",
    "details": [
      {
        "field": "title",
        "rule": "required",
        "message": "Este campo no puede estar vacío."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_abc123def456"
  }
}
```

**Códigos de error estándar:**

| Código                  | HTTP Status | Descripción                                       |
|-------------------------|-------------|---------------------------------------------------|
| `VALIDATION_ERROR`      | 400         | Los datos enviados no cumplen la validación.       |
| `UNAUTHORIZED`          | 401         | Token ausente o inválido.                          |
| `FORBIDDEN`             | 403         | El usuario no tiene permisos para esta acción.     |
| `NOT_FOUND`             | 404         | El recurso solicitado no existe.                   |
| `CONFLICT`              | 409         | Conflicto (ej: slug duplicado, acción ya realizada). |
| `RATE_LIMITED`           | 429         | Se superó el límite de peticiones.                 |
| `INTERNAL_ERROR`        | 500         | Error interno del servidor.                        |

### 1.5 Rate Limiting

Se incluyen headers de rate limiting en todas las respuestas:

| Header                   | Descripción                                          |
|--------------------------|------------------------------------------------------|
| `X-RateLimit-Limit`      | Máximo de peticiones permitidas en la ventana actual. |
| `X-RateLimit-Remaining`  | Peticiones restantes en la ventana actual.            |
| `X-RateLimit-Reset`      | Timestamp Unix (segundos) de cuándo se resetea la ventana. |

**Límites por defecto (MVP):**

| Tipo de Endpoint       | Límite          |
|------------------------|-----------------|
| Lectura (GET)          | 100 req / min   |
| Escritura (POST/PATCH) | 30 req / min    |
| Búsqueda               | 20 req / min    |
| Auth                   | 10 req / min    |

### 1.6 Autenticación

La autenticación se maneja mediante **Supabase Auth**. Los endpoints protegidos requieren un JWT de Supabase en el header `Authorization`:

```
Authorization: Bearer <supabase_jwt_token>
```

El token se obtiene a través del flujo OAuth de Google o mediante el Supabase Client SDK. Cada request autenticado se valida en el servidor verificando el JWT contra el secreto de Supabase.

### 1.7 Content-Type

Todas las peticiones con body deben incluir:

```
Content-Type: application/json
```

### 1.8 Convenciones de Nomenclatura

| Concepto           | Convención          | Ejemplo                          |
|--------------------|---------------------|----------------------------------|
| Endpoints          | `kebab-case`        | `/api/v1/saved-resources`        |
| Parámetros de URL  | `camelCase`         | `?parentId=abc`                  |
| Campos JSON        | `snake_case`        | `{ "created_at": "..." }`       |
| IDs                | `UUID v4`           | `550e8400-e29b-41d4-a716-446655440000` |
| Slugs              | `kebab-case`        | `mi-prompt-increible`            |
| Timestamps         | ISO 8601 con UTC    | `2026-06-18T14:06:23.000Z`      |

---

## 2. Módulo 1 — Auth

> [!NOTE]
> La mayor parte de la autenticación la maneja directamente el **Supabase Client SDK** en el frontend (login, signup, token refresh). Estos endpoints son wrappers de conveniencia para flujos que requieren lógica del servidor o para clientes que no usan el SDK directamente.

| Método | Path                      | Descripción                                  | Auth | Request Body                     | Response                              | Status Codes       |
|--------|---------------------------|----------------------------------------------|------|----------------------------------|---------------------------------------|---------------------|
| `POST` | `/api/v1/auth/google`     | Inicia el flujo de OAuth con Google          | No   | `{ redirect_url: string }`      | `{ data: { auth_url: string } }`     | `200`, `400`, `500` |
| `POST` | `/api/v1/auth/callback`   | Procesa el callback de OAuth                 | No   | `{ code: string, state: string }`| `{ data: { session, user } }`        | `200`, `400`, `401` |
| `POST` | `/api/v1/auth/logout`     | Cierra sesión e invalida el token            | Sí   | —                                | `{ data: { message: string } }`      | `200`, `401`        |
| `GET`  | `/api/v1/auth/session`    | Obtiene información de la sesión actual      | Sí   | —                                | `{ data: { user, session, expires_at } }` | `200`, `401`   |

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API /auth
    participant S as Supabase Auth
    participant G as Google OAuth

    C->>A: POST /auth/google { redirect_url }
    A->>S: Generar URL de autorización
    S-->>A: auth_url
    A-->>C: { auth_url }
    C->>G: Redirige a Google
    G-->>C: Callback con code + state
    C->>A: POST /auth/callback { code, state }
    A->>S: Intercambiar code por sesión
    S->>G: Validar code
    G-->>S: Tokens del usuario
    S-->>A: session + user
    A-->>C: { session, user }
```

### Detalle de Campos

**`POST /api/v1/auth/google` — Request:**

```jsonc
{
  "redirect_url": "https://prompthub.app/auth/callback"
  // URL a la que Google redirigirá tras la autorización.
  // Debe estar registrada en la configuración de Google OAuth.
}
```

**`POST /api/v1/auth/callback` — Response:**

```jsonc
{
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "v1.MjQ1Njc4...",
      "expires_at": "2026-06-18T15:06:23.000Z",
      "token_type": "bearer"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@gmail.com",
      "username": "usuario123",
      "avatar_url": "https://lh3.googleusercontent.com/...",
      "is_new_user": true
    }
  },
  "error": null,
  "meta": { "timestamp": "2026-06-18T14:06:23.000Z" }
}
```

---

## 3. Módulo 2 — Users / Profiles

| Método  | Path                                    | Descripción                              | Auth | Request Body                          | Response                                    | Status Codes            |
|---------|-----------------------------------------|------------------------------------------|------|---------------------------------------|---------------------------------------------|--------------------------|
| `GET`   | `/api/v1/profiles/:username`            | Obtener perfil público de un usuario     | No   | —                                     | `{ data: Profile }`                        | `200`, `404`             |
| `PATCH` | `/api/v1/profiles/me`                   | Actualizar el perfil propio              | Sí   | `{ display_name?, bio?, avatar_url?, website?, social_links? }` | `{ data: Profile }` | `200`, `400`, `401`      |
| `GET`   | `/api/v1/profiles/:username/resources`  | Recursos publicados del usuario          | No   | —                                     | `{ data: Resource[], meta: pagination }`   | `200`, `404`             |
| `GET`   | `/api/v1/profiles/:username/collections`| Colecciones públicas del usuario         | No   | —                                     | `{ data: Collection[], meta: pagination }` | `200`, `404`             |
| `GET`   | `/api/v1/profiles/:username/stats`      | Estadísticas públicas del usuario        | No   | —                                     | `{ data: UserStats }`                      | `200`, `404`             |

### Esquema: Profile

```typescript
interface Profile {
  id: string;              // UUID
  username: string;        // Único, 3-30 caracteres, alfanumérico + guiones
  display_name: string;    // Nombre visible, máx. 50 caracteres
  bio: string | null;      // Biografía, máx. 500 caracteres
  avatar_url: string | null;
  website: string | null;
  social_links: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
}
```

### Esquema: UserStats

```typescript
interface UserStats {
  resources_count: number;   // Total de recursos publicados
  followers_count: number;   // Seguidores
  following_count: number;   // Siguiendo
  total_likes_received: number; // Likes recibidos en todos sus recursos
}
```

### Query Parameters para `GET /profiles/:username/resources`

| Parámetro | Tipo     | Default    | Descripción                        |
|-----------|----------|------------|------------------------------------|
| `type`    | `string` | —          | Filtrar por tipo de recurso        |
| `sort`    | `string` | `recent`   | `recent`, `popular`, `oldest`      |
| `cursor`  | `string` | —          | Cursor de paginación               |
| `limit`   | `number` | `20`       | Elementos por página (máx. 100)    |

---

## 4. Módulo 3 — Resources

Este es el módulo central de la plataforma. Los recursos representan prompts, agentes, workflows y cualquier otro contenido de IA que los usuarios publican y comparten.

| Método   | Path                                | Descripción                               | Auth | Request Body              | Response                                 | Status Codes                 |
|----------|-------------------------------------|-------------------------------------------|------|---------------------------|------------------------------------------|-------------------------------|
| `GET`    | `/api/v1/resources`                 | Listar recursos publicados (con filtros)  | No   | —                         | `{ data: Resource[], meta: pagination }` | `200`                        |
| `POST`   | `/api/v1/resources`                 | Crear un nuevo recurso (borrador)         | Sí   | `CreateResourceBody`      | `{ data: Resource }`                    | `201`, `400`, `401`          |
| `GET`    | `/api/v1/resources/:slug`           | Obtener recurso por slug                  | No*  | —                         | `{ data: Resource }`                    | `200`, `404`                 |
| `PATCH`  | `/api/v1/resources/:slug`           | Actualizar recurso (solo autor)           | Sí   | `UpdateResourceBody`      | `{ data: Resource }`                    | `200`, `400`, `401`, `403`   |
| `DELETE` | `/api/v1/resources/:slug`           | Eliminar recurso (solo autor)             | Sí   | —                         | `{ data: { message } }`                | `200`, `401`, `403`, `404`   |
| `POST`   | `/api/v1/resources/:slug/publish`   | Publicar un borrador                      | Sí   | —                         | `{ data: Resource }`                    | `200`, `400`, `401`, `403`   |
| `POST`   | `/api/v1/resources/:slug/archive`   | Archivar un recurso                       | Sí   | —                         | `{ data: Resource }`                    | `200`, `401`, `403`, `404`   |
| `GET`    | `/api/v1/resources/me/drafts`       | Borradores del usuario actual             | Sí   | —                         | `{ data: Resource[], meta: pagination }` | `200`, `401`                |

> [!NOTE]
> \* `GET /resources/:slug` es público para recursos publicados. Si el usuario autenticado es el autor, también puede ver sus borradores a través de este endpoint.

### Query Parameters para `GET /api/v1/resources`

| Parámetro  | Tipo       | Default    | Descripción                                          |
|------------|------------|------------|------------------------------------------------------|
| `type`     | `string`   | —          | Filtrar por tipo: `prompt`, `agent`, `workflow`, `tool`, `dataset` |
| `category` | `string`   | —          | Slug de la categoría                                 |
| `tags`     | `string[]` | —          | Array de slugs de tags (se aplica AND)               |
| `model`    | `string`   | —          | Modelo de IA: `gpt-4`, `claude-3`, `gemini`, etc.   |
| `sort`     | `string`   | `recent`   | `recent`, `popular`, `most_liked`, `most_saved`      |
| `cursor`   | `string`   | —          | Cursor de paginación                                 |
| `limit`    | `number`   | `20`       | Elementos por página (máx. 100)                      |

### Esquema: Resource

```typescript
interface Resource {
  id: string;                    // UUID
  slug: string;                  // URL-friendly, único
  title: string;                 // Máx. 200 caracteres
  description: string;           // Máx. 2000 caracteres
  content: string;               // Contenido principal (Markdown)
  type: ResourceType;            // 'prompt' | 'agent' | 'workflow' | 'tool' | 'dataset'
  status: ResourceStatus;        // 'draft' | 'published' | 'archived'
  category_id: string;           // UUID de la categoría
  category: CategorySummary;     // Categoría embebida
  tags: TagSummary[];            // Tags asociados
  model: string | null;          // Modelo de IA recomendado
  model_params: {                // Parámetros sugeridos del modelo
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  } | null;
  author: ProfileSummary;       // Autor embebido
  stats: {
    views_count: number;
    likes_count: number;
    saves_count: number;
    comments_count: number;
  };
  is_liked: boolean | null;     // null si no autenticado
  is_saved: boolean | null;     // null si no autenticado
  published_at: string | null;  // ISO 8601
  created_at: string;           // ISO 8601
  updated_at: string;           // ISO 8601
}
```

### Esquema: CreateResourceBody

```typescript
interface CreateResourceBody {
  title: string;                 // Requerido, 5-200 caracteres
  description: string;           // Requerido, 10-2000 caracteres
  content: string;               // Requerido, contenido en Markdown
  type: ResourceType;            // Requerido
  category_id: string;           // Requerido, UUID válido
  tags: string[];                // Opcional, array de tag IDs (máx. 10)
  model: string | null;          // Opcional
  model_params: object | null;   // Opcional
}
```

### Esquema: UpdateResourceBody

```typescript
interface UpdateResourceBody {
  title?: string;
  description?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  model?: string | null;
  model_params?: object | null;
  // No se puede cambiar 'type' ni 'status' directamente.
  // Para cambiar status, usar /publish o /archive.
}
```

### Ciclo de Vida de un Recurso

```mermaid
stateDiagram-v2
    [*] --> draft: POST /resources
    draft --> published: POST /resources/:slug/publish
    published --> archived: POST /resources/:slug/archive
    archived --> published: POST /resources/:slug/publish
    draft --> [*]: DELETE /resources/:slug
    published --> [*]: DELETE /resources/:slug
    archived --> [*]: DELETE /resources/:slug
    draft --> draft: PATCH /resources/:slug
    published --> published: PATCH /resources/:slug
```

---

## 5. Módulo 4 — Categories

Las categorías proporcionan una taxonomía jerárquica para organizar los recursos. Soportan un nivel de anidamiento (categorías padre e hijas).

| Método | Path                                   | Descripción                              | Auth | Request Body | Response                                    | Status Codes |
|--------|----------------------------------------|------------------------------------------|------|--------------|---------------------------------------------|--------------|
| `GET`  | `/api/v1/categories`                   | Listar todas las categorías              | No   | —            | `{ data: Category[] }`                     | `200`        |
| `GET`  | `/api/v1/categories/:slug`             | Detalle de categoría con conteo          | No   | —            | `{ data: CategoryDetail }`                 | `200`, `404` |
| `GET`  | `/api/v1/categories/:slug/resources`   | Recursos dentro de una categoría         | No   | —            | `{ data: Resource[], meta: pagination }`   | `200`, `404` |

### Query Parameters para `GET /api/v1/categories`

| Parámetro   | Tipo     | Default | Descripción                                     |
|-------------|----------|---------|-------------------------------------------------|
| `parent_id` | `string` | —       | Filtrar subcategorías de una categoría padre     |

### Esquema: Category

```typescript
interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;            // Nombre del ícono o URL
  parent_id: string | null;       // null = categoría raíz
  display_order: number;
  children?: CategorySummary[];   // Solo en listado, si es categoría raíz
}

interface CategoryDetail extends Category {
  resources_count: number;        // Total de recursos publicados en esta categoría
  children: CategorySummary[];    // Subcategorías
}

interface CategorySummary {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}
```

---

## 6. Módulo 5 — Tags

Los tags permiten clasificación libre y horizontal de los recursos. A diferencia de las categorías (controladas), los tags son creados por los usuarios al publicar recursos.

| Método | Path                              | Descripción                              | Auth | Request Body | Response                                  | Status Codes |
|--------|-----------------------------------|------------------------------------------|------|--------------|-------------------------------------------|--------------|
| `GET`  | `/api/v1/tags`                    | Listar tags (con búsqueda)               | No   | —            | `{ data: Tag[] }`                        | `200`        |
| `GET`  | `/api/v1/tags/:slug/resources`    | Recursos con un tag específico           | No   | —            | `{ data: Resource[], meta: pagination }` | `200`, `404` |
| `GET`  | `/api/v1/tags/popular`            | Tags más populares                       | No   | —            | `{ data: Tag[] }`                        | `200`        |

### Query Parameters para `GET /api/v1/tags`

| Parámetro | Tipo     | Default        | Descripción                                 |
|-----------|----------|----------------|---------------------------------------------|
| `q`       | `string` | —              | Búsqueda por nombre del tag (autocompletado)|
| `sort`    | `string` | `usage_count`  | `usage_count`, `name`, `recent`             |
| `limit`   | `number` | `50`           | Máx. 200                                    |

### Query Parameters para `GET /api/v1/tags/popular`

| Parámetro | Tipo     | Default | Descripción                                   |
|-----------|----------|---------|-----------------------------------------------|
| `limit`   | `number` | `20`    | Cantidad de tags a devolver (máx. 50)          |
| `type`    | `string` | —       | Filtrar tags populares dentro de un tipo de recurso |

### Esquema: Tag

```typescript
interface Tag {
  id: string;
  slug: string;
  name: string;
  usage_count: number;       // Cantidad de recursos que usan este tag
  created_at: string;
}

interface TagSummary {
  id: string;
  slug: string;
  name: string;
}
```

---

## 7. Módulo 6 — Collections

Las colecciones permiten a los usuarios organizar recursos en listas temáticas. Pueden ser públicas (visibles en su perfil) o privadas.

| Método   | Path                                               | Descripción                              | Auth | Request Body                           | Response                                  | Status Codes                |
|----------|----------------------------------------------------|------------------------------------------|------|----------------------------------------|-------------------------------------------|-----------------------------|
| `GET`    | `/api/v1/collections`                              | Colecciones del usuario actual           | Sí   | —                                      | `{ data: Collection[], meta: pagination }`| `200`, `401`                |
| `POST`   | `/api/v1/collections`                              | Crear colección                          | Sí   | `{ name, description?, is_public? }`   | `{ data: Collection }`                   | `201`, `400`, `401`         |
| `GET`    | `/api/v1/collections/:id`                          | Detalle de colección con recursos        | No*  | —                                      | `{ data: CollectionDetail }`             | `200`, `403`, `404`         |
| `PATCH`  | `/api/v1/collections/:id`                          | Actualizar colección (solo dueño)        | Sí   | `{ name?, description?, is_public? }`  | `{ data: Collection }`                   | `200`, `400`, `401`, `403`  |
| `DELETE` | `/api/v1/collections/:id`                          | Eliminar colección (solo dueño)          | Sí   | —                                      | `{ data: { message } }`                 | `200`, `401`, `403`, `404`  |
| `POST`   | `/api/v1/collections/:id/resources`                | Agregar recurso a colección              | Sí   | `{ resource_id: string }`              | `{ data: { message } }`                 | `200`, `400`, `401`, `403`, `409` |
| `DELETE` | `/api/v1/collections/:id/resources/:resourceId`    | Quitar recurso de colección              | Sí   | —                                      | `{ data: { message } }`                 | `200`, `401`, `403`, `404`  |

> [!NOTE]
> \* `GET /collections/:id` devuelve la colección si es pública o si el usuario autenticado es el dueño. Si es privada y el solicitante no es el dueño, responde `403`.

### Esquema: Collection

```typescript
interface Collection {
  id: string;
  name: string;                // Máx. 100 caracteres
  description: string | null;  // Máx. 500 caracteres
  is_public: boolean;
  resources_count: number;
  cover_image_url: string | null; // Generada automáticamente del primer recurso
  owner: ProfileSummary;
  created_at: string;
  updated_at: string;
}

interface CollectionDetail extends Collection {
  resources: ResourceSummary[];  // Recursos dentro de la colección (paginados)
}

interface ResourceSummary {
  id: string;
  slug: string;
  title: string;
  type: ResourceType;
  author: ProfileSummary;
  stats: { likes_count: number; saves_count: number };
  created_at: string;
}
```

---

## 8. Módulo 7 — Likes

El sistema de likes permite a los usuarios indicar apreciación por un recurso. Cada usuario puede dar like una sola vez por recurso (toggle).

| Método   | Path                                | Descripción                              | Auth | Request Body | Response                                      | Status Codes          |
|----------|-------------------------------------|------------------------------------------|------|--------------|-----------------------------------------------|-----------------------|
| `POST`   | `/api/v1/resources/:slug/like`      | Dar like a un recurso                    | Sí   | —            | `{ data: { liked: true, likes_count } }`     | `200`, `401`, `409`   |
| `DELETE` | `/api/v1/resources/:slug/like`      | Quitar like de un recurso                | Sí   | —            | `{ data: { liked: false, likes_count } }`    | `200`, `401`, `404`   |
| `GET`    | `/api/v1/resources/:slug/likes`     | Estado de like y conteo total            | No*  | —            | `{ data: { is_liked, likes_count } }`        | `200`, `404`          |
| `GET`    | `/api/v1/me/likes`                  | Recursos con like del usuario actual     | Sí   | —            | `{ data: ResourceSummary[], meta: pagination }` | `200`, `401`       |

> [!NOTE]
> \* `GET /resources/:slug/likes`: Si el usuario está autenticado, `is_liked` refleja su estado. Si no está autenticado, `is_liked` es `null`.

---

## 9. Módulo 8 — Saved Resources

A diferencia de los likes (que son públicos), los guardados son **privados**. Funcionan como marcadores personales para que el usuario acceda rápidamente a recursos de su interés.

| Método   | Path                              | Descripción                          | Auth | Request Body | Response                                          | Status Codes          |
|----------|-----------------------------------|--------------------------------------|------|--------------|---------------------------------------------------|-----------------------|
| `POST`   | `/api/v1/resources/:slug/save`    | Guardar recurso de forma privada     | Sí   | —            | `{ data: { saved: true, saves_count } }`         | `200`, `401`, `409`   |
| `DELETE` | `/api/v1/resources/:slug/save`    | Quitar recurso de guardados          | Sí   | —            | `{ data: { saved: false, saves_count } }`        | `200`, `401`, `404`   |
| `GET`    | `/api/v1/me/saved`                | Todos los recursos guardados         | Sí   | —            | `{ data: ResourceSummary[], meta: pagination }`  | `200`, `401`          |

### Query Parameters para `GET /api/v1/me/saved`

| Parámetro | Tipo     | Default  | Descripción                            |
|-----------|----------|----------|----------------------------------------|
| `type`    | `string` | —        | Filtrar por tipo de recurso            |
| `sort`    | `string` | `recent` | `recent`, `oldest`                     |
| `cursor`  | `string` | —        | Cursor de paginación                   |
| `limit`   | `number` | `20`     | Elementos por página (máx. 100)        |

---

## 10. Módulo 9 — Comments

Los comentarios permiten discusión en los recursos. Soportan un nivel de respuestas (replies) para mantener la simplicidad en el MVP.

| Método   | Path                                     | Descripción                           | Auth | Request Body                              | Response                                    | Status Codes                |
|----------|------------------------------------------|---------------------------------------|------|-------------------------------------------|---------------------------------------------|-----------------------------|
| `GET`    | `/api/v1/resources/:slug/comments`       | Comentarios de un recurso (paginados) | No   | —                                         | `{ data: Comment[], meta: pagination }`    | `200`, `404`                |
| `POST`   | `/api/v1/resources/:slug/comments`       | Agregar comentario                    | Sí   | `{ content, parent_id? }`                | `{ data: Comment }`                        | `201`, `400`, `401`, `404`  |
| `PATCH`  | `/api/v1/comments/:id`                   | Editar comentario (solo autor)        | Sí   | `{ content }`                             | `{ data: Comment }`                        | `200`, `400`, `401`, `403`  |
| `DELETE` | `/api/v1/comments/:id`                   | Eliminar comentario (solo autor)      | Sí   | —                                         | `{ data: { message } }`                   | `200`, `401`, `403`, `404`  |

### Esquema: Comment

```typescript
interface Comment {
  id: string;
  content: string;              // Máx. 2000 caracteres, Markdown básico
  author: ProfileSummary;
  parent_id: string | null;     // null = comentario raíz, string = respuesta
  replies_count: number;        // Solo para comentarios raíz
  replies?: Comment[];          // Cargados inline para comentarios raíz
  is_edited: boolean;           // true si fue editado después de crearse
  created_at: string;
  updated_at: string;
}
```

### Query Parameters para `GET /api/v1/resources/:slug/comments`

| Parámetro  | Tipo     | Default  | Descripción                                     |
|------------|----------|----------|-------------------------------------------------|
| `sort`     | `string` | `recent` | `recent`, `oldest`, `popular`                   |
| `cursor`   | `string` | —        | Cursor de paginación                            |
| `limit`    | `number` | `20`     | Comentarios raíz por página (máx. 50)           |

> [!IMPORTANT]
> Las respuestas (replies) se cargan embebidas dentro de cada comentario raíz. En el MVP se limitan a **20 replies** por comentario raíz. Si un comentario tiene más respuestas, se incluye un campo `has_more_replies: true` y el cliente puede solicitar el resto.

---

## 11. Módulo 10 — Follows

El sistema de seguimiento permite a los usuarios seguir a otros creadores para recibir sus publicaciones en el feed personalizado.

| Método   | Path                                          | Descripción                           | Auth | Request Body | Response                                       | Status Codes          |
|----------|-----------------------------------------------|---------------------------------------|------|--------------|-------------------------------------------------|-----------------------|
| `POST`   | `/api/v1/profiles/:username/follow`           | Seguir a un usuario                   | Sí   | —            | `{ data: { following: true } }`                | `200`, `401`, `404`, `409` |
| `DELETE` | `/api/v1/profiles/:username/follow`           | Dejar de seguir a un usuario          | Sí   | —            | `{ data: { following: false } }`               | `200`, `401`, `404`   |
| `GET`    | `/api/v1/profiles/:username/followers`        | Lista de seguidores                   | No   | —            | `{ data: ProfileSummary[], meta: pagination }` | `200`, `404`          |
| `GET`    | `/api/v1/profiles/:username/following`        | Lista de seguidos                     | No   | —            | `{ data: ProfileSummary[], meta: pagination }` | `200`, `404`          |
| `GET`    | `/api/v1/profiles/:username/follow/status`    | Verificar si el usuario actual sigue  | Sí   | —            | `{ data: { is_following: boolean } }`          | `200`, `401`, `404`   |

### Esquema: ProfileSummary

```typescript
interface ProfileSummary {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}
```

---

## 12. Módulo 11 — Search

La búsqueda utiliza **PostgreSQL full-text search** en el MVP, con posibilidad de migrar a **Meilisearch** cuando el volumen de datos lo justifique.

| Método | Path                              | Descripción                              | Auth | Request Body | Response                                       | Status Codes |
|--------|-----------------------------------|------------------------------------------|------|--------------|-------------------------------------------------|--------------|
| `GET`  | `/api/v1/search`                  | Búsqueda global con filtros              | No   | —            | `{ data: SearchResult[], meta: pagination }`   | `200`, `400` |
| `GET`  | `/api/v1/search/suggestions`      | Sugerencias de autocompletado            | No   | —            | `{ data: Suggestion[] }`                       | `200`        |

### Query Parameters para `GET /api/v1/search`

| Parámetro  | Tipo       | Default     | Descripción                                               |
|------------|------------|-------------|------------------------------------------------------------|
| `q`        | `string`   | — (requerido) | Término de búsqueda (mín. 2 caracteres)                  |
| `type`     | `string`   | —           | Filtrar por tipo de recurso                                |
| `category` | `string`   | —           | Slug de categoría                                          |
| `tags`     | `string[]` | —           | Array de slugs de tags                                     |
| `model`    | `string`   | —           | Filtrar por modelo de IA                                   |
| `sort`     | `string`   | `relevance` | `relevance`, `recent`, `popular`, `most_liked`             |
| `cursor`   | `string`   | —           | Cursor de paginación                                       |
| `limit`    | `number`   | `20`        | Resultados por página (máx. 50)                            |

### Esquema: SearchResult

```typescript
interface SearchResult {
  resource: ResourceSummary;
  relevance_score: number;     // Score de relevancia (0-1)
  highlights: {                // Fragmentos con matches resaltados
    title: string | null;      // Con marcadores <mark>...</mark>
    description: string | null;
    content: string | null;
  };
}
```

### Query Parameters para `GET /api/v1/search/suggestions`

| Parámetro | Tipo     | Default | Descripción                                    |
|-----------|----------|---------|------------------------------------------------|
| `q`       | `string` | —       | Prefijo de búsqueda (mín. 1 carácter)          |
| `limit`   | `number` | `5`     | Sugerencias a devolver (máx. 10)               |

### Esquema: Suggestion

```typescript
interface Suggestion {
  text: string;                // Texto sugerido
  type: 'resource' | 'tag' | 'category' | 'user';
  slug: string;                // Slug para navegación directa
  metadata?: {
    resource_type?: ResourceType;
    avatar_url?: string;       // Solo para tipo 'user'
  };
}
```

### Diagrama del Flujo de Búsqueda

```mermaid
flowchart LR
    A["Cliente envía query"] --> B{"¿Longitud >= 2?"}
    B -- No --> C["Retornar error 400"]
    B -- Sí --> D["Sanitizar input"]
    D --> E["Construir ts_query"]
    E --> F["Ejecutar búsqueda\nen PostgreSQL"]
    F --> G["Aplicar filtros\n(type, category, tags)"]
    G --> H["Ordenar resultados"]
    H --> I["Generar highlights"]
    I --> J["Aplicar paginación\ncursor-based"]
    J --> K["Retornar resultados"]
```

---

## 13. Módulo 12 — Discovery / Trending

Los endpoints de descubrimiento proporcionan formas curadas y algorítmicas de explorar contenido sin necesidad de buscar explícitamente.

| Método | Path                             | Descripción                                 | Auth | Request Body | Response                                  | Status Codes |
|--------|----------------------------------|---------------------------------------------|------|--------------|-------------------------------------------|--------------|
| `GET`  | `/api/v1/discover/trending`      | Recursos en tendencia                       | No   | —            | `{ data: Resource[], meta: pagination }` | `200`        |
| `GET`  | `/api/v1/discover/featured`      | Recursos destacados/curados                 | No   | —            | `{ data: Resource[] }`                   | `200`        |
| `GET`  | `/api/v1/discover/recent`        | Recursos más recientes                      | No   | —            | `{ data: Resource[], meta: pagination }` | `200`        |
| `GET`  | `/api/v1/discover/feed`          | Feed personalizado basado en follows        | Sí   | —            | `{ data: Resource[], meta: pagination }` | `200`, `401` |

### Query Parameters para `GET /api/v1/discover/trending`

| Parámetro | Tipo     | Default | Descripción                                           |
|-----------|----------|---------|-------------------------------------------------------|
| `window`  | `string` | `7d`    | Ventana de tiempo: `24h`, `7d`, `30d`                 |
| `type`    | `string` | —       | Filtrar por tipo de recurso                           |
| `limit`   | `number` | `20`    | Recursos a devolver (máx. 50)                         |
| `cursor`  | `string` | —       | Cursor de paginación                                  |

### Algoritmo de Tendencia (MVP)

El score de tendencia se calcula con una fórmula ponderada que favorece actividad reciente:

```
trending_score = (likes * 3 + saves * 2 + views * 0.5 + comments * 4) / hours_since_published^1.5
```

| Factor            | Peso | Razón                                           |
|-------------------|------|--------------------------------------------------|
| Likes             | 3    | Señal fuerte de calidad                          |
| Saves             | 2    | Indica utilidad práctica                          |
| Views             | 0.5  | Señal débil, puede ser por curiosidad             |
| Comments          | 4    | Mayor engagement, indica discusión activa         |
| Decay temporal    | ^1.5 | Penaliza contenido antiguo para favorecer frescura |

### Query Parameters para `GET /api/v1/discover/feed`

| Parámetro | Tipo     | Default | Descripción                                           |
|-----------|----------|---------|-------------------------------------------------------|
| `cursor`  | `string` | —       | Cursor de paginación                                  |
| `limit`   | `number` | `20`    | Recursos por página (máx. 50)                         |

> [!TIP]
> El feed personalizado muestra recursos publicados recientemente por usuarios que el usuario actual sigue. En el MVP es cronológico inverso. En versiones futuras se puede incorporar un algoritmo de ranking basado en engagement y afinidad.

---

## 14. Módulo 13 — Statistics (Creator Dashboard)

Estos endpoints proporcionan datos analíticos para que los creadores puedan entender el rendimiento de su contenido. Todos requieren autenticación y solo devuelven datos del usuario autenticado.

| Método | Path                         | Descripción                                  | Auth | Request Body | Response                        | Status Codes  |
|--------|------------------------------|----------------------------------------------|------|--------------|---------------------------------|---------------|
| `GET`  | `/api/v1/stats/overview`     | Resumen general del dashboard del creador    | Sí   | —            | `{ data: CreatorOverview }`    | `200`, `401`  |
| `GET`  | `/api/v1/stats/resources`    | Estadísticas por recurso individual          | Sí   | —            | `{ data: ResourceStats[] }`   | `200`, `401`  |
| `GET`  | `/api/v1/stats/timeline`     | Métricas a lo largo del tiempo               | Sí   | —            | `{ data: TimelineData }`      | `200`, `401`  |

### Esquema: CreatorOverview

```typescript
interface CreatorOverview {
  total_resources: number;
  total_views: number;
  total_likes: number;
  total_saves: number;
  total_comments: number;
  total_followers: number;
  period_comparison: {         // Comparación con período anterior
    views_change: number;      // Porcentaje de cambio
    likes_change: number;
    saves_change: number;
    followers_change: number;
  };
}
```

### Esquema: ResourceStats

```typescript
interface ResourceStats {
  resource: ResourceSummary;
  views_count: number;
  likes_count: number;
  saves_count: number;
  comments_count: number;
  views_trend: 'up' | 'down' | 'stable'; // Comparado con período anterior
}
```

### Query Parameters para `GET /api/v1/stats/resources`

| Parámetro | Tipo     | Default  | Descripción                               |
|-----------|----------|----------|-------------------------------------------|
| `sort`    | `string` | `views`  | `views`, `likes`, `saves`, `recent`       |
| `limit`   | `number` | `10`     | Recursos a devolver (máx. 50)             |
| `cursor`  | `string` | —        | Cursor de paginación                      |

### Query Parameters para `GET /api/v1/stats/timeline`

| Parámetro | Tipo     | Default | Descripción                               |
|-----------|----------|---------|--------------------------------------------|
| `period`  | `string` | `30d`   | Período: `7d`, `30d`, `90d`               |
| `metric`  | `string` | `views` | Métrica: `views`, `likes`, `saves`         |

### Esquema: TimelineData

```typescript
interface TimelineData {
  period: string;
  metric: string;
  data_points: {
    date: string;           // Formato YYYY-MM-DD
    value: number;
  }[];
  total: number;
  average: number;
}
```

---

## 15. Matriz de Autorización

La siguiente tabla resume los requisitos de autenticación y autorización para cada endpoint:

| Endpoint                                         | Auth   | Permiso                  | Notas                                       |
|--------------------------------------------------|--------|--------------------------|----------------------------------------------|
| **Auth**                                         |        |                          |                                              |
| `POST /auth/google`                              | No     | Público                  |                                              |
| `POST /auth/callback`                            | No     | Público                  |                                              |
| `POST /auth/logout`                              | Sí     | Usuario autenticado      |                                              |
| `GET /auth/session`                              | Sí     | Usuario autenticado      |                                              |
| **Profiles**                                     |        |                          |                                              |
| `GET /profiles/:username`                        | No     | Público                  |                                              |
| `PATCH /profiles/me`                             | Sí     | Solo propietario         | Solo puede editar su propio perfil           |
| `GET /profiles/:username/resources`              | No     | Público                  | Solo muestra recursos publicados             |
| `GET /profiles/:username/collections`            | No     | Público                  | Solo colecciones públicas                    |
| `GET /profiles/:username/stats`                  | No     | Público                  |                                              |
| **Resources**                                    |        |                          |                                              |
| `GET /resources`                                 | No     | Público                  | Solo recursos publicados                     |
| `POST /resources`                                | Sí     | Usuario autenticado      | Creador se asigna automáticamente            |
| `GET /resources/:slug`                           | No*    | Público / Autor          | Borradores solo visibles para el autor       |
| `PATCH /resources/:slug`                         | Sí     | Solo autor               | RLS valida `author_id = auth.uid()`          |
| `DELETE /resources/:slug`                        | Sí     | Solo autor               | RLS valida `author_id = auth.uid()`          |
| `POST /resources/:slug/publish`                  | Sí     | Solo autor               | Valida que tenga todos los campos requeridos |
| `POST /resources/:slug/archive`                  | Sí     | Solo autor               |                                              |
| `GET /resources/me/drafts`                       | Sí     | Solo autor               | Solo propios borradores                      |
| **Categories**                                   |        |                          |                                              |
| `GET /categories`                                | No     | Público                  |                                              |
| `GET /categories/:slug`                          | No     | Público                  |                                              |
| `GET /categories/:slug/resources`                | No     | Público                  |                                              |
| **Tags**                                         |        |                          |                                              |
| `GET /tags`                                      | No     | Público                  |                                              |
| `GET /tags/:slug/resources`                      | No     | Público                  |                                              |
| `GET /tags/popular`                              | No     | Público                  |                                              |
| **Collections**                                  |        |                          |                                              |
| `GET /collections`                               | Sí     | Usuario autenticado      | Solo propias colecciones                     |
| `POST /collections`                              | Sí     | Usuario autenticado      |                                              |
| `GET /collections/:id`                           | No*    | Público / Propietario    | Privadas solo para el propietario            |
| `PATCH /collections/:id`                         | Sí     | Solo propietario         | RLS valida `owner_id = auth.uid()`           |
| `DELETE /collections/:id`                        | Sí     | Solo propietario         | RLS valida `owner_id = auth.uid()`           |
| `POST /collections/:id/resources`                | Sí     | Solo propietario         |                                              |
| `DELETE /collections/:id/resources/:resourceId`  | Sí     | Solo propietario         |                                              |
| **Likes**                                        |        |                          |                                              |
| `POST /resources/:slug/like`                     | Sí     | Usuario autenticado      |                                              |
| `DELETE /resources/:slug/like`                   | Sí     | Usuario autenticado      |                                              |
| `GET /resources/:slug/likes`                     | No*    | Público                  | `is_liked` solo si está autenticado          |
| `GET /me/likes`                                  | Sí     | Usuario autenticado      | Solo propios likes                           |
| **Saved**                                        |        |                          |                                              |
| `POST /resources/:slug/save`                     | Sí     | Usuario autenticado      |                                              |
| `DELETE /resources/:slug/save`                   | Sí     | Usuario autenticado      |                                              |
| `GET /me/saved`                                  | Sí     | Usuario autenticado      | Solo propios guardados                       |
| **Comments**                                     |        |                          |                                              |
| `GET /resources/:slug/comments`                  | No     | Público                  |                                              |
| `POST /resources/:slug/comments`                 | Sí     | Usuario autenticado      |                                              |
| `PATCH /comments/:id`                            | Sí     | Solo autor del comentario|                                              |
| `DELETE /comments/:id`                           | Sí     | Solo autor del comentario|                                              |
| **Follows**                                      |        |                          |                                              |
| `POST /profiles/:username/follow`                | Sí     | Usuario autenticado      | No puede seguirse a sí mismo                 |
| `DELETE /profiles/:username/follow`              | Sí     | Usuario autenticado      |                                              |
| `GET /profiles/:username/followers`              | No     | Público                  |                                              |
| `GET /profiles/:username/following`              | No     | Público                  |                                              |
| `GET /profiles/:username/follow/status`          | Sí     | Usuario autenticado      |                                              |
| **Search**                                       |        |                          |                                              |
| `GET /search`                                    | No     | Público                  |                                              |
| `GET /search/suggestions`                        | No     | Público                  |                                              |
| **Discovery**                                    |        |                          |                                              |
| `GET /discover/trending`                         | No     | Público                  |                                              |
| `GET /discover/featured`                         | No     | Público                  |                                              |
| `GET /discover/recent`                           | No     | Público                  |                                              |
| `GET /discover/feed`                             | Sí     | Usuario autenticado      | Feed personalizado basado en follows         |
| **Statistics**                                   |        |                          |                                              |
| `GET /stats/overview`                            | Sí     | Usuario autenticado      | Solo datos propios                           |
| `GET /stats/resources`                           | Sí     | Usuario autenticado      | Solo recursos propios                        |
| `GET /stats/timeline`                            | Sí     | Usuario autenticado      | Solo datos propios                           |

> [!IMPORTANT]
> Los endpoints marcados con **No*** tienen un comportamiento diferenciado: son accesibles sin autenticación para contenido público, pero proporcionan información adicional (como `is_liked`, `is_saved`, o acceso a contenido privado) cuando el usuario está autenticado.

---

## 16. Ejemplos Detallados de Request / Response

### 16.1 Crear un Recurso

Este ejemplo muestra la creación de un prompt como borrador.

**Request:**

```http
POST /api/v1/resources HTTP/1.1
Host: api.prompthub.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Generador de User Stories con criterios de aceptación",
  "description": "Un prompt avanzado que genera user stories completas con criterios de aceptación, escenarios de prueba y estimación de complejidad. Ideal para product managers y equipos ágiles.",
  "content": "# Rol\nActúa como un Product Manager senior con experiencia en metodologías ágiles.\n\n# Tarea\nGenera una user story completa basada en la siguiente descripción de funcionalidad:\n\n{{FEATURE_DESCRIPTION}}\n\n# Formato de salida\n## User Story\n**Como** [tipo de usuario]\n**Quiero** [acción]\n**Para** [beneficio]\n\n## Criterios de Aceptación\n- [ ] Criterio 1\n- [ ] Criterio 2\n\n## Escenarios de Prueba\n1. Escenario happy path\n2. Escenario edge case\n\n## Estimación\n- Complejidad: [Baja/Media/Alta]\n- Story Points: [1-13]",
  "type": "prompt",
  "category_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tags": [
    "f1e2d3c4-b5a6-7890-abcd-ef1234567890",
    "a9b8c7d6-e5f4-3210-abcd-ef1234567890"
  ],
  "model": "gpt-4",
  "model_params": {
    "temperature": 0.7,
    "max_tokens": 2000,
    "top_p": 0.9
  }
}
```

**Response: `201 Created`**

```jsonc
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "generador-user-stories-criterios-aceptacion",
    "title": "Generador de User Stories con criterios de aceptación",
    "description": "Un prompt avanzado que genera user stories completas con criterios de aceptación, escenarios de prueba y estimación de complejidad. Ideal para product managers y equipos ágiles.",
    "content": "# Rol\nActúa como un Product Manager senior...",
    "type": "prompt",
    "status": "draft",
    "category_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "category": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "slug": "productividad",
      "name": "Productividad",
      "icon": "zap"
    },
    "tags": [
      { "id": "f1e2d3c4-b5a6-7890-abcd-ef1234567890", "slug": "agile", "name": "Agile" },
      { "id": "a9b8c7d6-e5f4-3210-abcd-ef1234567890", "slug": "product-management", "name": "Product Management" }
    ],
    "model": "gpt-4",
    "model_params": {
      "temperature": 0.7,
      "max_tokens": 2000,
      "top_p": 0.9
    },
    "author": {
      "id": "user-uuid-123",
      "username": "rodrigo_ml",
      "display_name": "Rodrigo ML",
      "avatar_url": "https://lh3.googleusercontent.com/a/photo.jpg"
    },
    "stats": {
      "views_count": 0,
      "likes_count": 0,
      "saves_count": 0,
      "comments_count": 0
    },
    "is_liked": false,
    "is_saved": false,
    "published_at": null,
    "created_at": "2026-06-18T14:06:23.000Z",
    "updated_at": "2026-06-18T14:06:23.000Z"
  },
  "error": null,
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_crt_9f8e7d6c5b4a"
  }
}
```

**Response de error: `400 Bad Request`** (si faltan campos obligatorios):

```jsonc
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados contienen errores de validación.",
    "details": [
      {
        "field": "title",
        "rule": "min_length",
        "message": "El título debe tener al menos 5 caracteres."
      },
      {
        "field": "category_id",
        "rule": "required",
        "message": "La categoría es obligatoria."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_crt_err_1a2b3c"
  }
}
```

---

### 16.2 Buscar Recursos

Este ejemplo muestra una búsqueda con múltiples filtros y paginación.

**Request:**

```http
GET /api/v1/search?q=user%20stories&type=prompt&category=productividad&tags=agile&sort=relevance&limit=10 HTTP/1.1
Host: api.prompthub.app
```

**Response: `200 OK`**

```jsonc
{
  "data": [
    {
      "resource": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "slug": "generador-user-stories-criterios-aceptacion",
        "title": "Generador de User Stories con criterios de aceptación",
        "type": "prompt",
        "author": {
          "id": "user-uuid-123",
          "username": "rodrigo_ml",
          "display_name": "Rodrigo ML",
          "avatar_url": "https://lh3.googleusercontent.com/a/photo.jpg"
        },
        "stats": {
          "likes_count": 47,
          "saves_count": 23
        },
        "created_at": "2026-06-15T10:30:00.000Z"
      },
      "relevance_score": 0.92,
      "highlights": {
        "title": "Generador de <mark>User Stories</mark> con criterios de aceptación",
        "description": "Un prompt avanzado que genera <mark>user stories</mark> completas con criterios de aceptación...",
        "content": null
      }
    },
    {
      "resource": {
        "id": "661f9500-f30c-52e5-b827-557766550111",
        "slug": "framework-historias-usuario-bdd",
        "title": "Framework de Historias de Usuario con BDD",
        "type": "prompt",
        "author": {
          "id": "user-uuid-456",
          "username": "ana_dev",
          "display_name": "Ana Developer",
          "avatar_url": "https://lh3.googleusercontent.com/a/another.jpg"
        },
        "stats": {
          "likes_count": 31,
          "saves_count": 18
        },
        "created_at": "2026-06-10T08:15:00.000Z"
      },
      "relevance_score": 0.78,
      "highlights": {
        "title": "Framework de Historias de <mark>Usuario</mark> con BDD",
        "description": "Genera <mark>user stories</mark> utilizando el formato BDD (Given-When-Then)...",
        "content": "...escribe <mark>user stories</mark> detalladas siguiendo las mejores prácticas..."
      }
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_srch_4e5f6a7b",
    "pagination": {
      "next_cursor": "eyJzY29yZSI6MC43OCwiaWQiOiI2NjFmOTUwMCJ9",
      "has_more": true,
      "limit": 10
    },
    "search": {
      "query": "user stories",
      "filters_applied": {
        "type": "prompt",
        "category": "productividad",
        "tags": ["agile"]
      },
      "total_estimate": 24
    }
  }
}
```

---

### 16.3 Obtener un Perfil Público

Este ejemplo muestra cómo obtener el perfil público de un usuario, incluyendo un caso exitoso y un caso de error.

**Request:**

```http
GET /api/v1/profiles/rodrigo_ml HTTP/1.1
Host: api.prompthub.app
```

**Response: `200 OK`**

```jsonc
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "rodrigo_ml",
    "display_name": "Rodrigo ML",
    "bio": "Desarrollador full-stack apasionado por la IA generativa. Comparto prompts y herramientas para mejorar la productividad de equipos de desarrollo.",
    "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK...",
    "website": "https://rodrigo.dev",
    "social_links": {
      "twitter": "rodrigo_ml_dev",
      "github": "rodrigoml",
      "linkedin": "rodrigo-ml"
    },
    "created_at": "2026-01-15T09:30:00.000Z",
    "updated_at": "2026-06-10T14:20:00.000Z"
  },
  "error": null,
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_prf_8c9d0e1f"
  }
}
```

**Response de error: `404 Not Found`** (usuario no existe):

```jsonc
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "No se encontró un perfil con el nombre de usuario 'usuario_inexistente'.",
    "details": null
  },
  "meta": {
    "timestamp": "2026-06-18T14:06:23.000Z",
    "request_id": "req_prf_err_2a3b4c"
  }
}
```

---

## Apéndice: Resumen de Implementación

### Estructura de Archivos de la API (Next.js App Router)

```
src/app/api/v1/
├── auth/
│   ├── google/route.ts
│   ├── callback/route.ts
│   ├── logout/route.ts
│   └── session/route.ts
├── profiles/
│   ├── me/route.ts
│   └── [username]/
│       ├── route.ts
│       ├── resources/route.ts
│       ├── collections/route.ts
│       ├── stats/route.ts
│       ├── follow/
│       │   ├── route.ts
│       │   └── status/route.ts
│       ├── followers/route.ts
│       └── following/route.ts
├── resources/
│   ├── route.ts
│   ├── me/
│   │   └── drafts/route.ts
│   └── [slug]/
│       ├── route.ts
│       ├── publish/route.ts
│       ├── archive/route.ts
│       ├── like/route.ts
│       ├── save/route.ts
│       ├── likes/route.ts
│       └── comments/route.ts
├── categories/
│   ├── route.ts
│   └── [slug]/
│       ├── route.ts
│       └── resources/route.ts
├── tags/
│   ├── route.ts
│   ├── popular/route.ts
│   └── [slug]/
│       └── resources/route.ts
├── collections/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── resources/
│           ├── route.ts
│           └── [resourceId]/route.ts
├── comments/
│   └── [id]/route.ts
├── me/
│   ├── likes/route.ts
│   └── saved/route.ts
├── search/
│   ├── route.ts
│   └── suggestions/route.ts
├── discover/
│   ├── trending/route.ts
│   ├── featured/route.ts
│   ├── recent/route.ts
│   └── feed/route.ts
└── stats/
    ├── overview/route.ts
    ├── resources/route.ts
    └── timeline/route.ts
```

### Middleware Compartido

Cada route handler utiliza middleware común para:

| Middleware          | Responsabilidad                                                |
|---------------------|----------------------------------------------------------------|
| `withAuth`          | Valida JWT de Supabase, inyecta `user` en el contexto          |
| `withOptionalAuth`  | Intenta validar JWT pero no falla si no hay token              |
| `withValidation`    | Valida request body/params con Zod schemas                     |
| `withRateLimit`     | Aplica rate limiting basado en IP o user ID                    |
| `withErrorHandler`  | Captura errores y los formatea según el estándar de la API     |

```typescript
// Ejemplo de uso en un route handler
import { withAuth, withValidation, withErrorHandler } from '@/lib/api/middleware';
import { createResourceSchema } from '@/lib/api/schemas/resources';

export const POST = withErrorHandler(
  withAuth(
    withValidation(createResourceSchema, async (req, ctx) => {
      // Lógica del endpoint
      const resource = await createResource(ctx.body, ctx.user);
      return Response.json({
        data: resource,
        error: null,
        meta: { timestamp: new Date().toISOString() }
      }, { status: 201 });
    })
  )
);
```

> [!WARNING]
> Este documento define la **interfaz pública** de la API. Los detalles de implementación interna (queries SQL, lógica de negocio, manejo de caché) se documentan en los archivos de código correspondientes y en el documento de arquitectura técnica.

---

*Última actualización: Junio 2026*
*Versión del documento: 1.0*
*Versión de la API: v1*
