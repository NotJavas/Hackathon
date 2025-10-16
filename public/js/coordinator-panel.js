document.addEventListener('DOMContentLoaded', () => {
    const feedbackBox = document.getElementById('feedback-box');
    const groupFilter = document.getElementById('group-filter');
    const teacherFilter = document.getElementById('teacher-filter');
    const exportBtn = document.getElementById('export-btn');

    // Override the global academicLoad with data from localStorage
    function getSharedAcademicLoad() {
        const storedData = localStorage.getItem('academicLoad');
        if (storedData) {
            window.academicLoad = JSON.parse(storedData);
        }
    }

    function analyzeAndFeedback() {
        const selectedGroup = groupFilter.value;
        const selectedTeacher = teacherFilter.value;

        const criticalWeeks = Object.entries(window.academicLoad).filter(([week, data]) => data.base >= 45);

        let feedbackHTML = '';
        let bgColor = 'bg-gray-800';
        let borderColor = 'border-gray-700';

        if (criticalWeeks.length > 0) {
            bgColor = 'bg-red-900/50';
            borderColor = 'border-red-500';
            feedbackHTML = `
                <h4 class="font-bold text-red-400">PUNTOS CRÍTICOS DETECTADOS</h4>
                <p class="text-red-300 mt-1">Se han identificado <strong>${criticalWeeks.length} semana(s)</strong> con carga académica crítica.</p>
                <p class="text-gray-400 mt-2 text-sm"><strong>Sugerencia de Nexus:</strong> Coordinar con los profesores para re-calendarizar entregas en las semanas de mayor carga, como la del ${new Date(criticalWeeks[0][0]+'T00:00:00Z').toLocaleDateString('es-ES', {day:'numeric', month:'long', timeZone: 'UTC'})}.</p>`;
        } else {
            bgColor = 'bg-teal-900/50';
            borderColor = 'border-teal-500';
            feedbackHTML = `
                <h4 class="font-bold text-teal-400">CARGA ACADÉMICA BALANCEADA</h4>
                <p class="text-teal-300 mt-1">No se detectan semanas con carga académica crítica en el periodo analizado.</p>
                <p class="text-gray-400 mt-2 text-sm">El calendario actual parece sostenible. Buen trabajo de planificación.</p>`;
        }
        
        feedbackBox.innerHTML = feedbackHTML;
        feedbackBox.className = `p-4 rounded-lg min-h-[120px] transition-colors border ${bgColor} ${borderColor}`;
    }
    
    groupFilter.addEventListener('change', analyzeAndFeedback);
    teacherFilter.addEventListener('change', analyzeAndFeedback);
    exportBtn.addEventListener('click', () => {
        alert('Funcionalidad de exportar reporte no implementada en esta simulación.');
    });

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === 'academicLoad') {
            getSharedAcademicLoad();
            window.renderChart();
            analyzeAndFeedback();
        }
    });

    getSharedAcademicLoad();
    window.renderChart();
    analyzeAndFeedback();
});