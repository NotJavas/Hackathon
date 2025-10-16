/**
 * Calculates the point value of a task based on its title.
 *
 * @param {string} title The title of the task.
 * @returns {number} The point value of the task.
 */
function getTaskPoints(title) {
  if (!title) {
    return 8; // Default for tasks without a title
  }

  const lowerCaseTitle = title.toLowerCase();

  if (lowerCaseTitle.includes("examen")) {
    return 25;
  } else if (lowerCaseTitle.includes("proyecto")) {
    return 20;
  } else if (lowerCaseTitle.includes("tarea")) {
    return 10;
  } else {
    return 8; // Default for other tasks
  }
}
