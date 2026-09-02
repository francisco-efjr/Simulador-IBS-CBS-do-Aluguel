/// <reference types="vitest" />
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { TransitionCalendar } from './src/core/services/TransitionCalendar.ts';

function transitionApiPlugin(): Plugin {
  return {
    name: 'transition-schedule-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/cronograma-transicao' || url === '/api/transition-schedule') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache');
          const schedule = TransitionCalendar.getFullSchedule();
          res.end(JSON.stringify(schedule, null, 2));
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), transitionApiPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
  },
});
