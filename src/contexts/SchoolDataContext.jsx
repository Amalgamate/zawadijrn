import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { GRADES } from '../constants/grades'; // For sorting

const SchoolDataContext = createContext();

export const SchoolDataProvider = ({ children }) => {
    const [classes, setClasses] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to sort grades based on the constants definition if available
    const sortGrades = (gradeArray) => {
        if (!gradeArray || gradeArray.length === 0) return [];

        // Map constant GRADES array to order indices
        const gradeOrderMap = new Map(GRADES?.map((g, index) => [g.value || g, index]) || []);

        return [...gradeArray].sort((a, b) => {
            const indexA = gradeOrderMap.has(a) ? gradeOrderMap.get(a) : 999;
            const indexB = gradeOrderMap.has(b) ? gradeOrderMap.get(b) : 999;

            if (indexA !== indexB) {
                return indexA - indexB;
            }
            return a.localeCompare(b); // Fallback to alphabetical
        });
    };

    const fetchSchoolData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.classes.getAll();
            const fetchedClasses = response.data || [];

            setClasses(fetchedClasses);

            // Extract unique grades and filter out falsy values
            const uniqueGrades = [...new Set(fetchedClasses.map(c => c.grade))].filter(Boolean);
            setGrades(sortGrades(uniqueGrades));

        } catch (err) {
            console.error('Error fetching school data:', err);
            setError(err.message || 'Failed to fetch school data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchoolData();
    }, []);

    const value = useMemo(() => ({
        classes,
        grades,
        loading,
        error,
        refreshSchoolData: fetchSchoolData
    }), [classes, grades, loading, error]);

    return (
        <SchoolDataContext.Provider value={value}>
            {children}
        </SchoolDataContext.Provider>
    );
};

export const useSchoolData = () => {
    const context = useContext(SchoolDataContext);
    if (context === undefined) {
        throw new Error('useSchoolData must be used within a SchoolDataProvider');
    }
    return context;
};
