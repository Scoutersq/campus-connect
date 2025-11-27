import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "process.env": {
        REACT_APP_API_URL: env.REACT_APP_API_URL || "",
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
