const MAX_LOAD = 60; // Max value for chart height

// --- Initial State: Pre-existing academic load ---
// Se inicia vacío para una demostración limpia.
const initialAcademicLoad = {};

// --- Shared Data Functions ---
function getSharedAcademicLoad() {
    const storedData = localStorage.getItem('academicLoad');
    if (storedData) {
        let data = JSON.parse(storedData);
        // Ensure tasks are objects, not strings, for compatibility
        Object.keys(data).forEach(week => {
            if (data[week].tasks.length > 0 && typeof data[week].tasks[0] === 'string') {
                data[week].tasks = data[week].tasks.map(taskText => ({ text: taskText, completed: false }));
            }
        });
        return data;
    }
    // If nothing is stored, initialize it with the student-compatible format
    localStorage.setItem('academicLoad', JSON.stringify(initialAcademicLoad));
    return initialAcademicLoad;
}

function setSharedAcademicLoad(data) {
    localStorage.setItem('academicLoad', JSON.stringify(data));
    // Dispara un evento de storage para que otras pestañas se actualicen
    window.dispatchEvent(new Event('storage'));
}

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
    if (load >= 45) return 'bg-red-500'; // Critical
    if (load >= 30) return 'bg-yellow-500'; // Elevated
    return 'bg-teal-500'; // Optimal
}

function getLoadColorDetails(load) {
    if (load >= 45) return { text: 'text-red-300', bg: 'bg-red-900/50', border: 'border-red-700' }; // Critical
    if (load >= 30) return { text: 'text-yellow-300', bg: 'bg-yellow-900/50', border: 'border-yellow-700' }; // Elevated
    return { text: 'text-teal-300', bg: 'bg-teal-900/50', border: 'border-teal-700' }; // Optimal
}

// --- Core Chart Rendering Function ---
function renderChart(academicLoad, highlightWeek = null) {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';
    Object.keys(academicLoad).sort().forEach(weekStart => {
        const loadData = academicLoad[weekStart];
        const load = loadData.base;
        const heightPercentage = (load / MAX_LOAD) * 100;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'flex flex-col h-full items-center justify-end w-full tooltip';

        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltip-text';
        // Mapea los objetos de tarea a texto para el tooltip
        const taskDetails = loadData.tasks.map(task => task.text).join('<br>');
        tooltipText.innerHTML = `<strong>Carga: ${load} pts</strong><br>${taskDetails}`;

        const bar = document.createElement('div');
        bar.className = `chart-bar w-10/12 md:w-8/12 rounded-t-md ${getLoadColor(load)}`;
        bar.style.height = `${heightPercentage}%`;
        
        if(highlightWeek === weekStart) {
             bar.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-400', 'ring-offset-gray-900/50');
        }

        const label = document.createElement('p');
        label.className = 'text-xs text-center mt-2 text-gray-400';
        const date = new Date(weekStart + 'T00:00:00Z');
        label.textContent = `${date.getUTCDate()} ${date.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' })}`;

        barContainer.appendChild(tooltipText);
        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        chartContainer.appendChild(barContainer);
    });
}