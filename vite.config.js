import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "login.html"),
        landing: resolve(__dirname, "landing.html"),
        student: resolve(__dirname, "StudentPanel.html"),
        teacher: resolve(__dirname, "TeacherPanel.html"),
      },
    },
  },
});
