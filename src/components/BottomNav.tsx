type PageId = 
  | 'MindDumpInputPage'
  | 'AIParseReviewPage'
  | 'TaskDashboardPage'
  | 'FocusTimerPage'
  | 'FocusReviewPage'
  | 'ContinuityArchivePage';

export function BottomNav({ current, onNavigate }: { current: PageId, onNavigate: (page: PageId) => void }) {
  // Determine highlighted tab Based on logic from user request
  const isInput = current === 'MindDumpInputPage' || current === 'AIParseReviewPage';
  const isDashboard = current === 'TaskDashboardPage';
  const isFocus = current === 'FocusTimerPage' || current === 'FocusReviewPage';
  const isArchive = current === 'ContinuityArchivePage';

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[70px] bg-white border-t border-gray-200 max-w-[390px] mx-auto right-0 pb-2">
      <button 
        onClick={() => onNavigate('MindDumpInputPage')}
        className={`flex flex-col items-center justify-center px-5 py-2 transition-transform duration-300 ease-out ${isInput ? 'text-[#0D9488]' : 'text-[#9CA3AF] hover:text-[#0D9488] active:scale-90'}`}
      >
        <span className="material-symbols-outlined text-[20px] mb-1" style={isInput ? { fontVariationSettings: "'FILL' 1" } : {}}>add_circle</span>
        <span className="font-sans text-[10px] font-medium">输入</span>
      </button>

      <button 
        onClick={() => onNavigate('TaskDashboardPage')}
        className={`flex flex-col items-center justify-center px-5 py-2 transition-transform duration-300 ease-out ${isDashboard ? 'text-[#0D9488]' : 'text-[#9CA3AF] hover:text-[#0D9488] active:scale-90'}`}
      >
        <span className="material-symbols-outlined text-[20px] mb-1" style={isDashboard ? { fontVariationSettings: "'FILL' 1" } : {}}>today</span>
        <span className="font-sans text-[10px] font-medium">今日</span>
      </button>

      <button 
        onClick={() => onNavigate('FocusTimerPage')}
        className={`flex flex-col items-center justify-center px-5 py-2 transition-transform duration-300 ease-out ${isFocus ? 'text-[#0D9488]' : 'text-[#9CA3AF] hover:text-[#0D9488] active:scale-90'}`}
      >
        <span className="material-symbols-outlined text-[20px] mb-1" style={isFocus ? { fontVariationSettings: "'FILL' 1" } : {}}>timelapse</span>
        <span className="font-sans text-[10px] font-medium">专注</span>
      </button>

      <button 
        onClick={() => onNavigate('ContinuityArchivePage')}
        className={`flex flex-col items-center justify-center px-5 py-2 transition-transform duration-300 ease-out ${isArchive ? 'text-[#0D9488]' : 'text-[#9CA3AF] hover:text-[#0D9488] active:scale-90'}`}
      >
        <span className="material-symbols-outlined text-[20px] mb-1" style={isArchive ? { fontVariationSettings: "'FILL' 1" } : {}}>archive</span>
        <span className="font-sans text-[10px] font-medium">档案</span>
      </button>
    </nav>
  );
}
