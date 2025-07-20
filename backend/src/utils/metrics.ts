import client from 'prom-client';

export const authRegisterDuration = new client.Histogram({
  name: 'auth_register_duration_seconds',
  help: 'Duración del handler de register',
  labelNames: ['status'],
});

export const authLoginDuration = new client.Histogram({
  name: 'auth_login_duration_seconds',
  help: 'Duración del handler de login',
  labelNames: ['status'],
});

export const authGetUserDuration = new client.Histogram({
  name: 'auth_get_current_user_duration_seconds',
  help: 'Duración del handler de getCurrentUser',
  labelNames: ['status'],
});