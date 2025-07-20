import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Logger } from '../utils/logger';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
Logger.debug('Base URL:', API_URL);

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    Logger.debug(
      `→ Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      { headers: config.headers, data: config.data }
    );

    const token = localStorage.getItem('token');
    Logger.debug('Token en storage:', token?.length || 0 > 0 ? 'Present' : 'Not present');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: unknown) => {
    Logger.error('Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    Logger.debug(
      `← Response: ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url} → ${response.status}`,
      response.data
    );
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
     Logger.warn(
        `← Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url} →`,
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      Logger.warn('← No Response:', error.request);
    } else {
      Logger.error('← Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;