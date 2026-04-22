/**
 * CourseViewer — Two-panel content consumption view for students
 * Left: outline with checkmarks | Right: content renderer
 */
import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle, Circle, ChevronLeft, ChevronRight,
  Video, FileText, Link2, Music, Download, Loader
} from 'lucide-react';
import axiosInstance from '../../../../services/api/axiosConfig';

const TYPE_ICONS = {
  VIDEO:    { icon: Video,    color: 'text-blue-500',   bg: 'bg-blue-50' },
  PDF:      { icon: FileText, color: 'text-red-500',    bg: 'bg-red-50' },
  LINK:     { icon: Link2,    color: 'text-purple-500', bg: 'bg-purple-50' },
  AUDIO:    { icon: Music,    color: 'text-emerald-500',bg: 'bg-emerald-50' },
  DOCUMENT: { icon: Download, color: 'text-amber-500',  bg: 'bg-amber-50' },
};

const ContentRenderer = ({ item }) => {
  if (!item) return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="text-center">
        <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 font-medium">Select a content item from the outline to begin.</p>
      </div>
    </div>
  );

  const { contentType, title, contentUrl, description } = item;

  const renderMedia = () => {
    switch (contentType) {
      case 'VIDEO':
        // Support YouTube/Vimeo embeds or direct video
        if (contentUrl?.includes('youtube.com') || contentUrl?.includes('youtu.be')) {
          const videoId = contentUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
          return (
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={title}
            />
          );
        }
        return <video src={contentUrl} controls className="w-full h-full rounded-lg object-contain bg-black" />;

      case 'PDF':
        return (
          <iframe
            src={contentUrl}
            className="w-full h-full rounded-lg border border-gray-200"
            title={title}
          />
        );

      case 'AUDIO':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <Music size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            <audio src={contentUrl} controls className="w-full max-w-md" />
          </div>
        );

      case 'LINK':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
              <Link2 size={36} className="text-purple-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="text-sm text-gray-500 text-center max-w-md">{description}</p>}
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Link2 size={16} /> Open Link
            </a>
          </div>
        );

      case 'DOCUMENT':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Download size={36} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="text-sm text-gray-500 text-center max-w-md">{description}</p>}
            <a
              href={contentUrl}
              download
              className="px-6 py-3 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Download size={16} /> Download Document
            </a>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Unsupported content type: {contentType}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        {(() => {
          const meta = TYPE_ICONS[contentType] || TYPE_ICONS.DOCUMENT;
          const Icon = meta.icon;
          return (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${meta.bg} ${meta.color}`}>
              <Icon size={11} /> {contentType}
            </span>
          );
        })()}
      </div>
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-50 flex" style={{ minHeight: '400px' }}>
        {renderMedia()}
      </div>
    </div>
  );
};

const CourseViewer = ({ courseId, onNavigate }) => {
  const [course, setCourse] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    axiosInstance.get(`/lms/my-courses/${courseId}`)
      .then(r => {
        const data = r.data?.data;
        setCourse(data);
        if (data?.contentItems?.length > 0) {
          // Start at first incomplete item
          const first = data.contentItems.find(i => !i.completed) || data.contentItems[0];
          setActiveItem(first);
        }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, [courseId]);

  const markComplete = async () => {
    if (!activeItem || activeItem.completed || markingComplete) return;
    setMarkingComplete(true);
    try {
      await axiosInstance.put('/lms/my-progress', {
        enrollmentId: course.enrollmentId,
        contentItemId: activeItem.id,
        completed: true,
      });
      // Update local state
      setCourse(prev => ({
        ...prev,
        contentItems: prev.contentItems.map(i =>
          i.id === activeItem.id ? { ...i, completed: true } : i
        )
      }));
      setActiveItem(prev => ({ ...prev, completed: true }));
    } catch (e) {
      console.error('Failed to mark complete:', e);
    } finally {
      setMarkingComplete(false);
    }
  };

  const goTo = (direction) => {
    if (!course?.contentItems) return;
    const idx = course.contentItems.findIndex(i => i.id === activeItem?.id);
    const next = course.contentItems[idx + direction];
    if (next) setActiveItem(next);
  };

  const completedCount = course?.contentItems?.filter(i => i.completed).length || 0;
  const totalCount = course?.contentItems?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={32} className="animate-spin text-purple-500" />
    </div>
  );

  if (!course) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Course not found or you are not enrolled.</p>
      <button onClick={() => onNavigate?.('student-courses')} className="mt-4 text-purple-600 font-medium text-sm hover:underline">Back to My Courses</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: '80vh' }}>
      {/* Top bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate?.('student-courses')} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-purple-700 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{course.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-gray-400">{completedCount}/{totalCount} done</span>
          </div>
        </div>
      </div>

      {/* Main layout: outline + content */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '500px' }}>
        {/* Left: outline */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Course Outline</p>
          </div>
          <div className="p-2 space-y-1">
            {course.contentItems?.map((item, idx) => {
              const meta = TYPE_ICONS[item.contentType] || TYPE_ICONS.DOCUMENT;
              const Icon = meta.icon;
              const isActive = activeItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${isActive ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <div className={`flex-shrink-0 ${item.completed ? 'text-emerald-500' : (isActive ? 'text-purple-500' : 'text-gray-300')}`}>
                    {item.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">{idx + 1}. {item.title}</p>
                    <span className={`text-[9px] font-semibold uppercase ${meta.color}`}>{item.contentType}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <ContentRenderer item={activeItem} />

          {/* Navigation + Mark Complete */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between">
            <button
              onClick={() => goTo(-1)}
              disabled={!course.contentItems || course.contentItems.findIndex(i => i.id === activeItem?.id) === 0}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {activeItem && !activeItem.completed && (
              <button
                onClick={markComplete}
                disabled={markingComplete}
                className="px-5 py-2 bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {markingComplete ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Mark as Complete
              </button>
            )}
            {activeItem?.completed && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <CheckCircle size={16} /> Completed
              </span>
            )}

            <button
              onClick={() => goTo(1)}
              disabled={!course.contentItems || course.contentItems.findIndex(i => i.id === activeItem?.id) === course.contentItems.length - 1}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
