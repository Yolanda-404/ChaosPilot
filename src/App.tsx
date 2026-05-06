/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MindDumpInputPage } from './pages/MindDumpInputPage';
import { AIParseReviewPage } from './pages/AIParseReviewPage';
import { TaskDashboardPage } from './pages/TaskDashboardPage';
import { FocusTimerPage } from './pages/FocusTimerPage';
import { FocusReviewPage } from './pages/FocusReviewPage';
import { ContinuityArchivePage } from './pages/ContinuityArchivePage';
import { BottomNav } from './components/BottomNav';

type PageId = 
  | 'MindDumpInputPage'
  | 'AIParseReviewPage'
  | 'TaskDashboardPage'
  | 'FocusTimerPage'
  | 'FocusReviewPage'
  | 'ContinuityArchivePage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('MindDumpInputPage');

  const renderPage = () => {
    switch (currentPage) {
      case 'MindDumpInputPage':
        return <MindDumpInputPage onNext={() => setCurrentPage('AIParseReviewPage')} />;
      case 'AIParseReviewPage':
        return <AIParseReviewPage onNext={() => setCurrentPage('TaskDashboardPage')} onBack={() => setCurrentPage('MindDumpInputPage')} />;
      case 'TaskDashboardPage':
        return <TaskDashboardPage 
            onNext={() => setCurrentPage('FocusTimerPage')} 
            goArchive={() => setCurrentPage('ContinuityArchivePage')}
            goInput={() => setCurrentPage('MindDumpInputPage')}
        />;
      case 'FocusTimerPage':
        return <FocusTimerPage onNext={() => setCurrentPage('FocusReviewPage')} />;
      case 'FocusReviewPage':
        return <FocusReviewPage 
                 onNext={() => setCurrentPage('ContinuityArchivePage')} 
                 onBackToToday={() => setCurrentPage('TaskDashboardPage')}
                 onGoToArchive={() => setCurrentPage('ContinuityArchivePage')}
               />;
      case 'ContinuityArchivePage':
        return <ContinuityArchivePage 
                 onNext={() => setCurrentPage('FocusTimerPage')} 
                 onResumeDraft={() => setCurrentPage('FocusReviewPage')}
               />;
      default:
        return <MindDumpInputPage onNext={() => setCurrentPage('AIParseReviewPage')} />;
    }
  };

  // Hide BottomNav on FocusTimerPage to match original design constraints (from prompt UI)
  const showBottomNav = currentPage !== 'FocusTimerPage' && currentPage !== 'FocusReviewPage';

  return (
    <div className="min-h-[100dvh] bg-background w-full flex justify-center text-on-background relative overflow-hidden font-body-md selection:bg-primary-container selection:text-on-primary-container">
      {/* Top App Bar (Shared except Focus/Review where omitted) */}
      {currentPage !== 'FocusTimerPage' && currentPage !== 'FocusReviewPage' && currentPage !== 'AIParseReviewPage' && (
        <header className="fixed top-0 w-full max-w-[390px] mx-auto z-50 bg-white border-b border-gray-100 flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0D9488]">smart_toy</span>
            <span className="font-sans font-semibold tracking-tight text-lg text-gray-900">ChaosPilot</span>
          </div>
          <span className="material-symbols-outlined text-[#0D9488]">account_circle</span>
        </header>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full flex justify-center"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>

      {showBottomNav && (
        <BottomNav current={currentPage} onNavigate={setCurrentPage} />
      )}
    </div>
  );
}
