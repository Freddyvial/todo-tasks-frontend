# todo-tasks-frontend

SPA (Single Page Application) para gestionar tareas tipo TODO construida con **Angular 21**,
**Angular Material** y **RxJS + Signals**.

Consume la API REST del backend [todo-tasks-backend](https://github.com/Freddyvial/todo-tasks-backend).

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 20 LTS         |
| npm         | 10+            |
| Angular CLI | 21.x           |
| Backend     | ejecutándose en `http://localhost:8080` |

## Ejecutar localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar la aplicación
ng serve
```

La aplicación queda disponible en `http://localhost:4200`.

> El backend debe estar corriendo antes de abrir el frontend. Ver instrucciones en
> [todo-tasks-backend](https://github.com/Freddyvial/todo-tasks-backend).

## Funcionalidades

- **Crear tareas** con título, descripción, fecha de ejecución e ítems checkeables.
- **Editar tareas** y sus ítems desde un modal con Reactive Form.
- **Eliminar tareas** con diálogo de confirmación.
- **Gestionar ítems** desde la tarjeta sin necesidad de abrir el formulario completo.
- **Cambiar estado** respetando las transiciones válidas del negocio.
- **Listar tareas** de forma paginada con ordenamiento por fecha de ejecución.
- **Buscar tareas** por título o descripción con debounce de 400ms.
- **Filtrar** por estado, tareas pendientes (`pendingOnly`) y tareas vencidas (`dueNowOnly`).
- **Alertas visuales**: chip rojo para tareas cuya fecha ya llegó (`dueNowAlert`), chip azul
  para tareas pendientes (`pendingExecution`).
- **Barra de progreso** con porcentaje de ítems completados por tarea.
- **Diseño responsive** — la barra de filtros colapsa en móvil.

## Arquitectura

### Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 21 (standalone components, Signals) |
| UI | Angular Material 21 (M3 theming) |
| Formularios | Reactive Forms |
| HTTP | HttpClient con interceptor de errores |
| Estado | Signals de Angular (sin NgRx) |
| Estilos | SCSS + Angular Material theming |

### Estructura de componentes

```
App (shell — toolbar + router-outlet)
└── TaskList (smart — orquesta la vista principal)
    ├── TaskFilterBar (dumb — filtros con debounce)
    ├── LoadingSpinner (dumb — overlay de carga)
    ├── EmptyState (dumb — mensaje de lista vacía)
    ├── TaskCard x N (dumb — tarjeta OnPush)
    │   └── TaskStatusBadge (dumb — chip de estado)
    └── [Dialogs lazy loaded]
        ├── TaskFormDialog (smart — crear/editar)
        │   └── TaskItemForm (dumb — FormArray de ítems)
        ├── TaskItemsQuickDialog (gestión rápida de ítems)
        ├── StatusChangeDialog (smart — transiciones de estado)
        └── ConfirmDialog (shared — confirmación genérica)
```

Los componentes **dumb** usan `ChangeDetectionStrategy.OnPush` y se comunican únicamente
mediante `input()` y `output()`. Los dialogs se cargan de forma **lazy** con `import()`
dinámico para reducir el bundle inicial.

### Estructura de paquetes

```
src/app/
├── core/
│   ├── handlers/       → GlobalErrorHandler (errores JS no atrapados)
│   ├── interceptors/   → ErrorInterceptor (errores HTTP → MatSnackBar)
│   └── services/       → TaskService (6 métodos HTTP)
├── shared/
│   ├── models/         → interfaces TypeScript (Task, PageResponse, TaskFilter)
│   ├── pipes/          → ElapsedTimePipe
│   └── components/     → ConfirmDialog, LoadingSpinner, EmptyState
└── features/tasks/
    └── components/     → TaskList, TaskFilterBar, TaskCard, TaskFormDialog,
                          TaskItemForm, TaskStatusBadge, StatusChangeDialog,
                          TaskItemsQuickDialog
```

## Manejo de errores

El manejo de errores está organizado en 4 capas:

| Capa | Responsabilidad |
|------|----------------|
| Reactive Forms validators | Valida entrada antes de enviar al servidor |
| Componente (`error` callback) | Limpia estado de carga tras un error |
| `ErrorInterceptor` (HTTP) | Muestra `MatSnackBar` con el mensaje del backend |
| `GlobalErrorHandler` | Captura errores JS no tratados |

## Pruebas

```bash
ng test
```

La suite cubre los escenarios definidos en `.plan/pruebas-docker-frontend.md`.

## Docker

Para levantar el stack completo (backend + frontend) usando Docker Compose, ejecutar desde
la raíz del repositorio del backend donde se encuentra el `docker-compose.yml`:

```bash
docker-compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | `http://localhost` |
| Backend  | `http://localhost:8080` |

En modo Docker, el frontend llama a `/api/tasks` y nginx hace `proxy_pass` al servicio
backend internamente. No se requiere CORS en este modo.

### Construir la imagen Docker del frontend

```bash
docker build -t todo-tasks-frontend .
```

## Evidencia de uso de IA

Este proyecto fue desarrollado con apoyo de **Claude** (Anthropic) usando una metodología
de **especificación primero**: antes de escribir código, se documentó la arquitectura,
los contratos y las decisiones de diseño en la carpeta `.plan/` del repositorio del backend.

Los prompts utilizados y la trazabilidad completa del proceso están documentados en:

- [`.plan/prompts-ia.md`](https://github.com/Freddyvial/todo-tasks-backend/blob/main/.plan/prompts-ia.md)
- [`.plan/`](https://github.com/Freddyvial/todo-tasks-backend/tree/main/.plan)
