document.addEventListener("DOMContentLoaded", () => {
  const courseSelect = document.getElementById("course-select");
  const feedbackBox = document.getElementById("feedback-box");
  const analysisForm = document.getElementById("analysis-form");
  const taskTypeInput = document.getElementById("task-type");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskDueDateInput = document.getElementById("task-due-date");
  const studentCountInfo = document.getElementById("student-count-info");

  // Calendar elements
  const calendarContainer = document.getElementById("calendar-container");
  const calendarTitle = document.getElementById("calendar-title");
  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");

  let currentCourseId = null;
  let originalWeeklyLoad = {};
  let studentCount = 0;
  let currentDisplayDate = new Date("2025-10-16T12:00:00Z"); // Fixed date for consistency

  // --- Utility Functions ---
  function getStartOfWeek(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setUTCDate(diff)).toISOString().split("T")[0];
  }

  function getWeekLabel(startDate) {
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const options = { day: "numeric", month: "short", timeZone: "UTC" };
    return `${start.toLocaleDateString("es-MX", options)} - ${end.toLocaleDateString("es-MX", options)}`;
  }

  function getLoadColor(load) {
    if (load >= 45) return "bg-red-500";
    if (load >= 25) return "bg-yellow-500";
    return "bg-teal-500";
  }

  // Gets points from the dropdown task type
  function getTaskPointsFromType(type) {
    const lowerCaseType = type.toLowerCase();
    if (lowerCaseType === "examen") return 25;
    if (lowerCaseType === "proyecto") return 20;
    if (lowerCaseType === "tarea") return 10;
    return 8; // 'otro' or default
  }

  // Gets points by parsing the title of an existing task
  function getTaskPointsFromTitle(title) {
    if (!title) return 8;
    const lowerCaseTitle = title.toLowerCase();
    if (lowerCaseTitle.includes("examen")) return 25;
    if (lowerCaseTitle.includes("proyecto")) return 20;
    if (lowerCaseTitle.includes("tarea")) return 10;
    return 8;
  }

  async function loadTeacherCourses() {
    try {
      const response = await fetch("http://localhost:3001/api/teacher/courses", { credentials: "include" });
      if (!response.ok) throw new Error("No se pudieron cargar los cursos.");
      const courses = await response.json();
      courseSelect.innerHTML = '<option value="">Seleccione un curso...</option>';
      courses.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      feedbackBox.innerHTML = `<p class="text-red-400">${error.message}</p>`;
    }
  }

  function calculateAverageWeeklyLoad(allAssignments) {
    const workloadByStudent = {};
    allAssignments.forEach((task) => {
      if (!task.fecha_entrega) return;
      const studentId = task.studentId;
      if (!workloadByStudent[studentId]) workloadByStudent[studentId] = {};
      const parts = task.fecha_entrega.split("/");
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const weekStart = getStartOfWeek(isoDate);
      if (!workloadByStudent[studentId][weekStart]) workloadByStudent[studentId][weekStart] = 0;
      workloadByStudent[studentId][weekStart] += getTaskPointsFromTitle(task.titulo); // Correctly parse existing task titles
    });

    const weeklyTotals = {};
    const studentIds = Object.keys(workloadByStudent);
    studentCount = studentIds.length;
    if (studentCount === 0) return {};

    studentIds.forEach((studentId) => {
      for (const week in workloadByStudent[studentId]) {
        if (!weeklyTotals[week]) weeklyTotals[week] = 0;
        weeklyTotals[week] += workloadByStudent[studentId][week];
      }
    });

    const averageLoad = {};
    for (const week in weeklyTotals) {
      averageLoad[week] = { base: Math.round(weeklyTotals[week] / studentCount) };
    }
    return averageLoad;
  }

  function renderCalendar(academicLoad, targetDate, highlightWeek = null) {
    if (!calendarContainer) return;
    calendarTitle.textContent = targetDate.toLocaleString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });
    calendarContainer.innerHTML = "";

    const days = ["L", "M", "M", "J", "V", "S", "D"];
    days.forEach((day) => {
      const dayHeader = document.createElement("div");
      dayHeader.className = "font-bold text-gray-400 pb-2";
      dayHeader.textContent = day;
      calendarContainer.appendChild(dayHeader);
    });

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    let startingDay = firstDayOfMonth.getUTCDay();
    if (startingDay === 0) startingDay = 6;
    else startingDay -= 1;

    for (let i = 0; i < startingDay; i++) calendarContainer.appendChild(document.createElement("div"));

    for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
      const dayCell = document.createElement("div");
      const currentDate = new Date(Date.UTC(year, month, i));
      const weekStart = getStartOfWeek(currentDate);
      const weekData = academicLoad[weekStart];
      dayCell.className = "h-12 flex items-center justify-center rounded-md bg-gray-800/50 border border-transparent tooltip";
      dayCell.textContent = i;

      if (weekData) {
        const load = weekData.base;
        dayCell.classList.add(getLoadColor(load));
        dayCell.classList.remove("bg-gray-800/50");
        const tooltipText = document.createElement("span");
        tooltipText.className = "tooltip-text";
        tooltipText.innerHTML = `<strong>Semana del ${getWeekLabel(weekStart)}</strong><br>Carga Promedio: ${load} pts`;
        dayCell.appendChild(tooltipText);
      }
      if (highlightWeek === weekStart) {
        dayCell.classList.add("ring-2", "ring-offset-2", "ring-indigo-400", "ring-offset-gray-900");
      }
      calendarContainer.appendChild(dayCell);
    }
  }

  async function fetchAndDisplayWorkload(courseId) {
    if (!courseId) {
      calendarContainer.innerHTML = '<p class="text-gray-500 col-span-7 mt-4">Seleccione un curso para ver el calendario.</p>';
      feedbackBox.innerHTML = '<p class="text-gray-500">El análisis del impacto de su nueva tarea aparecerá aquí...</p>';
      studentCountInfo.textContent = "";
      originalWeeklyLoad = {};
      return;
    }
    currentCourseId = courseId;
    try {
      calendarContainer.innerHTML = '<p class="text-gray-500 col-span-7 mt-4">Analizando carga académica...</p>';
      const response = await fetch(`http://localhost:3001/api/courses/${courseId}/all-assignments`, { credentials: "include" });
      if (!response.ok) throw new Error("No se pudo obtener la carga de trabajo.");

      const assignments = await response.json();
      originalWeeklyLoad = calculateAverageWeeklyLoad(assignments);

      if (studentCount > 0) {
        studentCountInfo.textContent = `(Promedio basado en ${studentCount} alumnos)`;
      } else {
        studentCountInfo.textContent = "(Sin alumnos en este curso)";
      }

      renderCalendar(originalWeeklyLoad, currentDisplayDate);
      feedbackBox.innerHTML = '<p class="text-gray-400">Este es el panorama actual de la carga académica promedio, considerando todas las materias de los alumnos.</p>';
    } catch (error) {
      console.error("Error fetching workload:", error);
      feedbackBox.innerHTML = `<p class="text-red-400">${error.message}</p>`;
    }
  }

  function analyzeNewTask(event) {
    event.preventDefault();
    feedbackBox.innerHTML = "";
    const taskType = taskTypeInput.value;
    const taskDescription = taskDescriptionInput.value;
    const dueDate = taskDueDateInput.value;

    if (!dueDate || !currentCourseId) {
      feedbackBox.innerHTML = '<p class="text-yellow-400">Por favor, seleccione una fecha de entrega y un curso.</p>';
      return;
    }
    const taskPoints = getTaskPointsFromType(taskType);
    const weekStart = getStartOfWeek(dueDate);
    const simulatedLoad = JSON.parse(JSON.stringify(originalWeeklyLoad));
    if (!simulatedLoad[weekStart]) simulatedLoad[weekStart] = { base: 0 };
    const originalPointsInWeek = originalWeeklyLoad[weekStart]?.base || 0;
    simulatedLoad[weekStart].base += taskPoints;

    currentDisplayDate = new Date(dueDate + "T12:00:00Z");
    renderCalendar(simulatedLoad, currentDisplayDate, weekStart);

    const newTotal = simulatedLoad[weekStart].base;

    // --- New alert generation logic ---
    let alertTitle = "";
    let alertText = "";
    let alertClasses = {};

    const mainMessage = `La carga proyectada es de <strong>${newTotal} puntos</strong>,`;

    if (newTotal >= 45) {
      alertTitle = "CARGA CRÍTICA";
      alertText = `${mainMessage} un nivel que podría sobrecargar a los alumnos. <strong>Se recomienda fuertemente ajustar la fecha o el tipo de tarea.</strong>`;
      alertClasses = {
        bg: "bg-red-900/50",
        border: "border-red-700",
        text: "text-red-300",
      };
    } else if (newTotal >= 25) {
      alertTitle = "CARGA ELEVADA";
      alertText = `${mainMessage} un nivel manejable pero que requiere monitoreo. <strong>Considere notificar a los alumnos con anticipación.</strong>`;
      alertClasses = {
        bg: "bg-yellow-900/50",
        border: "border-yellow-700",
        text: "text-yellow-300",
      };
    } else {
      alertTitle = "CARGA ÓPTIMA";
      alertText = `${mainMessage} un nivel manejable y seguro para la asignación. <strong>Adelante. Es un buen momento para esta tarea.</strong>`;
      alertClasses = {
        bg: "bg-teal-900/50",
        border: "border-teal-700",
        text: "text-teal-300",
      };
    }

    const diagnosisHTML = `
            <div class="p-4 rounded-lg ${alertClasses.bg} border ${alertClasses.border}">
                <h4 class="font-bold mb-1 ${alertClasses.text}">${alertTitle}</h4>
                <p class="text-sm text-gray-300">${alertText}</p>
            </div>
        `;

    feedbackBox.innerHTML = diagnosisHTML;
  }

  // --- Event Listeners & Initialization ---
  courseSelect.addEventListener("change", () => fetchAndDisplayWorkload(courseSelect.value));
  analysisForm.addEventListener("submit", analyzeNewTask);
  prevMonthBtn.addEventListener("click", () => {
    currentDisplayDate.setUTCMonth(currentDisplayDate.getUTCMonth() - 1);
    renderCalendar(originalWeeklyLoad, currentDisplayDate);
  });
  nextMonthBtn.addEventListener("click", () => {
    currentDisplayDate.setUTCMonth(currentDisplayDate.getUTCMonth() + 1);
    renderCalendar(originalWeeklyLoad, currentDisplayDate);
  });

  loadTeacherCourses();
  renderCalendar({}, currentDisplayDate); // Initial empty render
});
