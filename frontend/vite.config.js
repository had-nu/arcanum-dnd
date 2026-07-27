import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';
    
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@api': path.resolve(__dirname, './src/api'),
                '@components': path.resolve(__dirname, './src/components'),
                '@hooks': path.resolve(__dirname, './src/hooks'),
                '@stores': path.resolve(__dirname, './src/stores'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@utils': path.resolve(__dirname, './src/utils'),
                '@data': path.resolve(__dirname, './src/data'),
            },
        },
        server: {
            port: 5173,
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: true,
            rollupOptions: {
                output: {
                    entryFileNames: 'assets/[name]-[hash].js',
                    chunkFileNames: 'assets/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash].[ext]',
                },
            },
        },
    };
});
