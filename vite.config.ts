import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
           
            '/api': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
              secure: false,
            },

            '/places': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
              secure: false,
            },
            
            
            '/static': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
              secure: false,
            },
            '/proxy_image': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
              secure: false
            },

            
            '/chat_message': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false},
            '/user': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
            '/tts': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
            '/auth': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/check_login_status': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/authorize': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/oauth2callback': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/create_event': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            
            
            '/socket.io': {
              target: 'http://127.0.0.1:5000',
              changeOrigin: true,
              secure: false,
              ws: true
            },
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
