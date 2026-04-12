import { fetchWithAuth } from './core';

export const transportAPI = {
    // Vehicles
    getVehicles: async () => {
        return fetchWithAuth('/transport/vehicles');
    },
    createVehicle: async (data) => {
        return fetchWithAuth('/transport/vehicles', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    deleteVehicle: async (id) => {
        return fetchWithAuth(`/transport/vehicles/${id}`, {
            method: 'DELETE'
        });
    },

    // Routes
    getRoutes: async () => {
        return fetchWithAuth('/transport/routes');
    },
    createRoute: async (data) => {
        return fetchWithAuth('/transport/routes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    deleteRoute: async (id) => {
        return fetchWithAuth(`/transport/routes/${id}`, {
            method: 'DELETE'
        });
    },

    // Assignments & Passengers
    getAssignments: async (routeId) => {
        return fetchWithAuth(`/transport/assignments/${routeId}`);
    },
    createAssignment: async (data) => {
        return fetchWithAuth('/transport/assignments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    deleteAssignment: async (id) => {
        return fetchWithAuth(`/transport/assignments/${id}`, {
            method: 'DELETE'
        });
    }
};
