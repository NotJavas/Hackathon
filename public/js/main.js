document.addEventListener('DOMContentLoaded', () => {
    const MAX_LOAD = 60;

    // --- Initial State: Pre-existing academic load ---
    const initialAcademicLoad = {
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
            // Compatibility check: ensure tasks are objects
            Object.keys(data).forEach(week => {
                if (data[week].tasks.length > 0 && typeof data[week].tasks[0] === 'string') {
                    data[week].tasks = data[week].tasks.map(taskText => ({ text: taskText, completed: false }));
                }
            });
            return data;
        }
        // If nothing is stored, initialize it with the default data
        localStorage.setItem('academicLoad', JSON.stringify(initialAcademicLoad));
        return initialAcademicLoad;
    }

    function setSharedAcademicLoad(data) {
        localStorage.setItem('academicLoad', JSON.stringify(data));
    }

    function getStartOfWeek(date) {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone shifts
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setUTCDate(diff)).toISOString().split('T')[0];
    }

    function getLoadColor(load) {
        if (load >= 45) return 'bg-red-500';
        if (load >= 30) return 'bg-yellow-500';
        return 'bg-teal-500';
    }

    function renderChart(highlightWeek = null) {
        const chartContainer = document.getElementById('chart-container');
        if (!chartContainer) return; // Don't run if chart container doesn't exist
        const academicLoad = getSharedAcademicLoad();
        chartContainer.innerHTML = '';
        Object.keys(academicLoad).sort().forEach(weekStart => {
            const loadData = academicLoad[weekStart];
            const load = loadData.base;
            const heightPercentage = (load / MAX_LOAD) * 100;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'flex flex-col h-full items-center justify-end w-full tooltip';

            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            const taskDetails = loadData.tasks.map(task => {
                // Check if task is an object with a 'text' property
                return typeof task === 'object' && task.text ? task.text : task;
            }).join('<br>');
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

    // Expose functions and data to the global scope to be used by other scripts
    window.Nexus = {
        getSharedAcademicLoad,
        setSharedAcademicLoad,
        getStartOfWeek,
        renderChart,
        MAX_LOAD
    };
});