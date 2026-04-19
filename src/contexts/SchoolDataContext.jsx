import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GRADES } from '../constants/grades';
import { useRefreshListener } from '../utils/refreshBus';
import { useAuth } from '../hooks/useAuth';
import { useBootstrapStore } from '../store/useBootstrapStore';
import axiosInstance from '../services/api/axiosConfig';

const SchoolDataContext = createContext();

const sortGrades = (gradeArray) => {
  if (!gradeArray || gradeArray.length === 0) return [];
  const gradeOrderMap = new Map(GRADES?.map((g, index) => [g.value || g, index]) || []);
  return [...gradeArray].sort((a, b) => {
    const ia = gradeOrderMap.has(a) ? gradeOrderMap.get(a) : 999;
    const ib = gradeOrderMap.has(b) ? gradeOrderMap.get(b) : 999;
    return ia !== ib ? ia - ib : a.localeCompare(b);
  });
};

export const SchoolDataProvider = ({ children }) => {
  const { user } = useAuth();

  // Read pre-loaded classes + streams from the bootstrap store
  const bootstrapClasses = useBootstrapStore(s => s.classes);
  const bootstrapStreams  = useBootstrapStore(s => s.streams);
  const bootstrapReady   = useBootstrapStore(s => s.ready);

  const [classes, setClasses] = useState(bootstrapClasses ?? []);
  const [streams, setStreams]  = useState(bootstrapStreams  ?? []);
  const [grades,  setGrades]  = useState([]);
  const [loading, setLoading] = useState(!bootstrapReady);
  const [error,   setError]   = useState(null);

  // Derive grades whenever classes change
  useEffect(() => {
    const institutionType = user?.institutionType || 'PRIMARY_CBC';
    const isSenior = institutionType === 'SECONDARY';

    const fallback = isSenior
      ? ['GRADE_10', 'GRADE_11', 'GRADE_12']
      : ['PLAYGROUP','PP1','PP2','GRADE_1','GRADE_2','GRADE_3','GRADE_4',
         'GRADE_5','GRADE_6','GRADE_7','GRADE_8','GRADE_9'];

    const activeGrades = classes.map(c => c.grade);
    const combined = [...new Set([...fallback, ...activeGrades])].filter(Boolean);
    setGrades(sortGrades(combined));
  }, [classes, user?.institutionType]);

  // When the bootstrap store delivers data, sync it here
  useEffect(() => {
    if (bootstrapClasses !== null) {
      setClasses(bootstrapClasses);
      setLoading(false);
    }
  }, [bootstrapClasses]);

  useEffect(() => {
    if (bootstrapStreams !== null) {
      setStreams(bootstrapStreams.filter(s => !s.archived && s.active !== false));
    }
  }, [bootstrapStreams]);

  // Fallback: if bootstrap never ran (e.g. user landed here without splashscreen),
  // fetch classes + streams directly. No artificial delay needed on local.
  const fetchSchoolData = useCallback(async () => {
    if (user?.role === 'PARENT') {
      setClasses([]); setGrades([]); setStreams([]);
      setLoading(false); return;
    }
    if (!user) return;

    try {
      setLoading(true); setError(null);
      const [classesRes, streamsRes] = await Promise.all([
        axiosInstance.get('/classes'),
        axiosInstance.get('/facility/streams').catch(() => ({ data: { data: [] } })),
      ]);
      const fetchedClasses = classesRes.data?.data ?? [];
      const rawStreams = Array.isArray(streamsRes.data)
        ? streamsRes.data
        : (streamsRes.data?.data ?? []);

      setClasses(fetchedClasses);
      setStreams(rawStreams.filter(s => !s.archived && s.active !== false));
    } catch (err) {
      console.error('SchoolDataContext fetch error:', err);
      setError(err.message || 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Only run the fallback fetch if bootstrap data never arrived
  useEffect(() => {
    if (bootstrapReady) return;           // bootstrap has the data — do nothing
    if (!user) return;
    if (user.role === 'PARENT') {
      setClasses([]); setGrades([]); setStreams([]);
      setLoading(false); return;
    }
    fetchSchoolData();
  }, [bootstrapReady, user, fetchSchoolData]);

  useRefreshListener('classes', fetchSchoolData);
  useRefreshListener('streams', fetchSchoolData);

  const value = useMemo(() => ({
    classes, grades, streams, loading, error,
    refreshSchoolData: fetchSchoolData,
  }), [classes, grades, streams, loading, error, fetchSchoolData]);

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
