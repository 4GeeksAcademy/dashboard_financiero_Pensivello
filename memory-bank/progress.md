# Progreso de auditorías y skills

Bitácora de trabajo realizado y validado el **2026-10-26**. Los estados se
limitan a comprobaciones ejecutadas; una imagen construida no equivale a un
despliegue realizado.

## Skills utilizadas y creadas

- **Skill comunitaria `vercel-react-best-practices`** (`.agents/skills/vercel-react-best-practices/`): aplicada a la carga de módulos React y a la reducción de renders redundantes.
- **Skill comunitaria `seo`** (`.agents/skills/seo/`): aplicada para definir metadatos y rastrear la instancia local en el puerto `5173`.
- **Skill interna `deployment-readiness`** (`.agents/skills/deployment-readiness/SKILL.md`): creada para cubrir la falta de un procedimiento específico de este repositorio para validar Docker, la conectividad frontend/API y la preparación para despliegue. Sus inputs, pasos, salida y criterios de aceptación están definidos en el archivo de la skill.

## Cambios realizados

- Se cargan de forma diferida los gráficos de Recharts y la página de comparación B2B/B2C; sus módulos dejan de ser dependencias iniciales de la navegación que no los muestra (`frontend/src/App.tsx`).
- Se eliminaron sincronizaciones redundantes de estado en efectos y el estado de entrada del umbral se aisló en su control (`frontend/src/App.tsx`, `frontend/src/components/dashboard/alerts-table.tsx`, `frontend/src/components/dashboard/business-comparison-page.tsx`).
- Se añadió un Dockerfile multietapa para desarrollo y producción. El target de producción sirve el build estático con Nginx, proxy `/api/` y fallback SPA; Compose conserva explícitamente el target de desarrollo (`frontend/Dockerfile`, `frontend/nginx.conf`, `frontend/.dockerignore`, `docker-compose.yml`).
- Se documentaron los targets Docker de producción en ambos README (`README.es.md`, `README.md`).
- Se añadieron título, descripción y `noindex, follow` para identificar la aplicación como demostración, y el título dinámico de React se sincronizó con esa decisión (`frontend/index.html`, `frontend/src/App.tsx`).
- Se justificó la decisión de no indexar el dashboard mock y de no declarar sitemap/canonical sin dominio ni páginas públicas estables (`memory-bank/current-state.md`).

## Verificaciones ejecutadas

| Verificación | Resultado | Evidencia |
|---|---|---|
| Build de frontend y TypeScript | ✅ | `cd frontend && npm run build` |
| Lint de frontend | ✅ | `cd frontend && npm run lint` |
| Configuración Compose | ✅ | `docker compose config --quiet` |
| Builds Docker frontend | ✅ | Builds de targets `development` y `production` completados |
| HTTP de imagen de producción | ✅ | Nginx respondió `200` en `/` y en una ruta SPA |
| Rastreo SEO por URL temporal `app.github.dev` | ⚠️ No inspeccionó la app | El crawler siguió redirecciones a `github.dev/pf-signin`; sus hallazgos no describen el frontend |
| Rastreo SEO local en puerto `5173` | ✅ Parcial | `http://localhost:5173/` respondió `200`; detectó título, descripción y `noindex`. No pudo renderizar JavaScript por falta de Chromium, por lo que el H1 y el contenido React no quedaron verificados |
| Compose local en ejecución | ✅ | Frontend `:5173`, backend `/health` y proxy `/api/metrics` respondieron `200` |
| Proxy `/api/metrics` desde la imagen Nginx de producción | ❌ | En el smoke test de la red Docker local la petición agotó el tiempo de espera; DNS resolvió `backend`, pero no se confirmó respuesta HTTP |

## Estado y pendientes comprobables

- La aplicación local funciona a través de Vite y su proxy API; esto no prueba
  que la topología de producción sea correcta.
- El frontend de producción se construye y sirve HTML, pero la conectividad de
  su proxy API no quedó verificada correctamente. Resolver este punto y repetir
  el smoke test es requisito antes de afirmar que el stack completo está listo.
- El backend configurado en `backend/Dockerfile` arranca con `debugpy` y
  Uvicorn `--reload`; esa configuración sigue siendo de desarrollo.
- No se hizo despliegue externo, publicación de imagen ni ejecución de tests
  backend en esta auditoría.
