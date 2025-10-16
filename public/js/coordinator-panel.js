document.addEventListener('DOMContentLoaded', () => {
    const feedbackBox = document.getElementById('feedback-box');
    const resetButton = document.getElementById('reset-btn');

    function initializeCoordinatorPanel() {
        const academicLoad = getSharedAcademicLoad();
        renderChart(academicLoad);

        feedbackBox.innerHTML = `
            <h4 class="font-bold text-teal-400">Vista General</h4>
            <p class="text-teal-300 mt-1">El gráfico muestra la carga académica consolidada de todos los grupos.</p>
            <p class="text-gray-400 mt-2 text-sm">Utilice los filtros para desglosar por grupo o profesor y detectar posibles cuellos de botella.</p>`;
        feedbackBox.className = 'p-4 rounded-lg min-h-[120px] transition-colors border bg-teal-900/50 border-teal-500';
    }

    resetButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres borrar todos los datos de la simulación? Esta acción no se puede deshacer.')) {
            // Borra los datos del localStorage
            localStorage.removeItem('academicLoad');
            // Dispara el evento para que todas las pestañas (incluida esta) se actualicen
            window.dispatchEvent(new Event('storage'));
            alert('La simulación ha sido reiniciada.');
        }
    });

    window.addEventListener('storage', () => initializeCoordinatorPanel());

    initializeCoordinatorPanel();
});