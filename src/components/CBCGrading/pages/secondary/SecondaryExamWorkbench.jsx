import React from 'react';
import { ArrowRight, ClipboardList, FileSpreadsheet, FileText, Layers } from 'lucide-react';

const contentByType = {
  cats: {
    title: 'CATs Workbench',
    description: 'Manage continuous assessment workflows for Senior School.',
  },
  mid: {
    title: 'Mid-term Exams Workbench',
    description: 'Prepare and process mid-term exam records and analysis.',
  },
  end: {
    title: 'End-term Exams Workbench',
    description: 'Run end-term exam entry and performance reporting.',
  },
  mock: {
    title: 'Mock Exams Workbench',
    description: 'Manage mock exam cycles and compare outcomes over time.',
  },
};

const ActionCard = ({ icon: Icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left rounded-2xl border bg-white p-4 shadow-sm hover:bg-gray-50 transition"
  >
    <div className="flex items-start gap-3">
      <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-2 text-emerald-800">
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

const SecondaryExamWorkbench = ({ type = 'cats', onNavigate }) => {
  const cfg = contentByType[type] || contentByType.cats;
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{cfg.title}</h1>
        <p className="mt-1 text-sm font-medium text-gray-600">{cfg.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          icon={ClipboardList}
          title="Test Setup"
          description="Create and manage assessment tests."
          onClick={() => onNavigate?.('assess-summative-tests')}
        />
        <ActionCard
          icon={Layers}
          title="Mark Entry"
          description="Enter and review scores using the summative workflow."
          onClick={() => onNavigate?.('assess-summative-assessment')}
        />
        <ActionCard
          icon={FileSpreadsheet}
          title="Assessment Matrix"
          description="Review class and learning area performance matrix."
          onClick={() => onNavigate?.('assess-summary-report')}
        />
        <ActionCard
          icon={FileText}
          title="Detailed Reports"
          description="Open detailed summative reports for analysis."
          onClick={() => onNavigate?.('assess-summative-report')}
        />
      </div>
    </div>
  );
};

export default SecondaryExamWorkbench;

