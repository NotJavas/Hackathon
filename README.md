

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

El proyecto está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

¡Claro\! Basado en los archivos que has subido, he actualizado la estructura de tu proyecto para que refleje con precisión cómo están organizados los directorios y archivos.

Aquí tienes la versión corregida y detallada:

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