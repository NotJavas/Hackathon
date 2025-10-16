document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const dueDateInput = document.getElementById('due-date');
    const chartContainer = document.getElementById('chart-container');
    const feedbackBox = document.getElementById('feedback-box');

    const MAX_LOAD = 60; // Max value for chart height

    // --- Initial State: Pre-existing academic load ---
    // Key: Start date of the week (Monday)
    let initialAcademicLoad = {
        '2025-10-27': { base: 20, tasks: ["Tarea de Cálculo (5)", "Lectura de Física (15)"] }, // Semana actual
        '2025-11-03': { base: 35, tasks: ["Ensayo Estructura de Datos (10)", "Examen Rápido Cálculo (10)", "Avance POO (15)"] },
        '2025-11-10': { base: 45, tasks: ["Entrega Parcial POO (15)", "Examen Parcial Cálculo (25)", "Tarea Física (5)"] },
        '2025-11-17': { base: 15, tasks: ["Tarea simple POO (5)", "Lecturas (10)"] },
        '2025-11-24': { base: 5, tasks: ["Tarea Física (5)"] },
        '2025-12-01': { base: 50, tasks: ["Proyecto Final Física (25)", "Proyecto Final POO (25)"] },
    };

    let academicLoad = {};

    // --- Shared Data Functions ---
    function getSharedAcademicLoad() {
        const storedData = localStorage.getItem('academicLoad');
        if (storedData) {
            return JSON.parse(storedData);
        }
        // If nothing is stored, initialize it with the default data
        localStorage.setItem('academicLoad', JSON.stringify(initialAcademicLoad));
        return initialAcademicLoad;
    }

    function setSharedAcademicLoad(data) {
        localStorage.setItem('academicLoad', JSON.stringify(data));
    }

    academicLoad = getSharedAcademicLoad();

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

    // --- Core Functions ---
    function renderChart(highlightWeek = null) {
        chartContainer.innerHTML = '';
        Object.keys(academicLoad).sort().forEach(weekStart => {
            const loadData = academicLoad[weekStart];
            const load = loadData.base;
            const heightPercentage = (load / MAX_LOAD) * 100;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'flex flex-col h-full items-center justify-end w-full tooltip';

            const tooltipText = document.createElement('span');
            tooltipText.className = 'tooltip-text';
            tooltipText.innerHTML = `<strong>Carga: ${load} pts</strong><br>${loadData.tasks.join('<br>')}`;

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

    function analyzeAndFeedback(weekStart, newLoadValue, taskName) {
        const existingLoad = academicLoad[weekStart] ? academicLoad[weekStart].base : 0;
        const newTotalLoad = existingLoad + newLoadValue;

        // Update feedback box
        let feedbackHTML = '';
        let bgColor = '';
        let borderColor = '';
        
        if (newTotalLoad >= 45) {
            bgColor = 'bg-red-900/50';
            borderColor = 'border-red-500';
            feedbackHTML = `
                <h4 class="font-bold text-red-400">ALERTA DE CARGA CRÍTICA</h4>
                <p class="text-red-300 mt-1">Asignar "${taskName}" en esta fecha elevará la carga semanal a <strong>${newTotalLoad} puntos</strong>, superando el umbral de riesgo de burnout.</p>
                <p class="text-gray-400 mt-2 text-sm"><strong>Sugerencia de Nexus:</strong> Considere mover la entrega a una semana con carga inferior a 30 puntos (ej. la semana del ${Object.keys(academicLoad).find(w => academicLoad[w].base < 30).split('-')[2]} de ${new Date(Object.keys(academicLoad).find(w => academicLoad[w].base < 30)+'T00:00:00Z').toLocaleString('es-MX', {month: 'long', timeZone:'UTC'})}).</p>`;
        } else if (newTotalLoad >= 30) {
            bgColor = 'bg-yellow-900/50';
            borderColor = 'border-yellow-500';
            feedbackHTML = `
                <h4 class="font-bold text-yellow-400">ADVERTENCIA: CARGA ELEVADA</h4>
                <p class="text-yellow-300 mt-1">La carga semanal alcanzará <strong>${newTotalLoad} puntos</strong>. Los estudiantes podrían experimentar altos niveles de estrés.</p>
                <p class="text-gray-400 mt-2 text-sm">Es posible asignar, pero se recomienda monitorear el progreso del grupo.</p>`;
        } else {
            bgColor = 'bg-teal-900/50';
            borderColor = 'border-teal-500';
            feedbackHTML = `
                <h4 class="font-bold text-teal-400">CARGA ÓPTIMA</h4>
                <p class="text-teal-300 mt-1">La carga proyectada es de <strong>${newTotalLoad} puntos</strong>, un nivel manejable y seguro para la asignación.</p>
                <p class="text-gray-400 mt-2 text-sm">Adelante. Es un buen momento para esta tarea.</p>`;
        }

        feedbackBox.innerHTML = feedbackHTML;
        feedbackBox.className = `p-4 rounded-lg min-h-[120px] transition-colors border ${bgColor} ${borderColor}`;

        // Permanently update data and chart
        if(academicLoad[weekStart]) {
            academicLoad[weekStart].base = newTotalLoad;
            academicLoad[weekStart].tasks.push(`${taskName} (${newLoadValue})`);
        } else {
            academicLoad[weekStart] = { base: newTotalLoad, tasks: [`${taskName} (${newLoadValue})`] };
        }

        // Save the new state
        setSharedAcademicLoad(academicLoad);

        // Re-render the chart with the new permanent data
        renderChart(weekStart);
        alert('¡Tarea asignada con éxito! La carga académica ha sido actualizada para todos los perfiles.');
    }

    // --- Event Listeners ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskType = document.getElementById('task-type');
        const taskName = document.getElementById('task-name').value;
        const newLoadValue = parseInt(taskType.value, 10);
        const dueDate = dueDateInput.value;

        if (!dueDate) {
            feedbackBox.innerHTML = `<p class="text-yellow-400">Por favor, selecciona una fecha de entrega para continuar.</p>`;
            feedbackBox.className = 'p-4 rounded-lg min-h-[120px] transition-colors border bg-yellow-900/50 border-yellow-500';
            return;
        }

        const weekStart = getStartOfWeek(dueDate);
        analyzeAndFeedback(weekStart, newLoadValue, taskName);
    });

    // Set default date to a relevant one for the demo
    dueDateInput.value = '2025-11-12';
    
    // --- Initial Render ---
    renderChart();
});