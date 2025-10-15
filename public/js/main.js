document.addEventListener('DOMContentLoaded', () => {
    const chartContainer = document.getElementById('chart-container');
    const feedbackBox = document.getElementById('feedback-box');
    const MAX_LOAD = 60;

    let academicLoad = {
        '2025-10-27': { base: 20, tasks: ["Tareas y lecturas varias"] },
        '2025-11-03': { base: 35, tasks: ["Ensayos y exámenes rápidos"] },
        '2025-11-10': { base: 45, tasks: ["Entregas parciales y exámenes"] },
        '2025-11-17': { base: 15, tasks: ["Tareas simples y lecturas"] },
        '2025-11-24': { base: 5, tasks: ["Tareas menores"] },
        '2025-12-01': { base: 50, tasks: ["Proyectos Finales"] },
    };

    function getLoadColor(load) {
        if (load >= 45) return 'bg-red-500';
        if (load >= 30) return 'bg-yellow-500';
        return 'bg-teal-500';
    }

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
            tooltipText.innerHTML = `<strong>Carga Promedio: ${load} pts</strong><br>${loadData.tasks.join('<br>')}`;

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

    window.academicLoad = academicLoad;
    window.renderChart = renderChart;
    window.getLoadColor = getLoadColor;
    window.MAX_LOAD = MAX_LOAD;
});