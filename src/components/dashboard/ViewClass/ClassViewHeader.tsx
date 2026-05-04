import { Download } from 'lucide-react';

interface ClassViewHeaderProps {
  classCode?: string;
  isExporting: boolean;
  isDisabled: boolean;
  onExport: () => void;
}

export default function ClassViewHeader({
  classCode,
  isExporting,
  isDisabled,
  onExport,
}: ClassViewHeaderProps) {
  return (
    <div className="self-start w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-heading-small text-3xl text-primary-blue self-start">
            Class Code: <span className="text-black">{classCode}</span>
          </p>
          <hr className="h-0 w-50 mt-3 border-1 border-primary-yellow" />
        </div>
        <button
          onClick={onExport}
          disabled={isExporting || isDisabled}
          className="bg-primary-blue text-white px-6 py-2 rounded-md font-content text-sm flex items-center gap-2 hover:brightness-90 disabled:brightness-75 disabled:cursor-not-allowed transition-all"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export Class Data'}
        </button>
      </div>
    </div>
  );
}
