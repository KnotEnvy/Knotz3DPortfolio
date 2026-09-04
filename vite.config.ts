import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
  // Single source of truth for the version string the terminal prints. It had
  // drifted to a hand-typed "v3.0" against a package.json that said 2.0.0.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
  server: { host: true, port: 5173 },
});
