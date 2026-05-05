import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'; // 1. Add this import
import proxyOptions from './proxyOptions';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(), 
        tailwindcss() // 2. Add the plugin here
    ],
    server: {
        port: 8080,
        host: '0.0.0.0',
        proxy: proxyOptions
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    build: {
        outDir: '../hu_passcard_system/public/frontend',
        emptyOutDir: true,
        target: 'es2015',
    },
});