import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm border border-transparent dark:border-slate-700"
            aria-label="Toggle Theme"
        >
            {isDarkMode ? (
                <Sun size={20} className="transition-transform duration-500 hover:rotate-90" />
            ) : (
                <Moon size={20} className="transition-transform duration-500 hover:-rotate-12" />
            )}
        </button>
    );
};

export default ThemeToggle;
