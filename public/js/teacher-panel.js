document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const dueDateInput = document.getElementById('due-date');
    const feedbackBox = document.getElementById('feedback-box');

    function analyzeAndFeedback(weekStart, newLoadValue, taskName) {
        const academicLoad = window.Nexus.getSharedAcademicLoad();
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
                <p class="text-gray-400 mt-2 text-sm"><strong>Sugerencia de Nexus:</strong> Considere mover la entrega a una semana con carga inferior a 30 puntos.</p>`;
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
            academicLoad[weekStart].tasks.push({ text: `${taskName} (${newLoadValue})`, completed: false });
        } else {
            academicLoad[weekStart] = { base: newTotalLoad, tasks: [{ text: `${taskName} (${newLoadValue})`, completed: false }] };
        }

        // Save the new state
        window.Nexus.setSharedAcademicLoad(academicLoad);

        // Re-render the chart with the new permanent data
        window.Nexus.renderChart(weekStart);
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

        const weekStart = window.Nexus.getStartOfWeek(dueDate);
        analyzeAndFeedback(weekStart, newLoadValue, taskName);
    });

    // Set default date to a relevant one for the demo
    dueDateInput.value = '2025-11-12';
    
    // --- Initial Render ---
    window.Nexus.renderChart();
});