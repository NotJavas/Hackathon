import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { google } from "googleapis";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
let db;
(async () => {
  db = await open({ filename: "./database.db", driver: sqlite3.Database });
  console.log("Conectado a la base de datos SQLite.");
  await db.exec(`
        CREATE TABLE IF NOT EXISTS Usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, google_id TEXT UNIQUE NOT NULL, nombre TEXT, email TEXT UNIQUE, rol TEXT, refresh_token TEXT);
        CREATE TABLE IF NOT EXISTS Cursos (id INTEGER PRIMARY KEY AUTOINCREMENT, google_course_id TEXT UNIQUE NOT NULL, nombre_curso TEXT);
        CREATE TABLE IF NOT EXISTS Inscripciones (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, curso_id INTEGER NOT NULL, FOREIGN KEY(usuario_id) REFERENCES Usuarios(id), FOREIGN KEY(curso_id) REFERENCES Cursos(id), UNIQUE(usuario_id, curso_id));
    CREATE TABLE IF NOT EXISTS Tareas (id INTEGER PRIMARY KEY AUTOINCREMENT, google_coursework_id TEXT UNIQUE NOT NULL, curso_id INTEGER NOT NULL, titulo TEXT, fecha_entrega TEXT, FOREIGN KEY(curso_id) REFERENCES Cursos(id));
    -- Estado de entrega por estudiante y tarea
    CREATE TABLE IF NOT EXISTS Entregas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      tarea_id INTEGER NOT NULL,
      estado TEXT, -- valores de Google Classroom: NEW, CREATED, TURNED_IN, RETURNED, etc.
      actualizado_en TEXT,
      FOREIGN KEY(usuario_id) REFERENCES Usuarios(id),
      FOREIGN KEY(tarea_id) REFERENCES Tareas(id),
      UNIQUE(usuario_id, tarea_id)
    );
    `);
})();

const app = express();
const port = process.env.PORT || 3001;
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(cookieParser());
app.use(express.json());

// --- Configuración de Google OAuth ---
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${port}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
];

// --- Endpoints de la Aplicación ---

/**
 * @route GET /auth/initiate
 * @description Inicia el flujo de autenticación OAuth de Google redirigiendo al usuario a la página de consentimiento.
 * @returns {void} Redirección 302 a la URL de autenticación de Google.
 */
app.get("/auth/initiate", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES, prompt: "consent" });
  res.redirect(authUrl);
});

/**
 * @route GET /oauth2callback
 * @description Callback de Google OAuth. Recibe el código de autorización, lo intercambia por tokens,
 * guarda/actualiza al usuario en la base de datos, determina su rol y establece una cookie de sesión.
 * @returns {void} Redirección 302 a la URL del frontend.
 */
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing code");
  try {
    //adding debug statements
    console.log("Received OAuth2 callback with code:", code);
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("Tokens:", tokens);
    const classroom = google.classroom({ version: "v1", auth: oauth2Client });
    const profileResp = await classroom.userProfiles.get({ userId: "me" });
    const profile = profileResp.data;
    if (!profile || !profile.id) throw new Error("No se pudo obtener el perfil de usuario de Google.");
    let user = await db.get("SELECT * FROM Usuarios WHERE google_id = ?", profile.id);
    if (user) {
      console.log("Usuario existente:", user);
      if (tokens.refresh_token) {
        await db.run("UPDATE Usuarios SET refresh_token = ? WHERE id = ?", tokens.refresh_token, user.id);
      }
    } else {
      // Nuevo usuario: determinar rol (teacher/student)
      console.log("Usuario nuevo:", profile);
      let role = "student";
      try {
        const teacherCoursesResp = await classroom.courses.list({ teacherId: "me", pageSize: 1 });
        if (teacherCoursesResp.data.courses && teacherCoursesResp.data.courses.length > 0) {
          role = "teacher";
        }
      } catch (e) {
        // Si falla la llamada a teacherId, asumimos que es un estudiante
        role = "student";
      }
      console.log("Determinado rol:", role);

      const result = await db.run(
        "INSERT INTO Usuarios (google_id, nombre, email, rol, refresh_token) VALUES (?, ?, ?, ?, ?)",
        profile.id,
        profile.name?.fullName,
        profile.emailAddress,
        role,
        tokens.refresh_token
      );
      user = await db.get("SELECT * FROM Usuarios WHERE id = ?", result.lastID);
    }
    res.cookie("session_id", user.id, { httpOnly: true, sameSite: "lax" });
    res.redirect(process.env.APP_URL || "http://localhost:5173");
  } catch (err) {
    console.error("OAuth callback error", err);
    res.status(500).send("OAuth failed");
  }
});

