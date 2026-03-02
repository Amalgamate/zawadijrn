import { useState, useCallback } from 'react';
import api from '../../../services/api';

export const useInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchItems = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.getAll(params);
            if (response.success) {
                setItems(response.data);
            } else {
                setError(response.message || 'Failed to fetch inventory');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createItem = useCallback(async (itemData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.create(itemData);
            if (response.success) {
                await fetchItems();
                return response;
            } else {
                setError(response.message || 'Failed to create item');
                return response;
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchItems]);

    const updateItem = useCallback(async (id, itemData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.update(id, itemData);
            if (response.success) {
                await fetchItems();
                return response;
            } else {
                setError(response.message || 'Failed to update item');
                return response;
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchItems]);

    const deleteItem = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.delete(id);
            if (response.success) {
                await fetchItems();
                return response;
            } else {
                setError(response.message || 'Failed to delete item');
                return response;
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchItems]);

    const assignItem = useCallback(async (id, userId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.assign(id, userId);
            if (response.success) {
                await fetchItems();
                return response;
            } else {
                setError(response.message || 'Failed to assign item');
                return response;
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchItems]);

    const returnItem = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.books.return(id);
            if (response.success) {
                await fetchItems();
                return response;
            } else {
                setError(response.message || 'Failed to return item');
                return response;
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [fetchItems]);

    return {
        items,
        loading,
        error,
        fetchItems,
        createItem,
        updateItem,
        deleteItem,
        assignItem,
        returnItem
    };
};
