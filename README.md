# Hackathon Frontend (Vite)

Este proyecto es un frontend estático servido con Vite. Se integra con un backend Node (Google OAuth + Classroom) corriendo en `http://localhost:3001`.

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:3001` con Google OAuth configurado (variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL)

## Scripts

- `npm run dev` — Levanta Vite en `http://localhost:5173`
- `npm run build` — Genera el build de producción en `dist/`
- `npm run preview` — Previsualiza el build en `http://localhost:5173`

## Estructura

- `index.html` — redirige a `/login.html`
- `src/pages/login.html` — Login solo con Google (redirige a `/auth/initiate` del backend)
- `src/pages/landing.html` — Layout con iframe para paneles
- `src/pages/StudentPanel.html` — Panel de alumno
- `src/pages/TeacherPanel.html` — Panel de profesor
- `public/` — recursos estáticos servidos desde `/` (por ejemplo `/js/main.js`, `/css/login.css`)

## Notas de CORS/Sesión

- El login usa cookies httpOnly. En el frontend se hace `fetch` con `{ credentials: 'include' }` contra `http://localhost:3001`.
- Ajusta el CORS y `APP_URL` del backend si cambias puertos u origen.

## Build multipágina

La configuración de Vite incluye entradas múltiples para generar `login.html`, `landing.html`, `StudentPanel.html` y `TeacherPanel.html` directamente en `dist/`.

La Misión

Nexus Académico es una plataforma de inteligencia y sincronización de carga académica diseñada para atacar la raíz del burnout estudiantil. En lugar de darle al alumno otra app para gestionar el estrés, le damos a la institución una herramienta para dejar de crearlo en primer lugar.

Este proyecto es nuestro prototipo funcional desarrollado para el Hackathon, enfocado en demostrar la viabilidad y el impacto de un sistema coordinado.

El Problema Real

Los profesores asignan tareas a ciegas, sin conocer la carga que sus alumnos ya soportan por parte de otras materias. El resultado es una sobrecarga académica no intencionada, concentrada en semanas específicas, que lleva a los estudiantes a un estado de carga mental limítrofe.

La Solución: Inteligencia sobre Esfuerzo

Nexus Académico se conecta a los sistemas existentes para crear un ecosistema de planificación consciente. La plataforma analiza la carga académica de forma objetiva y la presenta en dashboards intuitivos para que profesores y coordinadores puedan tomar decisiones informadas, coordinadas y empáticas.

Funcionalidades Clave del Prototipo

Panel de Profesor (TeacherPanel): ¡La joya de la corona! Una interfaz interactiva donde el profesor puede simular la asignación de una nueva tarea. Antes de publicarla, visualiza el impacto que tendrá en la carga semanal de sus alumnos, recibe alertas de riesgo de burnout y obtiene sugerencias para optimizar las fechas de entrega. Es una herramienta predictiva, no reactiva.

API Handler (APIHandler): El cerebro detrás de la simulación. Este módulo contiene la lógica para calcular la Puntuación de Carga Académica (PCA), procesando las tareas y generando las alertas.

Componentes de UI (Bars, SideBar, TopBar): Módulos reutilizables que construyen una interfaz de usuario limpia, moderna y fácil de navegar.

Estructura del Proyecto

```
/
├── public/
│   ├── css/
│   │   ├── login.css         # Estilos para la página de login.
│   │   └── styles.css        # Estilos globales para los paneles.
│   └── js/
│       ├── login.js          # Lógica para el formulario de login/registro.
│       └── main.js           # Lógica principal para gráficos y carga académica.
├── src/
│   ├── components/
│   │   ├── SideBar.html      # Componente de la barra lateral de navegación.
│   │   ├── TopBar.html       # Componente de la barra superior.
│   │   └── template.html     # (No utilizado) Plantilla base de HTML.
│   ├── pages/
│   │   ├── TeacherPanel.html # Vista para el profesor.
│   │   ├── landing.html      # Contenedor principal con la navegación y el iframe.
│   │   └── login.html        # Página de inicio de sesión.
│   └── services/
│       └── api.js            # Lógica de API (simulada).
├── index.html                # Redirige automáticamente a la página de login.
└── README.md                 # La documentación de tu proyecto.

```
