import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

export function ContinuityArchivePage({ onNext, onResumeDraft }: { onNext: () => void, onResumeDraft?: () => void }) {
  const { tasks, activeTaskId, reviewData, setActiveTaskId, updateTask, availableTime, setTasks } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'task' | 'calendar' | 'plan'>(() => {
    return (localStorage.getItem('chaos_archive_view_mode') as any) || 'task';
  });

  useEffect(() => {
    localStorage.setItem('chaos_archive_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
     if (localStorage.getItem('chaos_show_continuity_toast') === 'true') {
         setShowToast('接续记录已保存，任务已更新。');
         localStorage.removeItem('chaos_show_continuity_toast');
         setTimeout(() => setShowToast(''), 4000);
     }
  }, []);

  const [activeTab, setActiveTab] = useState('全部');
  const tabs = ['全部', '进行中', '本周截止', '长期计划', '已完成', '课程', '实习', '秋招', '社团', '论文'];
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [showToast, setShowToast] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  const archiveTasks = tasks.filter(t => t.isArchived || t.isConfirmed);
  const isMock = archiveTasks.length === 0;

  let displayTasks = archiveTasks;
  if (activeTab !== '全部') {
      const isStatusTab = ['进行中', '长期计划', '已完成'].includes(activeTab);
      const isDateTab = activeTab === '本周截止';
      if (isStatusTab) displayTasks = archiveTasks.filter(t => t.status === activeTab);
      else if (isDateTab) displayTasks = archiveTasks.filter(t => /(本周|周五|明|今)/.test(t.deadline));
      else displayTasks = archiveTasks.filter(t => t.type.includes(activeTab));
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Grouping
  const inProgress = displayTasks.filter(t => t.status !== '长期计划' && t.status !== '已完成');
  const longTerm = displayTasks.filter(t => t.status === '长期计划');
  const completed = displayTasks.filter(t => t.status === '已完成');

  let reviewNotice = null;
  if (!isMock && activeTaskId && reviewData) {
      const isStuck = /(不确定|不会|卡住|问负责人|找|等|确认)/.test(reviewData.next) || /(不确定|不会|卡住|问负责人|找|等|确认)/.test(reviewData.done);
      reviewNotice = {
          taskName: activeTask?.name || '未知任务',
          done: reviewData.done,
          next: reviewData.next,
          stuck: isStuck ? '还有一处信息需要确认，建议下次先处理这个卡点。' : '暂无明显卡点，下次可以继续推进当前步骤。',
          suggestion: availableTime 
             ? `建议下次用 ${availableTime} 分钟继续推进：“${reviewData.next.substring(0,10)}...”。` 
             : `建议用 25 分钟继续推进当前步骤。`
      };
  }

  const handleContinue = (id: string) => {
    setActiveTaskId(id);
    onNext();
  };

  const handleMarkDone = (id: string) => {
      updateTask(id, { 
          status: '已完成' as any, 
          handleMode: '已完成',
          priorityScore: -999,
          updatedAt: new Date().toLocaleString()
      });
      setSelectedTask(null);
  };

  const startEdit = (t: Task) => {
      setEditForm(t);
      setIsEditMode(true);
      setSelectedTask(null);
  };

  const saveEdit = () => {
      if (editForm.id) {
          updateTask(editForm.id, { ...editForm, updatedAt: new Date().toLocaleString() } as any);
      }
      setIsEditMode(false);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentDays = new Date(new Date().getFullYear(), currentMonth, 0).getDate();

  const handleGeneratePlan = () => {
      let updated = false;
      const plannedTasks = tasks.map(t => {
          if (t.status === '已完成') return t;
          updated = true;
          const isLongTerm = t.status === '长期计划' || t.handleMode === '长期计划';
          
          let calendarItems = t.calendarItems || [];
          if (calendarItems.length === 0) {
              const today = new Date().getDate();
              calendarItems = [
                  `${currentMonth} 月 ${today + 1} 日｜${t.todayGoal || '推进任务'}｜${t.estimatedTime || '25 分钟'}`,
                  `${currentMonth} 月 ${today + 2} 日｜继续推进｜${t.estimatedTime || '25 分钟'}`,
              ];
          }

          let weeklyPlan = t.weeklyPlan || [];
          if (weeklyPlan.length === 0) {
              if (isLongTerm) {
                  weeklyPlan = ['本周：基础资料梳理', '下周：进入核⼼部分', '第三周：总结与复盘'];
              } else {
                  weeklyPlan = ['本周：完成主要内容和交付目标'];
              }
          }

          return {
              ...t,
              calendarItems,
              weeklyPlan,
              monthlyGoal: t.monthlyGoal || (isLongTerm ? `本月目标：推进并完成 ${t.name} 的基础内容` : '完成交付'),
              planGeneratedAt: new Date().toLocaleString()
          };
      });

      if (updated) {
          setTasks(plannedTasks);
      }
      setShowToast('长期规划已更新，可在规划视图和日历视图查看。');
      setTimeout(() => setShowToast(''), 4000);
      setViewMode('plan');
  };

  const renderCard = (t: Task) => (
      <div key={t.id} onClick={() => setSelectedTask(t)} className="bg-surface rounded-[24px] p-5 shadow-sm border border-outline-variant/20 flex flex-col gap-4 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform">
         <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1 pr-6">
               <h4 className="font-headline-md text-[18px] font-bold text-on-background">{t.name}</h4>
               <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant mt-1.5">
                   <span className="bg-surface-container px-2 py-0.5 rounded-sm font-medium">{t.type}</span>
                   <span className={t.status === '已完成' ? 'text-primary' : ''}>{t.status}</span>
                   {t.reviewStatus === '草稿中' && <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded border border-tertiary/20">复盘草稿待补全</span>}
                   {t.deadline && <><span>·</span><span className={/本周|周五|明|今/.test(t.deadline) ? "text-error" : ""}>{t.deadline}</span></>}
               </div>
            </div>
         </div>

         {t.status !== '已完成' && (
             <div className="flex flex-col gap-2.5 bg-surface-container-lowest rounded-[16px] p-3 border border-outline-variant/10">
                <div className="flex items-start gap-2">
                   <span className="material-symbols-outlined text-[16px] text-outline mt-[2px]">done</span>
                   <div className="flex flex-col">
                      <span className="text-[11px] text-outline mb-0.5">上次做到</span>
                      <span className="text-[13px] text-on-surface line-clamp-2">{t.lastDone || '暂无记录'}</span>
                   </div>
                </div>
                <div className="w-full h-px bg-outline-variant/10"></div>
                <div className="flex items-start gap-2">
                   <span className="material-symbols-outlined text-[16px] text-primary mt-[2px]">forward</span>
                   <div className="flex flex-col">
                      <span className="text-[11px] text-primary mb-0.5 font-medium">下次继续</span>
                      <span className="text-[13px] text-on-surface">{t.nextStep || '未计划'}</span>
                   </div>
                </div>
             </div>
         )}
         
         <div className="flex items-center justify-between mt-1 pt-2 border-t border-outline-variant/10">
            <span className="text-[10px] text-outline">最近更新: {t.updatedAt || '刚刚'}</span>
            <div className="flex gap-2">
               <button onClick={(e) => { e.stopPropagation(); startEdit(t); }} className="px-3 py-1.5 rounded-full text-[12px] font-label-md text-outline hover:bg-surface-variant transition-colors border border-outline-variant/30">编辑</button>
               {t.status !== '已完成' && (
                 <button onClick={(e) => { e.stopPropagation(); handleContinue(t.id); }} className="px-4 py-1.5 rounded-[12px] text-[12px] font-label-md bg-primary text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-sm">从这里继续</button>
               )}
            </div>
         </div>
      </div>
  );

  return (
    <main className="w-full max-w-[390px] mx-auto min-h-[100dvh] bg-background relative overflow-x-hidden flex flex-col pt-[88px] pb-[110px]">
      
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-[8px] text-[13px] font-label-md z-50 whitespace-nowrap shadow-md">
          {showToast}
        </div>
      )}

      {reviewNotice && (
        <section className="px-margin-page mb-6 flex flex-col gap-4 mt-2">
           <div className="bg-surface rounded-[24px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-primary-container">
               <div className="bg-primary-container/30 px-4 py-3 flex items-center justify-between border-b border-primary/10">
                   <h3 className="font-label-md text-primary font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">psychology</span> 接续记忆已保存</h3>
                   <span className="text-[10px] text-primary/80 font-medium truncate max-w-[120px]">{reviewNotice.taskName}</span>
               </div>
               <div className="p-4 flex flex-col gap-3">
                   <div className="flex flex-col">
                       <span className="text-[11px] text-on-surface-variant mb-0.5 mt-[-2px]">今天做到</span>
                       <span className="text-[13px] text-on-surface bg-surface-container-low p-2 rounded-[8px]">{reviewNotice.done}</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[11px] text-primary mb-0.5 font-medium">下次继续</span>
                       <span className="text-[13px] text-primary bg-primary/5 p-2 rounded-[8px]">{reviewNotice.next}</span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[11px] text-orange-500 mb-0.5 font-medium">当前卡点</span>
                       <span className="text-[13px] text-on-surface">{reviewNotice.stuck}</span>
                   </div>
                   <div className="flex flex-col border-t border-outline-variant/20 pt-2 mt-1">
                       <span className="text-[11px] text-tertiary font-bold flex items-center gap-1 mb-1"><span className="material-symbols-outlined text-[14px]">lightbulb</span> 下次启动建议</span>
                       <span className="text-[13px] text-on-surface">{reviewNotice.suggestion}</span>
                   </div>
               </div>
           </div>
        </section>
      )}

      <section className="px-margin-page flex flex-col gap-1 mt-2 mb-4">
        <h2 className="font-headline-lg text-[22px] font-bold text-on-background">任务档案</h2>
        <p className="font-body-md text-on-surface-variant text-[13px]">所有任务的进度、计划和下次入口都在这里。</p>
      </section>

      <section className="px-margin-page mb-6">
         <div className="grid grid-cols-4 gap-2">
            <div className="bg-surface rounded-[16px] p-3 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
               <span className="font-label-sm text-outline uppercase tracking-wider text-[10px]">全部任务</span>
               <span className="font-headline-md font-bold text-on-background">{displayTasks.length}</span>
            </div>
            <div className="bg-surface rounded-[16px] p-3 border border-outline-variant/20 flex flex-col gap-1 shadow-sm overflow-hidden">
               <span className="font-label-sm text-outline uppercase tracking-wider text-[10px]">进行中</span>
               <span className="font-headline-md font-bold text-primary">{archiveTasks.filter(t => t.status !== '已完成' && t.status !== '长期计划').length}</span>
            </div>
            <div className="bg-surface rounded-[16px] p-3 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
               <span className="font-label-sm text-outline uppercase tracking-wider text-[10px]">长期计划</span>
               <span className="font-headline-md font-bold text-tertiary">{archiveTasks.filter(t => t.status === '长期计划').length}</span>
            </div>
            <div className="bg-surface rounded-[16px] p-3 border border-outline-variant/20 flex flex-col gap-1 shadow-sm">
               <span className="font-label-sm text-outline uppercase tracking-wider text-[10px]">已完成</span>
               <span className="font-headline-md font-bold text-on-surface-variant">{archiveTasks.filter(t => t.status === '已完成').length}</span>
            </div>
         </div>
      </section>

      <section className="px-margin-page mb-6 flex flex-col gap-3">
         <button onClick={handleGeneratePlan} className="w-full flex items-center justify-center gap-2 bg-secondary/10 text-secondary border border-secondary/20 py-3 rounded-[16px] font-label-md text-[14px] hover:bg-secondary/20 transition-colors">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>一键生成长期规划
         </button>
         
         <div className="bg-surface-container-low rounded-[16px] p-1 flex">
            {[
              { id: 'task', name: '任务视图', icon: 'list' },
              { id: 'calendar', name: '日历视图', icon: 'calendar_month' },
              { id: 'plan', name: '规划视图', icon: 'map' }
            ].map(tab => (
               <button 
                 key={tab.id} 
                 onClick={() => setViewMode(tab.id as any)}
                 className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] font-label-md text-[13px] transition-all duration-200 ${viewMode === tab.id ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
               >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{tab.name}
               </button>
            ))}
         </div>
      </section>

      {/* 视图内容区 */}
      <div className="flex-1">
          {viewMode === 'task' && (
              <>
                  <section className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-margin-page px-margin-page mb-6">
                    {tabs.map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full font-label-md text-[13px] border transition-colors ${activeTab === tab ? 'bg-on-background text-background border-on-background shadow-sm' : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </section>

                  <section className="px-margin-page flex flex-col gap-8">
                    {inProgress.length > 0 && (
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-2 pl-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              <h3 className="font-label-md font-bold text-on-background text-[15px]">本周要处理</h3>
                           </div>
                           <div className="flex flex-col gap-4">
                               {inProgress.map(renderCard)}
                           </div>
                        </div>
                    )}

                    {longTerm.length > 0 && (
                      <div className="flex flex-col gap-4 mt-2">
                         <div className="flex items-center gap-2 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            <h3 className="font-label-md font-bold text-on-background text-[15px]">长期计划</h3>
                         </div>
                         <div className="flex flex-col gap-4">
                            {longTerm.map(renderCard)}
                         </div>
                      </div>
                    )}

                    {completed.length > 0 && (
                      <div className="flex flex-col gap-4 mt-2 opacity-70">
                         <div className="flex items-center gap-2 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                            <h3 className="font-label-md font-bold text-on-surface-variant text-[15px]">已完成 / 历史记录</h3>
                         </div>
                         <div className="flex flex-col gap-4">
                            {completed.map(renderCard)}
                         </div>
                      </div>
                    )}
                  </section>
              </>
          )}

          {viewMode === 'calendar' && (
              <section className="px-margin-page pb-8">
                 <h3 className="font-headline-sm text-[16px] font-bold mb-4 ml-1">{currentMonth}月安排</h3>
                 <p className="text-[12px] text-outline mb-4">这是一个大致安排，不需要每天完全完成，你可以随时调整。</p>
                 
                 <div className="bg-surface rounded-[24px] p-5 shadow-sm border border-outline-variant/30 mb-6">
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['日','一','二','三','四','五','六'].map(d => <div key={d} className="text-[10px] text-outline">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 relative">
                        {Array.from({length: 31}).map((_, i) => {
                            const dateNum = i + 1;
                            if (dateNum > currentDays) return null;
                            const hasTask = archiveTasks.some(t => t.calendarItems?.some(ci => ci.includes(`${currentMonth} 月 ${dateNum} 日`)));
                            const isSelected = selectedDate === dateNum;
                            return (
                                <div 
                                  key={i} 
                                  onClick={() => setSelectedDate(dateNum)}
                                  className={`aspect-square w-full rounded flex flex-col items-center justify-center text-[11px] font-medium border cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary bg-primary/10' : (hasTask ? 'bg-surface-container border-outline-variant/20 hover:bg-surface-variant' : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:bg-surface-variant')}`}
                                >
                                    <span className={isSelected || hasTask ? 'text-on-background font-bold' : ''}>{dateNum}</span>
                                    {hasTask && <span className="w-1 h-1 rounded-full bg-primary mt-0.5"></span>}
                                </div>
                            );
                        })}
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <h3 className="font-headline-sm text-[16px] font-bold ml-1">{selectedDate} 日已安排任务</h3>
                    {(() => {
                        const tasksForSelectedDate = archiveTasks.flatMap(t => {
                            if (!t.calendarItems || t.calendarItems.length === 0) return [];
                            return t.calendarItems.map(ci => {
                                const match = ci.match(/(\d+\s*月\s*\d+\s*日)｜(.*)｜(.*)/);
                                if (!match) return null;
                                return {
                                    taskInfo: t,
                                    date: match[1],
                                    goal: match[2],
                                    est: match[3],
                                    full: ci
                                };
                            }).filter(Boolean);
                        }).filter(item => item?.date.includes(`${currentMonth} 月 ${selectedDate} 日`));

                        if (tasksForSelectedDate.length === 0) {
                            return (
                                <div className="text-center py-6 bg-surface-container-lowest rounded-[16px] border border-outline-variant/30 px-4">
                                    <p className="text-outline text-[13px] leading-relaxed">这天暂时没有安排任务，你可以从任务视图选择一个任务继续，或重新生成长期规划。</p>
                                </div>
                            );
                        }

                        return tasksForSelectedDate.map((item, idx) => item && (
                            <div key={idx} className="bg-surface rounded-[16px] p-4 shadow-sm border border-outline-variant/20 flex flex-col gap-2 relative">
                                <span className="absolute top-4 right-4 bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded">{item.taskInfo.type}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-[14px] text-on-background">{item.taskInfo.name}</span>
                                    <span className="text-[10px] text-primary">{item.taskInfo.status}</span>
                                </div>
                                <div className="bg-primary/5 rounded-[8px] p-2 border border-primary/10 mt-1">
                                    <span className="text-[11px] text-primary block font-medium">本次目标：</span>
                                    <span className="text-[13px] text-on-surface block mt-0.5">{item.goal}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[11px] text-outline">建议时间：{item.est}</span>
                                    <button onClick={() => handleContinue(item.taskInfo.id)} className="text-[11px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-[8px] hover:bg-primary/20 transition-colors">从这里继续</button>
                                </div>
                            </div>
                        ));
                    })()}
                 </div>
              </section>
          )}

          {viewMode === 'plan' && (
             <section className="px-margin-page pb-8 flex flex-col gap-6">
                <div className="bg-secondary/10 p-4 rounded-[16px] border border-secondary/20 text-secondary text-[12px] leading-relaxed relative">
                   <p className="font-bold mb-1">AI 调整建议</p>
                   本周临近截止任务较多，建议 SQL / RAG 学习等长期目标保持低频推进，不挤占社团策划和实习任务时间。
                </div>

                <div>
                   <h3 className="font-headline-sm text-[16px] font-bold mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-[20px]">target</span>本周重点</h3>
                   <div className="flex flex-col gap-4">
                      {archiveTasks.filter(t => t.weeklyPlan && t.weeklyPlan.length > 0 && t.status !== '已完成').slice(0, 3).map(t => (
                          <div key={t.id} className="bg-surface rounded-[24px] p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
                              <h4 className="font-bold text-[15px]">{t.name}</h4>
                              <div className="bg-surface-container-lowest rounded-[12px] p-3 border border-outline-variant/20">
                                  <ul className="list-disc pl-4 text-[13px] text-on-surface-variant flex flex-col gap-1">
                                      {t.weeklyPlan?.map((plan, idx) => <li key={idx}>{plan}</li>)}
                                  </ul>
                              </div>
                              <div className="flex flex-col gap-1 text-[12px] mt-1">
                                  <span className="text-orange-500"><span className="text-outline">当前卡点：</span>{t.blocker || '无'}</span>
                                  <span className="text-primary"><span className="text-outline">下次继续：</span>{t.nextStep}</span>
                              </div>
                          </div>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="font-headline-sm text-[16px] font-bold mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-tertiary text-[20px]">flag</span>本月目标与长期节奏</h3>
                   <div className="flex flex-col gap-3">
                      {archiveTasks.filter(t => t.monthlyGoal && t.status !== '已完成').map(t => (
                          <div key={t.id} className="bg-surface-container-low rounded-[16px] p-4 flex flex-col gap-1">
                              <span className="font-bold text-[14px]">{t.name}</span>
                              <span className="text-[12px] text-on-surface-variant break-words whitespace-pre-wrap">{t.monthlyGoal}</span>
                          </div>
                      ))}
                   </div>
                </div>
             </section>
          )}
      </div>

      {selectedTask && !isEditMode && (
          <>
             <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedTask(null)}></div>
             <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-background rounded-t-[32px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom" style={{ maxHeight: '90vh' }}>
                 <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto my-3"></div>
                 <div className="px-6 pb-6 overflow-y-auto">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-1 pr-6">
                            <h3 className="font-headline-md text-[22px] font-bold text-on-background leading-tight">{selectedTask.name}</h3>
                            <div className="flex flex-wrap gap-2 text-[11px] mt-1">
                                <span className="bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">{selectedTask.type}</span>
                                <span className="text-primary">{selectedTask.priority}</span>
                                <span className="text-on-surface-variant border border-outline-variant/20 px-2 py-0.5 rounded">{selectedTask.status}</span>
                                {selectedTask.deadline && <span className="px-2 py-0.5 border border-outline-variant/40 rounded text-outline">{selectedTask.deadline}</span>}
                            </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-5">
                         <div className="flex flex-col gap-3">
                             <h4 className="font-label-md font-bold text-on-background text-[13px] uppercase tracking-wider text-outline mb-1">当前进度</h4>
                             <div className="bg-surface rounded-[16px] p-4 border border-outline-variant/20 flex flex-col gap-3 shadow-sm">
                                 <div>
                                     <span className="text-[11px] text-outline block mb-0.5">上次做到</span>
                                     <span className="text-[13px] text-on-surface">{selectedTask.lastDone || '暂无记录'}</span>
                                 </div>
                                 <div className="w-full h-px bg-outline-variant/20"></div>
                                 <div>
                                     <span className="text-[11px] text-primary block mb-0.5 font-medium">下次继续</span>
                                     <span className="text-[13px] text-on-surface">{selectedTask.nextStep || '暂无计划'}</span>
                                 </div>
                                 <div className="w-full h-px bg-outline-variant/20"></div>
                                 <div>
                                     <span className="text-[11px] text-orange-500 block mb-0.5 font-medium">当前卡点</span>
                                     <span className="text-[13px] text-on-surface">{selectedTask.blocker || '无'}</span>
                                 </div>
                             </div>
                         </div>
                         
                         {selectedTask.planSuggestion && (
                             <div className="bg-tertiary-container/10 rounded-[16px] p-4 border border-tertiary-container/30">
                                 <span className="text-[11px] text-tertiary block mb-1 font-bold">AI 计划建议</span>
                                 <span className="text-[13px] text-on-surface leading-relaxed">{selectedTask.planSuggestion}</span>
                             </div>
                         )}

                         <div className="flex flex-col gap-3 mt-2">
                             <h4 className="font-label-md font-bold text-on-background text-[13px] uppercase tracking-wider text-outline mb-1">长期任务计划</h4>
                             <div className="bg-surface-container-lowest rounded-[16px] p-4 border border-outline-variant/20 shadow-sm">
                                <span className="text-[11px] font-bold text-primary block mb-1">本周计划</span>
                                <ul className="flex flex-col gap-1 mb-3 list-disc pl-4">
                                   {selectedTask.weeklyPlan?.length > 0 ? selectedTask.weeklyPlan.map((p, i) => (
                                     <li key={i} className="text-[13px] text-on-surface text-balance">{p}</li>
                                   )) : (
                                     <span className="text-[12px] text-outline italic">尚未生成，请一键生成长期规划</span>
                                   )}
                                </ul>
                                <span className="text-[11px] font-bold text-primary block mb-1">本月目标</span>
                                <span className="text-[13px] text-on-surface block leading-relaxed">{selectedTask.monthlyGoal || '暂无目标'}</span>
                             </div>
                         </div>

                         {selectedTask.calendarItems && selectedTask.calendarItems.length > 0 && (
                            <div className="flex flex-col gap-3 mt-2">
                                <h4 className="font-label-md font-bold text-on-background text-[13px] uppercase tracking-wider text-outline mb-1">日历安排</h4>
                                <div className="bg-surface-container-lowest rounded-[16px] p-4 border border-outline-variant/20 shadow-sm flex flex-col gap-2">
                                    {selectedTask.calendarItems.map((item, i) => (
                                        <div key={i} className="text-[12px] flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[14px] text-outline mt-[1px]">event</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                         {selectedTask.history && selectedTask.history.length > 0 && (
                           <div className="flex flex-col gap-3 mt-3">
                               <h4 className="font-label-md font-bold text-on-background text-[13px] uppercase tracking-wider text-outline mb-1">历史记录</h4>
                               <div className="flex flex-col gap-4 pl-2 pr-2">
                                  {selectedTask.history.map((h, idx) => (
                                      <div key={idx} className="flex gap-3 relative">
                                         {idx < selectedTask.history.length - 1 && <div className="absolute left-1.5 top-5 bottom-[-16px] w-[2px] bg-outline-variant/30"></div>}
                                         <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary shrink-0 mt-1"></div>
                                         <div className="flex flex-col">
                                            <span className="text-[10px] text-outline mb-0.5">{new Date(h.time).toLocaleString()}</span>
                                            <span className="text-[12px] font-bold text-on-background">{h.title}</span>
                                            <span className="text-[13px] text-on-surface-variant mt-0.5">{h.content}</span>
                                         </div>
                                      </div>
                                  ))}
                               </div>
                           </div>
                         )}

                         <div className="flex flex-col gap-3 mt-4">
                             {selectedTask.status !== '已完成' && <button onClick={() => { setSelectedTask(null); handleContinue(selectedTask.id); }} className="w-full py-3.5 rounded-[16px] bg-primary text-white font-label-md text-[15px] shadow-sm active:scale-[0.98] transition-transform">从这里继续</button>}
                             <div className="grid grid-cols-2 gap-2">
                                {selectedTask.reviewStatus === '草稿中' ? (
                                    <button onClick={() => { setSelectedTask(null); setActiveTaskId(selectedTask.id); onResumeDraft?.(); }} className="py-3.5 border border-tertiary/40 bg-tertiary/10 rounded-[16px] text-tertiary font-label-md text-[13px] hover:bg-tertiary/20 transition-colors shadow-sm">继续复盘草稿</button>
                                ) : (
                                    <button onClick={() => { setSelectedTask(null); handleGeneratePlan(); }} className="py-3.5 border border-outline-variant/40 rounded-[16px] text-on-surface-variant font-label-md text-[13px] hover:bg-surface-container transition-colors shadow-sm">重新生成计划</button>
                                )}
                                <button onClick={() => startEdit(selectedTask)} className="py-3.5 border border-outline-variant/40 rounded-[16px] text-on-surface-variant font-label-md text-[13px] hover:bg-surface-container transition-colors shadow-sm">编辑任务</button>
                             </div>
                             {selectedTask.status !== '已完成' && (
                                <button onClick={() => handleMarkDone(selectedTask.id)} className="py-3 border border-outline-variant/20 rounded-[16px] text-on-surface-variant font-label-md text-[13px] hover:bg-surface-container transition-colors">标记完成</button>
                             )}
                         </div>
                     </div>
                 </div>
             </div>
          </>
      )}

      {isEditMode && (
          <>
             <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsEditMode(false)}></div>
             <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-background rounded-t-[32px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom" style={{ maxHeight: '90vh' }}>
                 <div className="px-6 py-6 overflow-y-auto flex flex-col gap-4">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-headline-md text-[20px] font-bold text-on-background">编辑任务</h3>
                         <button onClick={() => setIsEditMode(false)} className="text-outline hover:text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1 col-span-2">
                             <label className="text-[11px] text-outline">任务名称</label>
                             <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-3 text-[14px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">类型</label>
                             <input type="text" value={editForm.type || ''} onChange={e => setEditForm({...editForm, type: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-3 text-[14px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">截止时间</label>
                             <input type="text" value={editForm.deadline || ''} onChange={e => setEditForm({...editForm, deadline: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-3 text-[14px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1 col-span-2">
                             <label className="text-[11px] text-outline">状态</label>
                             <select value={editForm.status || '待开始'} onChange={e => setEditForm({...editForm, status: e.target.value as any})} className="border border-outline-variant/50 rounded-[12px] p-3 text-[14px] bg-surface-container-lowest">
                                 <option value="待开始">待开始</option>
                                 <option value="进行中">进行中</option>
                                 <option value="长期计划">长期计划</option>
                                 <option value="已完成">已完成</option>
                             </select>
                         </div>
                     </div>

                     <div className="w-full h-px bg-outline-variant/20 my-1"></div>

                     <div className="flex flex-col gap-3">
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">上次做到</label>
                             <textarea value={editForm.lastDone || ''} onChange={e => setEditForm({...editForm, lastDone: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[50px] text-[13px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">下次继续</label>
                             <textarea value={editForm.nextStep || ''} onChange={e => setEditForm({...editForm, nextStep: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[50px] text-[13px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">当前卡点</label>
                             <textarea value={editForm.blocker || ''} onChange={e => setEditForm({...editForm, blocker: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[50px] text-[13px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">计划建议</label>
                             <textarea value={editForm.planSuggestion || ''} onChange={e => setEditForm({...editForm, planSuggestion: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[50px] text-[13px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">本周计划 (每行一项)</label>
                             <textarea value={editForm.weeklyPlan?.join('\n') || ''} onChange={e => setEditForm({...editForm, weeklyPlan: e.target.value.split('\n').filter(Boolean)})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[70px] text-[13px] bg-surface-container-lowest whitespace-pre-wrap" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">本月目标</label>
                             <textarea value={editForm.monthlyGoal || ''} onChange={e => setEditForm({...editForm, monthlyGoal: e.target.value})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[50px] text-[13px] bg-surface-container-lowest" />
                         </div>
                         <div className="flex flex-col gap-1">
                             <label className="text-[11px] text-outline">日历安排 (每行一项)</label>
                             <textarea value={editForm.calendarItems?.join('\n') || ''} onChange={e => setEditForm({...editForm, calendarItems: e.target.value.split('\n').filter(Boolean)})} className="border border-outline-variant/50 rounded-[12px] p-2 min-h-[70px] text-[13px] bg-surface-container-lowest whitespace-pre-wrap" />
                         </div>
                     </div>

                     <button onClick={saveEdit} className="w-full py-4 mt-2 bg-primary text-white rounded-[16px] font-bold text-[15px] shadow-sm active:scale-[0.98]">保存修改</button>
                 </div>
             </div>
          </>
      )}

    </main>
  );
}
