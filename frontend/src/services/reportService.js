import api from './api';

export const getReports = () =>
    api.get('/reports');