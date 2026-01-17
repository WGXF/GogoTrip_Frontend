// 集中管理配置的文件

// 从环境变量读取，如果没有设置，则使用默认值作为后备
// Use empty string to leverage Vite proxy for all API calls
// This ensures cookies work correctly with same-origin requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 在这里放其他的全局配置
export const APP_NAME = "GogoTrip";