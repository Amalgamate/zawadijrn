import React, { useState, useMemo, useRef, useCallback } from 'react';

/**
 * A highly performant Virtualized Table component
 * Renders only the items currently in view
 */
const VirtualizedTable = ({
    data = [],
    rowHeight = 60,
    visibleHeight = 600,
    bufferedItems = 5,
    renderRow,
    header,
    className = "",
    emptyComponent
}) => {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Use passive scroll listener for better performance
    const onScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    // Calculate visible range
    const { startIndex, endIndex, totalHeight, translateY } = useMemo(() => {
        if (data.length === 0) return { startIndex: 0, endIndex: 0, totalHeight: 0, translateY: 0 };

        const start = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferedItems);
        const end = Math.min(
            data.length,
            Math.ceil((scrollTop + visibleHeight) / rowHeight) + bufferedItems
        );

        return {
            startIndex: start,
            endIndex: end,
            totalHeight: data.length * rowHeight,
            translateY: start * rowHeight
        };
    }, [scrollTop, rowHeight, visibleHeight, data.length, bufferedItems]);

    const visibleData = data.slice(startIndex, endIndex);

    return (
        <div
            ref={containerRef}
            onScroll={onScroll}
            className={`overflow-auto relative custom-scrollbar ${className}`}
            style={{ maxHeight: visibleHeight }}
        >
            <table className="w-full border-collapse">
                {header && (
                    <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                        {header}
                    </thead>
                )}
                <tbody className="divide-y divide-gray-200">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan="100%">
                                {emptyComponent || (
                                    <div className="px-6 py-12 text-center text-gray-500 italic">
                                        No records found.
                                    </div>
                                )}
                            </td>
                        </tr>
                    ) : (
                        <>
                            {/* Top Spacer */}
                            {translateY > 0 && (
                                <tr style={{ height: translateY }}>
                                    <td colSpan="100%" style={{ padding: 0, border: 'none' }}></td>
                                </tr>
                            )}

                            {visibleData.map((item, index) => renderRow(item, startIndex + index))}

                            {/* Bottom Spacer */}
                            {totalHeight - (translateY + (visibleData.length * rowHeight)) > 0 && (
                                <tr style={{ height: totalHeight - (translateY + (visibleData.length * rowHeight)) }}>
                                    <td colSpan="100%" style={{ padding: 0, border: 'none' }}></td>
                                </tr>
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default VirtualizedTable;
