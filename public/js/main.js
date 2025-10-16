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

// --- State for Calendar Navigation ---
let currentDisplayDate = new Date('2025-11-01T12:00:00Z');

// --- Core Calendar Rendering Function ---
function renderCalendar(academicLoad, targetDate, highlightWeek = null) {
    const chartContainer = document.getElementById('chart-container');
    const calendarTitle = document.getElementById('calendar-title');
    if (!chartContainer) return;

    // Update title
    if(calendarTitle) {
        calendarTitle.textContent = targetDate.toLocaleString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, c => c.toUpperCase());
    }

    chartContainer.innerHTML = '';
    chartContainer.className = 'w-full bg-gray-900/50 p-4 rounded-lg grid grid-cols-7 gap-1 text-center text-xs';

    // Add day headers
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'font-bold text-gray-400';
        dayHeader.textContent = day;
        chartContainer.appendChild(dayHeader);
    });

    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
    
    // Day of week (0=Sun, 1=Mon, ...). Adjust to make Monday the start.
    let startingDay = firstDayOfMonth.getUTCDay();
    if (startingDay === 0) startingDay = 7; // Sunday is 7
    startingDay -= 1; // Monday is 0

    // Add blank days for the first week
    for (let i = 0; i < startingDay; i++) {
        chartContainer.appendChild(document.createElement('div'));
    }

    // Add days of the month
    for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
        const dayCell = document.createElement('div');
        const currentDate = new Date(Date.UTC(year, month, i));
        const weekStart = getStartOfWeek(currentDate);
        const weekData = academicLoad[weekStart];

        dayCell.className = 'h-12 flex items-center justify-center rounded-md bg-gray-800/50 border border-transparent tooltip';
        dayCell.textContent = i;

        if (weekData) {
            const load = weekData.base;
            dayCell.classList.add(getLoadColor(load));
            dayCell.classList.remove('bg-gray-800/50');

            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            const taskDetails = weekData.tasks.map(task => task.text).join('<br>');
            tooltipText.innerHTML = `<strong>Semana del ${getWeekLabel(weekStart)}</strong><br>Carga: ${load} pts<br>${taskDetails || 'Sin tareas detalladas.'}`;
            dayCell.appendChild(tooltipText);
        }

        if (highlightWeek === weekStart) {
            dayCell.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-400', 'ring-offset-gray-900/50');
        }

        chartContainer.appendChild(dayCell);
    }
}

function setupCalendarNavigation() {
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDisplayDate.setUTCMonth(currentDisplayDate.getUTCMonth() - 1);
            renderCalendar(getSharedAcademicLoad(), currentDisplayDate);
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDisplayDate.setUTCMonth(currentDisplayDate.getUTCMonth() + 1);
            renderCalendar(getSharedAcademicLoad(), currentDisplayDate);
        });
    }
}