// --- Middleware de Autenticación ---
const authMiddleware = async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.status(401).json({ error: "No autenticado" });
  const user = await db.get("SELECT * FROM Usuarios WHERE id = ?", sessionId);
  if (!user || !user.refresh_token) return res.status(401).json({ error: "Sesión inválida." });
  const userAuthClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  userAuthClient.setCredentials({ refresh_token: user.refresh_token });
  req.authClient = userAuthClient;
  req.user = user;
  next();
};

/**
 * @route GET /auth/status
 * @description Verifica si el usuario tiene una sesión activa y válida. Protegido por middleware.
 * @returns {object} 200 - JSON con estado de autenticación.
 * @returns {object} 401 - Error si no está autenticado.
 * @example { "authenticated": true }
 */
app.get("/auth/status", authMiddleware, (req, res) => res.json({ authenticated: true }));

/**
 * @route POST /auth/signout
 * @description Cierra la sesión del usuario limpiando la cookie de sesión.
 * @returns {object} 200 - JSON confirmando el cierre de sesión.
 * @example { "ok": true }
 */
app.post("/auth/signout", (req, res) => {
  res.clearCookie("session_id");
  res.json({ ok: true });
});

/**
 * @route GET /api/me
 * @description Obtiene el perfil básico (nombre y rol) del usuario actualmente logueado.
 * @returns {object} 200 - Perfil del usuario.
 * @returns {object} 401 - Error si no está autenticado.
 * @example { "name": "Profesor Alan", "role": "teacher" }
 */
app.get("/api/me", authMiddleware, (req, res) => res.json({ name: req.user.nombre, role: req.user.rol }));

/**
 * @route GET /api/sync/student
 * @description Sincroniza los datos de Classroom para el alumno logueado y los guarda/actualiza en la base de datos.
 * @returns {object} 200 - El JSON "crudo" de datos que se obtuvo de Google y se usó para la sincronización.
 * @returns {object} 401 - Error si no está autenticado.
 * @returns {object} 500 - Error si falla la sincronización con Google o la DB.
 */
