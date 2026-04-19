import { axiosInstance } from './axiosConfig';

export const tertiaryApi = {
    // Departments
    getDepartments: () => axiosInstance.get('/tertiary/departments').then(res => res.data),
    createDepartment: (rawData) => axiosInstance.post('/tertiary/departments', rawData).then(res => res.data),
    updateDepartment: (id, rawData) => axiosInstance.patch(`/tertiary/departments/${id}`, rawData).then(res => res.data),
    deleteDepartment: (id) => axiosInstance.delete(`/tertiary/departments/${id}`).then(res => res.data),

    // Programs
    getPrograms: () => axiosInstance.get('/tertiary/programs').then(res => res.data),
    createProgram: (rawData) => axiosInstance.post('/tertiary/programs', rawData).then(res => res.data),
    updateProgram: (id, rawData) => axiosInstance.patch(`/tertiary/programs/${id}`, rawData).then(res => res.data),
    deleteProgram: (id) => axiosInstance.delete(`/tertiary/programs/${id}`).then(res => res.data),

    // Units
    getUnits: () => axiosInstance.get('/tertiary/units').then(res => res.data),
    createUnit: (rawData) => axiosInstance.post('/tertiary/units', rawData).then(res => res.data),
    updateUnit: (id, rawData) => axiosInstance.patch(`/tertiary/units/${id}`, rawData).then(res => res.data),
    deleteUnit: (id) => axiosInstance.delete(`/tertiary/units/${id}`).then(res => res.data),
};

export default tertiaryApi;
