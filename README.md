

La Misión

Nexus Académico es una plataforma de inteligencia y sincronización de carga académica diseñada para atacar la raíz del burnout estudiantil. En lugar de darle al alumno otra app para gestionar el estrés, le damos a la institución una herramienta para dejar de crearlo en primer lugar.

Este proyecto es nuestro prototipo funcional desarrollado para el Hackathon, enfocado en demostrar la viabilidad y el impacto de un sistema coordinado.

El Problema Real

Los profesores asignan tareas a ciegas, sin conocer la carga que sus alumnos ya soportan por parte de otras materias. El resultado es una sobrecarga académica no intencionada, concentrada en semanas específicas, que lleva a los estudiantes a un estado de carga mental limítrofe.

La Solución: Inteligencia sobre Esfuerzo

Nexus Académico se conecta a los sistemas existentes para crear un ecosistema de planificación consciente. La plataforma analiza la carga académica de forma objetiva y la presenta en dashboards intuitivos para que profesores y coordinadores puedan tomar decisiones informadas, coordinadas y empáticas.

Funcionalidades Clave del Prototipo

Panel de Profesor (TeacherPanel): ¡La joya de la corona! Una interfaz interactiva donde el profesor puede simular la asignación de una nueva tarea. Antes de publicarla, visualiza el impacto que tendrá en la carga semanal de sus alumnos, recibe alertas de riesgo de burnout y obtiene sugerencias para optimizar las fechas de entrega. Es una herramienta predictiva, no reactiva.

Panel de Coordinador (CoordinatorPanel): Una vista macro para directores de carrera. Permite identificar patrones de sobrecarga a lo largo del semestre, detectar "cuellos de botella" y reestructurar los planes de estudio de forma estratégica y basada en datos.

API Handler (APIHandler): El cerebro detrás de la simulación. Este módulo contiene la lógica para calcular la Puntuación de Carga Académica (PCA), procesando las tareas y generando las alertas.

Componentes de UI (Bars, SideBar, TopBar): Módulos reutilizables que construyen una interfaz de usuario limpia, moderna y fácil de navegar.

Estructura del Proyecto

El proyecto está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