app.get("/api/sync/student", authMiddleware, async (req, res) => {
  try {
    console.log(`Sincronizando datos para el alumno: ${req.user.nombre}`);
    const classroom = google.classroom({ version: "v1", auth: req.authClient });

    const profileResp = await classroom.userProfiles.get({ userId: "me" });
    const coursesResp = await classroom.courses.list({ studentId: "me" });

    const syncData = {
      profile: {
        id: profileResp.data.id || null,
        name: profileResp.data.name?.fullName || "",
        emailAddress: profileResp.data.emailAddress || "",
      },
      role: "student",
      enrolledCourses: [],
    };

    if (coursesResp.data.courses && coursesResp.data.courses.length > 0) {
      for (const course of coursesResp.data.courses) {
        const courseId = course.id;
        const assignmentsResp = await classroom.courses.courseWork.list({ courseId });
        const courseWorkList = assignmentsResp.data.courseWork || [];

        // Obtener submissions del alumno para todas las tareas del curso en una sola llamada
        const submissionsResp = await classroom.courses.courseWork.studentSubmissions.list({
          courseId,
          courseWorkId: "-",
          userId: "me",
        });
        const submissions = submissionsResp.data.studentSubmissions || [];
        const submissionByCourseworkId = new Map(submissions.filter((s) => s.courseWorkId).map((s) => [s.courseWorkId, s]));

        const formattedAssignments = courseWorkList.map((cw) => {
          const d = cw.dueDate;
          const dueDate = d && d.day && d.month && d.year ? `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}` : null;
          const sub = submissionByCourseworkId.get(cw.id || "");
          const estado = sub?.state || null; // e.g., NEW, TURNED_IN, RETURNED
          return {
            id: cw.id || null,
            name: cw.title || "",
            dueDate: dueDate,
            status: estado,
            completed: estado === "TURNED_IN" || estado === "RETURNED",
          };
        });

        syncData.enrolledCourses.push({
          id: course.id || null,
          name: course.name || "",
          assignments: formattedAssignments,
        });
      }
    }

    // --- INICIO: Lógica para poblar la Base de Datos ---
    await db.exec("BEGIN TRANSACTION");
    try {
      const userId = req.user.id; // Obtenemos el ID del usuario de la sesión

      for (const course of syncData.enrolledCourses) {
        // 1. Insertar curso si no existe
        await db.run("INSERT OR IGNORE INTO Cursos (google_course_id, nombre_curso) VALUES (?, ?)", course.id, course.name);

        // 2. Obtener el ID interno del curso
        const cursoDb = await db.get("SELECT id FROM Cursos WHERE google_course_id = ?", course.id);
        if (!cursoDb) {
          console.error(`Error: No se pudo encontrar/crear el curso con google_id ${course.id}`);
          continue;
        }
        const cursoId = cursoDb.id;

        // 3. Insertar la inscripción (relación usuario-curso) si no existe
        await db.run("INSERT OR IGNORE INTO Inscripciones (usuario_id, curso_id) VALUES (?, ?)", userId, cursoId);

        // 4. Insertar cada tarea del curso si no existe y guardar estado de entrega del alumno
        for (const assignment of course.assignments) {
          await db.run("INSERT OR IGNORE INTO Tareas (google_coursework_id, curso_id, titulo, fecha_entrega) VALUES (?, ?, ?, ?)", assignment.id, cursoId, assignment.name, assignment.dueDate);
          // Obtener ID interno de la tarea
          const tareaDb = await db.get("SELECT id FROM Tareas WHERE google_coursework_id = ?", assignment.id);
          if (tareaDb) {
            // Insertar o actualizar el estado de Entrega para el alumno actual
            await db.run(
              "INSERT INTO Entregas (usuario_id, tarea_id, estado, actualizado_en) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(usuario_id, tarea_id) DO UPDATE SET estado=excluded.estado, actualizado_en=datetime('now')",
              userId,
              tareaDb.id,
              assignment.status || null
            );
          }
        }
      }
      await db.exec("COMMIT");
      console.log(`Base de datos actualizada para el ALUMNO: ${req.user.nombre}`);
    } catch (dbError) {
      await db.exec("ROLLBACK");
      console.error("Error en la transacción de la base de datos para el alumno:", dbError);
      throw dbError; // Propaga el error para que sea capturado por el catch principal
    }
    // --- FIN: Lógica para poblar la Base de Datos ---

    res.json(syncData);
  } catch (err) {
    console.error("Error en sync/student:", err);
    res.status(500).json({ error: "Falló la sincronización del alumno" });
  }
});

/**
 * @route GET /api/courses/:courseId/all-assignments
 * @description Obtiene una lista PLANA de TODAS las tareas de TODOS los alumnos inscritos en un curso específico.
 * Útil para calcular la carga total de una clase sin agrupar.
 * @param {string} courseId - El ID interno (de tu DB) del curso.
 * @returns {Array<object>} 200 - Una lista de todas las tareas de la clase.
 * @returns {object} 401 - Error si no está autenticado.
 * @returns {object} 500 - Error interno del servidor.
 * @example
 * [
 * { "studentId": 7, "titulo": "Tarea de Física", "fecha_entrega": "22/10/2025", "nombre_curso": "Física I" },
 * { "studentId": 7, "titulo": "Tarea de Cálculo", "fecha_entrega": "23/10/2025", "nombre_curso": "Cálculo" },
 * { "studentId": 8, "titulo": "Tarea de Física", "fecha_entrega": "22/10/2025", "nombre_curso": "Física I" }
 * ]
 */
app.get("/api/courses/:courseId/all-assignments", authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;

    // --- PASO 1: Obtener la lista de todos los IDs de alumnos en este curso ---
    // (Esta parte es idéntica al método anterior)
    const studentRows = await db.all(
      `
            SELECT U.id
            FROM Usuarios AS U
            JOIN Inscripciones AS I ON U.id = I.usuario_id
            WHERE I.curso_id = ? AND U.rol = 'student'
        `,
      courseId
    );

    if (studentRows.length === 0) {
      return res.json([]); // Devuelve un array vacío si no hay alumnos
    }

    const studentIds = studentRows.map((row) => row.id);

    // --- PASO 2: Obtener TODAS las tareas para esa lista de IDs de alumnos ---
    // (Esta parte también es idéntica)
    const placeholders = studentIds.map(() => "?").join(",");
    const allAssignments = await db.all(
      `
            SELECT
                I.usuario_id as studentId,
                T.titulo,
                T.fecha_entrega,
                C.nombre_curso,
                E.estado as status
            FROM Tareas AS T
            JOIN Inscripciones AS I ON T.curso_id = I.curso_id
            JOIN Cursos AS C ON T.curso_id = C.id
            LEFT JOIN Entregas AS E ON E.tarea_id = T.id AND E.usuario_id = I.usuario_id
            WHERE I.usuario_id IN (${placeholders})
        `,
      ...studentIds
    );

    // --- PASO 3: Devolver la lista plana directamente ---
    // (Aquí está la diferencia: no hay paso de agrupación)
    res.json(allAssignments);
  } catch (error) {
    console.error("Error al obtener la lista plana de tareas:", error);
    res.status(500).json({ error: "Error interno al consultar la base de datos." });
  }
});

