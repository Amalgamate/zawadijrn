import React from 'react';
import { ArrowRight, ClipboardList, FileText, Layers } from 'lucide-react';

const Card = ({ title, description, onClick, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left rounded-2xl border bg-white p-4 shadow-sm hover:bg-gray-50 transition"
  >
    <div className="flex items-start gap-3">
      <div className="rounded-xl border bg-indigo-50 border-indigo-200 p-2 text-indigo-800">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="mt-1 text-xs font-medium text-gray-600">{description}</div>
      </div>
      <ArrowRight className="text-gray-400" size={18} />
    </div>
  </button>
);

const MarkEntryHub = ({ onNavigate }) => {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mark Entry</h1>
        <p className="mt-1 text-sm font-medium text-gray-600">
          Use the live CBC assessment module (supports the Senior 8-level scale).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          icon={ClipboardList}
          title="Summative Assessments"
          description="Create tests, record results, and view matrices."
          onClick={() => onNavigate?.('assess-summative-assessment')}
        />
        <Card
          icon={Layers}
          title="Formative Assessments"
          description="Create formative assessments and record results."
          onClick={() => onNavigate?.('assess-formative')}
        />
        <Card
          icon={FileText}
          title="Termly Report"
          description="Generate the termly report and analytics."
          onClick={() => onNavigate?.('assess-termly-report')}
        />
        <Card
          icon={Layers}
          title="Learning Areas"
          description="Manage and seed learning areas for Senior School."
          onClick={() => onNavigate?.('assess-learning-areas')}
        />
      </div>
    </div>
  );
};

export default MarkEntryHub;

