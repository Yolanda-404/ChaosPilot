import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ReviewDraft } from '../types';

export function FocusReviewPage({ 
  onNext, 
  onBackToToday, 
  onGoToArchive 
}: { 
  onNext: () => void, 
  onBackToToday: () => void,
  onGoToArchive: () => void
}) {
  const { setReviewData, tasks, activeTaskId, updateTask } = useAppContext();
  
  const [done, setDone] = useState('');
  const [next, setNext] = useState('');
  const [feeling, setFeeling] = useState('');
  
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Load draft if exists
  useEffect(() => {
    const t = tasks.find(t => t.id === activeTaskId);
    if (!t) return;
    
    if (t.reviewDraftId) {
        // Find draft
        try {
            const draftsStr = localStorage.getItem('chaos_review_drafts') || '[]';
            const drafts: ReviewDraft[] = JSON.parse(draftsStr);
            const draft = drafts.find(d => d.id === t.reviewDraftId);
            if (draft) {
                setDone(draft.doneText || '');
                setNext(draft.nextText || '');
                setFeeling(draft.feeling || '');
                setIsDraftSaved(true);
            }
        } catch (e) {}
    } else {
        setDone(`推进了“${t.name}”的工作。`);
        setNext(t.nextStep || '');
    }
  }, [activeTaskId, tasks]);

  const hasUnsavedChanges = !isDraftSaved && (done !== '' || next !== '' || feeling !== '');

  const saveDraft = () => {
    const t = tasks.find(t => t.id === activeTaskId);
    if (!activeTaskId || !t) return;
    
    const draftId = t.reviewDraftId || `draft_${Date.now()}`;
    const draft: ReviewDraft = {
        id: draftId,
        taskId: activeTaskId,
        taskName: t.name,
        doneText: done,
        nextText: next,
        feeling: feeling,
        status: "草稿中",
        createdAt: t.reviewDraftId ? (t.lastReviewAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        const draftsStr = localStorage.getItem('chaos_review_drafts') || '[]';
        const drafts: ReviewDraft[] = JSON.parse(draftsStr);
        const newDrafts = drafts.filter(d => d.id !== draftId);
        newDrafts.push(draft);
        localStorage.setItem('chaos_review_drafts', JSON.stringify(newDrafts));
    } catch (e) {}

    updateTask(activeTaskId, {
        reviewStatus: "草稿中",
        reviewDraftId: draftId,
        lastReviewAt: draft.updatedAt
    });
    
    setIsDraftSaved(true);
  };

  const handleSaveDraftClick = () => {
      saveDraft();
  };

  const handleCreateMemory = () => {
    const t = tasks.find(x => x.id === activeTaskId);
    const finalDone = done || '这次推进了一些工作。';
    const finalNext = next || '继续推进当前步骤。';

    setReviewData({ done: finalDone, next: finalNext, feeling });
    
    if (activeTaskId && t) {
        updateTask(activeTaskId, {
            lastDone: finalDone,
            nextStep: finalNext,
            blocker: feeling, // Just a simple mapping or we extract blocker from feeling/next later
            feeling: feeling,
            reviewStatus: "已生成接续记录",
            reviewDraftId: null,
            history: [
                ...(t.history || []),
                { time: new Date().toISOString(), title: '接续记忆', content: `【做到哪了】${finalDone}\n【下次继续】${finalNext}` }
            ],
            updatedAt: new Date().toLocaleString()
        });
        
        // Remove draft if existed
        if (t.reviewDraftId) {
            try {
                const draftsStr = localStorage.getItem('chaos_review_drafts') || '[]';
                const drafts: ReviewDraft[] = JSON.parse(draftsStr);
                const newDrafts = drafts.filter(d => d.id !== t.reviewDraftId);
                localStorage.setItem('chaos_review_drafts', JSON.stringify(newDrafts));
            } catch (e) {}
        }
    }

    // Pass standard localStorage tag for ContinuityArchivePage to show toast
    localStorage.setItem('chaos_show_continuity_toast', 'true');
    onNext();
  };

  const handleBack = () => {
      if (hasUnsavedChanges) {
          setShowExitConfirm(true);
      } else {
          onBackToToday();
      }
  };

  return (
    <main className="w-full max-w-[390px] mx-auto min-h-[100dvh] pt-[60px] pb-[160px] flex flex-col gap-4 bg-background text-left relative overflow-hidden">
      
      {/* Top App Bar inside FocusReviewPage to handle custom back logic */}
      <header className="fixed top-0 w-full max-w-[390px] mx-auto z-50 bg-background/80 backdrop-blur-md flex justify-between items-center px-4 py-3">
        <button onClick={handleBack} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-label-md font-bold text-on-background">复盘与接续</span>
        <div className="w-10"></div>
      </header>

      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-tertiary-container/30 rounded-full blur-[80px] pointer-events-none"></div>

      <section className="flex flex-col gap-1 relative z-10 pt-4 px-margin-page">
         <h1 className="font-headline-lg text-[24px] font-bold text-on-background tracking-tight">已经完成一个小步骤</h1>
         <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">简单记一下进展，下次就不用重新想从哪里开始。</p>
      </section>

      <section className="flex flex-col gap-5 relative z-10 w-full mt-4 px-margin-page">
         <div className="flex flex-col gap-2">
             <label className="font-label-md text-[12px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
                 <span className="material-symbols-outlined text-[16px]">done_all</span>
                 刚刚做到哪了？
             </label>
             <textarea 
               value={done}
               onChange={e => { setDone(e.target.value); setIsDraftSaved(false); }}
               className="w-full bg-surface border border-outline-variant/30 rounded-[16px] p-3.5 font-body-md text-[14px] text-on-background shadow-sm focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder-outline-variant h-[80px]" 
               placeholder="例如：已经列出了活动策划的三个部分..."
             ></textarea>
         </div>

         <div className="flex flex-col gap-2">
             <label className="font-label-md text-[12px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
                 <span className="material-symbols-outlined text-[16px]">forward</span>
                 下次从哪里继续？
             </label>
             <textarea 
               value={next}
               onChange={e => { setNext(e.target.value); setIsDraftSaved(false); }}
               className="w-full bg-surface border border-outline-variant/30 rounded-[16px] p-3.5 font-body-md text-[14px] text-on-background shadow-sm focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder-outline-variant h-[80px]" 
               placeholder="例如：先补活动流程，再问负责人确认物料..."
             ></textarea>
         </div>
         
         <div className="flex flex-col gap-2">
             <label className="font-label-md text-[12px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5 text-orange-500">
                 <span className="material-symbols-outlined text-[16px]">mood</span>
                 现在的感觉或卡点（选填）
             </label>
             <textarea 
               value={feeling}
               onChange={e => { setFeeling(e.target.value); setIsDraftSaved(false); }}
               className="w-full bg-surface border border-outline-variant/30 rounded-[16px] p-3.5 font-body-md text-[14px] text-on-background shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none placeholder-outline-variant h-[60px]" 
               placeholder="遇到困难了吗？写下来，AI 下次给你建议"
             ></textarea>
         </div>
      </section>

      {/* Bottom Action Area */}
      {isDraftSaved ? (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pb-8 pt-6 px-margin-page z-50 flex flex-col gap-2 items-center animate-in slide-in-from-bottom">
            <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-full text-[12px] font-label-md flex items-center justify-center gap-2 mb-2 w-full max-w-[390px] mx-auto shadow-sm">
                <span className="material-symbols-outlined text-[16px]">save</span>
                草稿已保存，可之后继续补全
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full max-w-[390px] mx-auto">
                <button 
                  onClick={() => setIsDraftSaved(false)}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded-[16px] py-3 font-label-md text-[14px] shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all"
                >
                  继续完善
                </button>
                <button 
                  onClick={() => {
                      localStorage.setItem('chaos_show_draft_notice', 'true');
                      onBackToToday();
                  }}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded-[16px] py-3 font-label-md text-[14px] shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all"
                >
                  返回今日
                </button>
            </div>
            <button 
               onClick={onGoToArchive}
               className="w-full max-w-[390px] mx-auto bg-transparent text-primary py-3 font-label-md text-[13px] hover:bg-primary/5 rounded-[16px] transition-colors mt-1"
            >
               去档案页查看
            </button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pb-8 pt-12 px-margin-page z-50 flex flex-col gap-3">
          <button 
            onClick={handleCreateMemory}
            className="w-full max-w-[390px] mx-auto bg-primary text-white rounded-[16px] py-4 font-label-md text-[15px] shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">memory</span>
            生成接续记录
          </button>
          <button 
            onClick={handleSaveDraftClick}
            className="w-full max-w-[390px] mx-auto bg-transparent border border-outline-variant/50 text-on-surface-variant rounded-[16px] py-3 font-label-md text-[14px] font-medium hover:bg-surface-container active:bg-surface-variant transition-colors"
          >
              保存草稿
          </button>
        </div>
      )}

      {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
             <div className="bg-surface rounded-[24px] p-6 w-[85%] max-w-[340px] flex flex-col gap-4 shadow-xl">
                 <h3 className="font-headline-sm text-[18px] font-bold text-on-background">未保存提示</h3>
                 <p className="text-[14px] text-on-surface-variant">你有未保存的复盘内容，要如何处理？</p>
                 <div className="flex flex-col gap-2 mt-2">
                     <button onClick={() => { saveDraft(); localStorage.setItem('chaos_show_draft_notice', 'true'); onBackToToday(); }} className="w-full bg-primary text-white py-3 rounded-[12px] font-bold text-[14px]">保存草稿并离开</button>
                     <button onClick={() => onBackToToday()} className="w-full bg-error/10 text-error py-3 rounded-[12px] font-bold text-[14px] hover:bg-error/20">不保存直接离开</button>
                     <button onClick={() => setShowExitConfirm(false)} className="w-full bg-surface text-on-surface border border-outline-variant/30 py-3 rounded-[12px] font-bold text-[14px]">继续填写</button>
                 </div>
             </div>
          </div>
      )}
    </main>
  );
}