/**
 * @route GET /api/sync/teacher
 * @description Sincroniza los datos de Classroom para el profesor logueado y los guarda/actualiza en la base de datos.
 * @returns {object} 200 - El JSON "crudo" de datos que se obtuvo de Google y se usó para la sincronización.
 * @returns {object} 401 - Error si no está autenticado.
 * @returns {object} 500 - Error si falla la sincronización con Google o la DB.
 */
app.get("/api/sync/teacher", authMiddleware, async (req, res) => {
  try {
    console.log(`Sincronizando datos para el profesor: ${req.user.nombre}`);
    const classroom = google.classroom({ version: "v1", auth: req.authClient });

    const profileResp = await classroom.userProfiles.get({ userId: "me" });
    const coursesResp = await classroom.courses.list({ teacherId: "me" });

    const syncData = {
      profile: {
        id: profileResp.data.id || null,
        name: profileResp.data.name?.fullName || "",
        emailAddress: profileResp.data.emailAddress || "",
      },
      role: "teacher",
      teachingCourses: [],
    };

    if (coursesResp.data.courses && coursesResp.data.courses.length > 0) {
      for (const course of coursesResp.data.courses) {
        const assignmentsResp = await classroom.courses.courseWork.list({ courseId: course.id });
        const formattedAssignments = (assignmentsResp.data.courseWork || []).map((cw) => {
          const d = cw.dueDate;
          const dueDate = d && d.day && d.month && d.year ? `${String(d.day).padStart(2, "0")}/${String(d.month).padStart(2, "0")}/${d.year}` : null;
          return {
            id: cw.id || null,
            name: cw.title || "",
            dueDate: dueDate,
          };
        });

        syncData.teachingCourses.push({
          id: course.id || null,
          name: course.name || "",
          assignments: formattedAssignments,
        });
      }
    }

    // --- INICIO: Lógica para poblar la Base de Datos ---
    await db.exec("BEGIN TRANSACTION");
    try {
      const userId = req.user.id; // Obtenemos el ID del usuario de la sesión

      for (const course of syncData.teachingCourses) {
        // 1. Insertar curso si no existe
        await db.run("INSERT OR IGNORE INTO Cursos (google_course_id, nombre_curso) VALUES (?, ?)", course.id, course.name);

        // 2. Obtener el ID interno del curso
        const cursoDb = await db.get("SELECT id FROM Cursos WHERE google_course_id = ?", course.id);
        if (!cursoDb) {
          console.error(`Error: No se pudo encontrar/crear el curso con google_id ${course.id}`);
          continue;
        }
        const cursoId = cursoDb.id;

        // 3. Insertar la inscripción (relación usuario-curso) si no existe
        await db.run("INSERT OR IGNORE INTO Inscripciones (usuario_id, curso_id) VALUES (?, ?)", userId, cursoId);

        // 4. Insertar cada tarea del curso si no existe
        for (const assignment of course.assignments) {
          await db.run("INSERT OR IGNORE INTO Tareas (google_coursework_id, curso_id, titulo, fecha_entrega) VALUES (?, ?, ?, ?)", assignment.id, cursoId, assignment.name, assignment.dueDate);
        }
      }
      await db.exec("COMMIT");
      console.log(`Base de datos actualizada para el PROFESOR: ${req.user.nombre}`);
    } catch (dbError) {
      await db.exec("ROLLBACK");
      console.error("Error en la transacción de la base de datos para el profesor:", dbError);
      throw dbError; // Propaga el error para que sea capturado por el catch principal
    }
    // --- FIN: Lógica para poblar la Base de Datos ---

    res.json(syncData);
  } catch (err) {
    console.error("Error en sync/teacher:", err);
    res.status(500).json({ error: "Falló la sincronización del profesor" });
  }
});

