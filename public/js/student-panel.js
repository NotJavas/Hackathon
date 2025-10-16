document.addEventListener("DOMContentLoaded", async () => {
  const weeksListContainer = document.getElementById("weeks-list");
  const tasksListContainer = document.getElementById("tasks-list");
  const tasksViewTitle = document.querySelector("#tasks-view h2");

  // --- Utility Functions ---
  function getStartOfWeek(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone shifts
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setUTCDate(diff)).toISOString().split("T")[0];
  }

  function getWeekLabel(startDate) {
    const start = new Date(startDate + "T00:00:00Z");
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const options = { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
    const startStr = start.toLocaleDateString("es-MX", options);
    const endStr = end.toLocaleDateString("es-MX", options);

    return `${startStr} - ${endStr}`;
  }

  function getLoadColor(load) {
    if (load >= 45) return { text: "text-red-300", bg: "bg-red-900/50", border: "border-red-700" }; // Critical
    if (load >= 25) return { text: "text-yellow-300", bg: "bg-yellow-900/50", border: "border-yellow-700" }; // Elevated
    return { text: "text-teal-300", bg: "bg-teal-900/50", border: "border-teal-700" }; // Optimal
  }

  async function fetchAndProcessAssignments() {
    try {
      const response = await fetch("http://localhost:3001/api/assignments", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }
      const assignments = await response.json();

      const academicLoad = {};
      const today = new Date();
      const startOfCurrentWeek = getStartOfWeek(today);

      assignments.forEach((assignment) => {
        if (!assignment.dueDate) return;
        // dueDate is in "DD/MM/YYYY" format, convert to "YYYY-MM-DD"
        const parts = assignment.dueDate.split("/");
        const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const weekStart = getStartOfWeek(isoDate);

        if (weekStart >= startOfCurrentWeek) {
          if (!academicLoad[weekStart]) {
            academicLoad[weekStart] = { base: 0, tasks: [] };
          }

          const points = getTaskPoints(assignment.name);
          academicLoad[weekStart].base += points;

          academicLoad[weekStart].tasks.push({
            text: `${assignment.name} (${assignment.courseName})`,
            completed: assignment.completed || false,
            points: points,
          });
        }
      });

      return academicLoad;
    } catch (error) {
      console.error("Error fetching assignments:", error);
      weeksListContainer.innerHTML = '<p class="text-red-400">Error al cargar las tareas.</p>';
      return {};
    }
  }

  function renderTasks(weekStart, academicLoad) {
    const weekData = academicLoad[weekStart];
    const weekLabel = getWeekLabel(weekStart);
    tasksViewTitle.textContent = `Tareas para la semana del ${weekLabel}`;
    tasksListContainer.innerHTML = "";

    if (weekData && weekData.tasks.length > 0) {
      weekData.tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.className = `flex items-center justify-between bg-gray-900/50 p-3 rounded-md border border-gray-700 transition-all ${task.completed ? "opacity-50" : ""}`;

        const label = document.createElement("label");
        label.className = "flex items-center gap-3 cursor-pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.className = "h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500";
        checkbox.onchange = () => {
          academicLoad[weekStart].tasks[index].completed = checkbox.checked;
          // Re-render to apply styles, no need to save to local storage anymore
          renderTasks(weekStart, academicLoad);
        };

        const span = document.createElement("span");
        span.className = `text-gray-300 ${task.completed ? "line-through" : ""}`;
        span.textContent = task.text;

        const pointsSpan = document.createElement("span");
        pointsSpan.className = "text-xs font-mono px-2 py-1 rounded bg-gray-700 text-gray-300";
        pointsSpan.textContent = `${task.points} pts`;

        label.append(checkbox, span);
        li.append(label, pointsSpan);
        tasksListContainer.appendChild(li);
      });
    } else {
      tasksListContainer.innerHTML = `<li class="text-gray-500">No hay tareas asignadas para esta semana.</li>`;
    }
  }

  function renderWeeksList(academicLoad) {
    weeksListContainer.innerHTML = "";
    Object.keys(academicLoad)
      .sort()
      .forEach((weekStart) => {
        const weekData = academicLoad[weekStart];
        const colors = getLoadColor(weekData.base);
        const weekLabel = getWeekLabel(weekStart);

        const weekElement = document.createElement("div");
        weekElement.className = `p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-700 ${colors.bg} ${colors.border}`;
        weekElement.dataset.week = weekStart;
        weekElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold ${colors.text}">${weekLabel}</span>
                    <span class="text-xs font-mono px-2 py-1 rounded ${colors.bg} ${colors.text}">${weekData.base} pts</span>
                </div>
            `;

        weekElement.addEventListener("click", () => {
          document.querySelectorAll("#weeks-list > div").forEach((el) => el.classList.remove("ring-2", "ring-indigo-400"));
          weekElement.classList.add("ring-2", "ring-indigo-400");
          renderTasks(weekStart, academicLoad);
        });

        weeksListContainer.appendChild(weekElement);
      });
  }

  async function initialize() {
    const academicLoad = await fetchAndProcessAssignments();
    renderWeeksList(academicLoad);

    const firstWeek = Object.keys(academicLoad).sort()[0];
    if (firstWeek) {
      renderTasks(firstWeek, academicLoad);
      const firstWeekElement = document.querySelector(`[data-week="${firstWeek}"]`);
      if (firstWeekElement) {
        firstWeekElement.classList.add("ring-2", "ring-indigo-400");
      }
    } else {
      tasksViewTitle.textContent = "No hay tareas próximas";
      tasksListContainer.innerHTML = '<li class="text-gray-500">Parece que no tienes tareas en el horizonte. ¡Buen trabajo!</li>';
    }
  }

  initialize();
});
