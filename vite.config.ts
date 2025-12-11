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
                // 1. 聊天相关
                '/chat_message': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },

                // 2. 图片代理
                '/proxy_image': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },

                // 3. 翻译与语音
                '/translate': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                '/tts': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },

                // 4. 用户认证 (Auth)
                // 包含: /auth/send-code, /auth/signup-verify, /auth/login-email, /auth/logout
                '/auth': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                // 单独的认证接口
                '/check_login_status': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                '/authorize': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                '/oauth2callback': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },

                // 5. 日历 (Calendar)
                // 包含: /calendar/events, /calendar/sync, /calendar/delete/*, /calendar/add_manual
                '/calendar': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                // AI 创建日程的单独接口
                '/create_event': {
                  target: 'http://127.0.0.1:5000',
                  changeOrigin: true,
                  secure: false
                },
                
                // 6. (可选) 如果你需要通过前端检查后端状态
                '/': {
                    target: 'http://127.0.0.1:5000',
                    changeOrigin: true,
                    secure: false,
                    // ⚠️注意：这可能会覆盖前端页面，仅在必要时开启，或者建议给后端加个 /api 前缀
                    // 如果前端页面白屏，请注释掉这一段
                    bypass: (req) => {
                        if (req.method === 'GET' && !req.headers.accept?.includes('application/json')) {
                            return req.url; // 如果不是 JSON 请求（比如请求 index.html），则不转发
                        }
                    }
                }
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