app.get("/api/assignments", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Obtenemos el ID del usuario logueado gracias al middleware

    // Hacemos una consulta a NUESTRA base de datos
    const tasks = await db.all(
      `
            SELECT
                T.google_coursework_id as id,
                T.titulo as name,
                T.fecha_entrega as dueDate,
                C.nombre_curso as courseName,
                E.estado as status,
                CASE WHEN E.estado IN ('TURNED_IN','RETURNED') THEN 1 ELSE 0 END as completed
            FROM Tareas AS T
            JOIN Inscripciones AS I ON T.curso_id = I.curso_id
            JOIN Cursos AS C ON T.curso_id = C.id
            LEFT JOIN Entregas AS E ON E.tarea_id = T.id AND E.usuario_id = I.usuario_id
            WHERE I.usuario_id = ? AND T.fecha_entrega IS NOT NULL
        `,
      userId
    );

    res.json(tasks); // Devolvemos la lista de tareas
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "No se pudieron obtener las tareas." });
  }
});

/**
 * @route GET /api/courses/:courseId/student-workload
 * @description Obtiene TODAS las tareas de TODOS los alumnos de un curso, AGRUPADAS por ID de alumno.
 * Es la consulta principal para la vista del profesor.
 * @param {string} courseId - El ID interno (de tu DB) del curso.
 * @returns {object} 200 - Un objeto donde cada clave es un ID de alumno y el valor es su lista de tareas.
 * @returns {object} 401 - Error si no está autenticado.
 * @returns {object} 500 - Error interno del servidor.
 * @example
 * {
 * "7": [ { "titulo": "Tarea de Física", "fecha_entrega": "22/10/2025", "nombre_curso": "Física I" } ],
 * "8": [ { "titulo": "Tarea de Física", "fecha_entrega": "22/10/2025", "nombre_curso": "Física I" }, { "titulo": "Tarea de Historia", "fecha_entrega": "24/10/2025", "nombre_curso": "Historia" } ]
 * }
 */
app.get("/api/courses/:courseId/student-workload", authMiddleware, async (req, res) => {
  try {
    // El ID del curso específico del profesor (ej: '101' para "Física I")
    const { courseId } = req.params;

    // --- PASO 1: Obtener la lista de todos los IDs de alumnos en este curso ---
    const studentRows = await db.all(
      `
            SELECT U.id
            FROM Usuarios AS U
            JOIN Inscripciones AS I ON U.id = I.usuario_id
            WHERE I.curso_id = ? AND U.rol = 'student'
        `,
      courseId
    );

    // Si el curso no tiene alumnos, devolvemos una respuesta vacía.
    if (studentRows.length === 0) {
      return res.json({});
    }

    // Creamos un array de IDs simple: [7, 8, 9, ...]
    const studentIds = studentRows.map((row) => row.id);

    // --- PASO 2: Obtener TODAS las tareas para esa lista de IDs de alumnos ---

    // Creamos los placeholders (?) para la consulta SQL dinámicamente
    const placeholders = studentIds.map(() => "?").join(",");

    const allAssignments = await db.all(
      `
            SELECT
                I.usuario_id as studentId,
                T.titulo,
                T.fecha_entrega,
                C.nombre_curso,
                E.estado as status
            FROM Tareas AS T
            JOIN Inscripciones AS I ON T.curso_id = I.curso_id
            JOIN Cursos AS C ON T.curso_id = C.id
            LEFT JOIN Entregas AS E ON E.tarea_id = T.id AND E.usuario_id = I.usuario_id
            WHERE I.usuario_id IN (${placeholders})
        `,
      ...studentIds
    );

    // --- PASO 3: Agrupar los resultados por alumno para una respuesta JSON limpia ---
    const workloadByStudent = allAssignments.reduce((acc, task) => {
      const studentId = task.studentId;
      // Si es la primera tarea que vemos de este alumno, creamos su entrada
      if (!acc[studentId]) {
        acc[studentId] = [];
      }
      // Añadimos la tarea a la lista de ese alumno
      acc[studentId].push({
        titulo: task.titulo,
        fecha_entrega: task.fecha_entrega,
        nombre_curso: task.nombre_curso,
        status: task.status,
        completed: task.status === "TURNED_IN" || task.status === "RETURNED",
      });
      return acc;
    }, {});

    res.json(workloadByStudent);
  } catch (error) {
    console.error("Error al obtener la carga de trabajo de los alumnos:", error);
    res.status(500).json({ error: "Error interno al consultar la base de datos." });
  }
});

app.listen(port, () => console.log(`Servidor escuchando en http://localhost:${port}`));
