# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
./.agents
└─ /rules
   └─ <nombre-regla>.md
./.skills
   └─ /<nombre-skill>
      └─ /SKILL.md
```

## Cómo ejecutar en local

```bash
docker compose up --build
```

El frontend usa por defecto el proxy de Vite para `/api`, así que no necesitas variables de entorno extra ni en desarrollo local ni en Codespaces.
Si necesitas apuntar a otro backend, copia `frontend/.env.example` como `.env` y define `VITE_API_BASE_URL`.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## Imagen de producción del frontend

El Docker Compose anterior conserva el servidor de desarrollo de Vite. Para construir la imagen estática de producción:

```bash
docker build --target production -t dashboard-frontend ./frontend
docker compose up -d backend
docker run --rm -p 8080:80 --add-host host.docker.internal:host-gateway \
   -e API_UPSTREAM=host.docker.internal:8000 dashboard-frontend
```

La imagen sirve los archivos optimizados de Vite con Nginx y aplica fallback SPA. `API_UPSTREAM` configura el proxy `/api/` al arrancar, sin reconstruir la imagen; debe ser `host:puerto`, sin esquema ni ruta. El ejemplo usa el puerto del backend publicado en el host, como el proxy Vite de Compose, para entornos que bloquean el tráfico directo entre contenedores. En una red Docker compartida que permita ese tráfico, usa `--network <red>` y omite la variable para conservar `backend:8000`. No elimines el prefijo `/api`.

Smoke test desde otra terminal (debe devolver HTTP 200 y JSON, no el HTML de la SPA):

```bash
curl --fail --max-time 10 -i http://localhost:8000/health
curl --fail --max-time 10 -i 'http://localhost:8080/api/metrics?business_type=B2B'
```

El backend de Compose conserva `debugpy` y `--reload`: este ejemplo verifica la imagen frontend de producción contra la API local, no un despliegue productivo completo.

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
