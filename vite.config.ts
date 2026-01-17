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
            // 1. 统一处理 /api 开头的请求 (包括通知系统)
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
            
            // 2. 静态资源和图片
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

            // 3. 其他零散的根路径接口
            '/chat_message': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false},
            '/user': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
            '/tts': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
            '/auth': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/check_login_status': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/authorize': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/oauth2callback': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            '/create_event': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false  },
            
            // 4. Socket.IO Proxy (Critical for Live Chat)
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
