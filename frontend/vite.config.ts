import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // Base path for assets - set to empty string for relative paths
    // This ensures assets work correctly when deployed to subdirectories
    base: '',
    build: {
      // Generate sourcemaps for better debugging
      sourcemap: true,
      // Ensure output directory matches Vercel config
      outDir: 'dist',
      // Optimize build size
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            uiLibs: ['@chakra-ui/react'],
            utils: ['axios', 'file-saver', 'jszip']
          }
        }
      }
    }
  };
});
