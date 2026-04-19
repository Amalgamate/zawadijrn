import { useState, useCallback } from 'react';
import api from '../../../services/api';
import { useNotifications } from './useNotifications';

export const useDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });

    const { showSuccess, showError } = useNotifications();

    const fetchDocuments = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await api.documents.getAll(params);
            if (response.success) {
                const list = Array.isArray(response.data) ? response.data : [];
                setDocuments(list);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
            return response;
        } catch (error) {
            console.error('Error fetching documents:', error);
            showError(error.message || 'Failed to fetch documents');
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.documents.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    const uploadDocument = useCallback(async (formData, refreshParams = {}) => {
        setLoading(true);
        setUploadProgress(0);
        try {
            const response = await api.documents.upload(formData, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });
            if (response.success) {
                showSuccess('Document uploaded successfully');
                await fetchDocuments(refreshParams);
            }
            return response;
        } catch (error) {
            console.error('Error uploading document:', error);
            showError(error.message || 'Failed to upload document');
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    }, [fetchDocuments, showError, showSuccess]);

    const uploadMultipleDocuments = useCallback(async (formData, refreshParams = {}) => {
        setLoading(true);
        setUploadProgress(0);
        try {
            const response = await api.documents.uploadMultiple(formData, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            });
            if (response.success) {
                const n = Array.isArray(response.data) ? response.data.length : 0;
                showSuccess(n ? `${n} documents uploaded successfully` : 'Documents uploaded successfully');
                await fetchDocuments(refreshParams);
            }
            return response;
        } catch (error) {
            console.error('Error uploading documents:', error);
            showError(error.message || 'Failed to upload documents');
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [fetchDocuments, showError, showSuccess]);

    const deleteDocument = useCallback(async (id) => {
        try {
            const response = await api.documents.delete(id);
            if (response.success) {
                showSuccess('Document deleted successfully');
                setDocuments(prev => prev.filter(doc => doc.id !== id));
            }
            return response;
        } catch (error) {
            console.error('Error deleting document:', error);
            showError(error.message || 'Failed to delete document');
            return { success: false, error: error.message };
        }
    }, [showError, showSuccess]);

    const updateDocument = useCallback(async (id, data) => {
        try {
            const response = await api.documents.update(id, data);
            if (response.success) {
                showSuccess('Document updated successfully');
                setDocuments(prev => prev.map(doc => doc.id === id ? response.data : doc));
            }
            return response;
        } catch (error) {
            console.error('Error updating document:', error);
            showError(error.message || 'Failed to update document');
            return { success: false, error: error.message };
        }
    }, [showError, showSuccess]);

    return {
        documents,
        categories,
        loading,
        uploadProgress,
        pagination,
        fetchDocuments,
        fetchCategories,
        uploadDocument,
        uploadMultipleDocuments,
        deleteDocument,
        updateDocument
    };
};
