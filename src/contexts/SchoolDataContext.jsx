import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api, { configAPI } from '../services/api';
import { GRADES } from '../constants/grades';
import { useRefreshListener } from '../utils/refreshBus';
import { useAuth } from '../hooks/useAuth';

const SchoolDataContext = createContext();

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

export const SchoolDataProvider = ({ children }) => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [grades, setGrades] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const fetchSchoolData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch classes and streams in parallel
            const [classesResponse, streamsResponse] = await Promise.all([
                api.classes.getAll(),
                configAPI.getStreamConfigs().catch(() => [])
            ]);

            const fetchedClasses = classesResponse.data || [];
            setClasses(fetchedClasses);

            // ─── Refined Global Grades Logic ───
            // 1. Get the current institution level from user context
            const institutionType = user?.institutionType || 'PRIMARY_CBC';
            const isSenior = institutionType === 'SECONDARY';

            // 2. Fetch full curriculum grades based on level (PP1-G9 or G10-G12)
            const fallbackGrades = isSenior 
                ? ['GRADE_10', 'GRADE_11', 'GRADE_12']
                : ['PLAYGROUP', 'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7', 'GRADE_8', 'GRADE_9'];

            // 3. Merge with active classes to ensure all "active" grades are also present
            const activeGrades = fetchedClasses.map(c => c.grade);
            const combinedUniqueGrades = [...new Set([...fallbackGrades, ...activeGrades])].filter(Boolean);

            setGrades(sortGrades(combinedUniqueGrades));

            // Process streams from configAPI response
            const rawStreams = Array.isArray(streamsResponse)
                ? streamsResponse
                : (streamsResponse?.data || []);
            setStreams(rawStreams.filter(s => !s.archived && s.active !== false));

        } catch (err) {
            console.error('Error fetching school data:', err);
            setError(err.message || 'Failed to fetch school data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'PARENT') {
            setClasses([]);
            setGrades([]);
            setStreams([]);
            setError(null);
            setLoading(false);
            return;
        }
        fetchSchoolData();
    }, [fetchSchoolData, user?.role]);

    const refreshForRole = useCallback(() => {
        if (user?.role === 'PARENT') return;
        fetchSchoolData();
    }, [fetchSchoolData, user?.role]);

    useRefreshListener('classes', refreshForRole);
    useRefreshListener('streams', refreshForRole);

    const value = useMemo(() => ({
        classes,
        grades,
        streams,
        loading,
        error,
        refreshSchoolData: refreshForRole
    }), [classes, grades, streams, loading, error, refreshForRole]);

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
