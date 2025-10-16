document.addEventListener('DOMContentLoaded', () => {
    const weeksListContainer = document.getElementById('weeks-list');
    const tasksListContainer = document.getElementById('tasks-list');
    const tasksViewTitle = document.querySelector('#tasks-view h2');
    
    const MAX_LOAD = 60; // Max value for chart height

    // --- Initial State: Pre-existing academic load ---
    // Key: Start date of the week (Monday)
    let initialAcademicLoad = {
        '2025-10-27': { base: 20, tasks: [{text: "Tarea de Cálculo (5)", completed: false}, {text: "Lectura de Física (15)", completed: false}] },
        '2025-11-03': { base: 35, tasks: [{text: "Ensayo Estructura de Datos (10)", completed: false}, {text: "Examen Rápido Cálculo (10)", completed: false}, {text: "Avance POO (15)", completed: false}] },
        '2025-11-10': { base: 45, tasks: [{text: "Entrega Parcial POO (15)", completed: false}, {text: "Examen Parcial Cálculo (25)", completed: false}, {text: "Tarea Física (5)", completed: false}] },
        '2025-11-17': { base: 15, tasks: [{text: "Tarea simple POO (5)", completed: false}, {text: "Lecturas (10)", completed: false}] },
        '2025-11-24': { base: 5, tasks: [{text: "Tarea Física (5)", completed: false}] },
        '2025-12-01': { base: 50, tasks: [{text: "Proyecto Final Física (25)", completed: false}, {text: "Proyecto Final POO (25)", completed: false}] },
    };

    // --- Shared Data Functions ---
    function getSharedAcademicLoad() {
        const storedData = localStorage.getItem('academicLoad');
        if (storedData) {
            let data = JSON.parse(storedData);
            // Convert task strings to objects if needed (for backward compatibility)
            Object.keys(data).forEach(week => {
                if (data[week].tasks.length > 0 && typeof data[week].tasks[0] === 'string') {
                    data[week].tasks = data[week].tasks.map(taskText => ({ text: taskText, completed: false }));
                }
            });
            return data;
        }
        localStorage.setItem('academicLoad', JSON.stringify(initialAcademicLoad));
        return initialAcademicLoad;
    }

    function setSharedAcademicLoad(data) {
        localStorage.setItem('academicLoad', JSON.stringify(data));
    }

    let academicLoad = getSharedAcademicLoad();


    // --- Utility Functions ---
    function getStartOfWeek(date) {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone shifts
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setUTCDate(diff)).toISOString().split('T')[0];
    }

    function getWeekLabel(startDate) {
        const start = new Date(startDate + 'T00:00:00Z');
        const end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 6);
        const startDay = start.getUTCDate();
        const startMonth = start.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
        const endDay = end.getUTCDate();
        const endMonth = end.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }

    function getLoadColor(load) {
        if (load >= 45) return { text: 'text-red-300', bg: 'bg-red-900/50', border: 'border-red-700' }; // Critical
        if (load >= 30) return { text: 'text-yellow-300', bg: 'bg-yellow-900/50', border: 'border-yellow-700' }; // Elevated
        return { text: 'text-teal-300', bg: 'bg-teal-900/50', border: 'border-teal-700' }; // Optimal
    }

    function renderTasks(weekStart) {
        const weekData = academicLoad[weekStart];
        const weekLabel = getWeekLabel(weekStart);
        tasksViewTitle.textContent = `Tareas para la semana del ${weekLabel}`;
        tasksListContainer.innerHTML = '';

        if (weekData && weekData.tasks.length > 0) {
            weekData.tasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.className = `flex items-center justify-between bg-gray-900/50 p-3 rounded-md border border-gray-700 transition-all ${task.completed ? 'opacity-50' : ''}`;
                
                const label = document.createElement('label');
                label.className = 'flex items-center gap-3 cursor-pointer';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.className = 'h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500';
                checkbox.onchange = () => {
                    academicLoad[weekStart].tasks[index].completed = checkbox.checked;
                    setSharedAcademicLoad(academicLoad);
                    renderTasks(weekStart); // Re-render to apply styles
                };

                const span = document.createElement('span');
                span.className = `text-gray-300 ${task.completed ? 'line-through' : ''}`;
                span.textContent = task.text;

                label.append(checkbox, span);
                li.appendChild(label);
                tasksListContainer.appendChild(li);
            });
        } else {
            tasksListContainer.innerHTML = `<li class="text-gray-500">No hay tareas asignadas para esta semana.</li>`;
        }
    }

    function renderWeeksList() {
        weeksListContainer.innerHTML = '';
        Object.keys(academicLoad).sort().forEach(weekStart => {
            const weekData = academicLoad[weekStart];
            const colors = getLoadColor(weekData.base);
            const weekLabel = getWeekLabel(weekStart);

            const weekElement = document.createElement('div');
            weekElement.className = `p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-700 ${colors.bg} ${colors.border}`;
            weekElement.dataset.week = weekStart;
            weekElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-semibold ${colors.text}">${weekLabel}</span>
                    <span class="text-xs font-mono px-2 py-1 rounded ${colors.bg} ${colors.text}">${weekData.base} pts</span>
                </div>
            `;

            weekElement.addEventListener('click', () => {
                document.querySelectorAll('#weeks-list > div').forEach(el => el.classList.remove('ring-2', 'ring-indigo-400'));
                weekElement.classList.add('ring-2', 'ring-indigo-400');
                renderTasks(weekStart);
            });

            weeksListContainer.appendChild(weekElement);
        });
    }
    
    // --- Initial Render ---
    // Listen for changes from other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === 'academicLoad') {
            academicLoad = getSharedAcademicLoad();
            renderWeeksList();
        }
    });
    renderWeeksList();
    // Opcional: Cargar las tareas de la primera semana por defecto
    const firstWeek = Object.keys(academicLoad).sort()[0];
    if (firstWeek) {
        renderTasks(firstWeek);
        document.querySelector(`[data-week="${firstWeek}"]`).classList.add('ring-2', 'ring-indigo-400');
    }
});