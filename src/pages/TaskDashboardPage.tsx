import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

export function TaskDashboardPage({ onNext, goArchive, goInput }: { onNext: () => void, goArchive: () => void, goInput: () => void }) {
  const { energyScore, availableTime, tasks, setActiveTaskId } = useAppContext();
  const [showToast, setShowToast] = useState('');

  useEffect(() => {
     if (localStorage.getItem('chaos_show_plan_toast') === 'true') {
         setShowToast('已更新今日行动和长期计划。长期安排可在档案页查看。');
         localStorage.removeItem('chaos_show_plan_toast');
         setTimeout(() => setShowToast(''), 4000);
     }
     if (localStorage.getItem('chaos_show_draft_notice') === 'true') {
         setShowToast('复盘草稿已保存，之后可在档案补全。');
         localStorage.removeItem('chaos_show_draft_notice');
         setTimeout(() => setShowToast(''), 4000);
     }
  }, []);
  
  if (tasks.length === 0) {
    return (
      <main className="w-full max-w-[390px] mx-auto min-h-[100dvh] pt-[88px] px-margin-page pb-[100px] flex flex-col items-center justify-center relative bg-background">
        <div className="w-20 h-20 rounded-[24px] bg-secondary-container flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-[32px] text-primary">inbox</span>
        </div>
        <h2 className="font-headline-lg text-[20px] font-bold text-on-background mb-3 text-center">今日还没有可安排的任务</h2>
        <p className="font-body-md text-[14px] text-on-surface-variant text-center max-w-[85%] mb-8 leading-relaxed">
          先把资料、任务或脑子里的混乱内容倒进来，我会帮你整理成今日行动队列。
        </p>
        <button onClick={goInput} className="w-full py-4 rounded-[16px] shadow-sm active:scale-95 transition-transform duration-200 flex items-center justify-center gap-2 bg-primary text-white font-label-md text-[14px]">
          <span className="material-symbols-outlined text-lg">add</span>
          去输入一段
        </button>
      </main>
    );
  }

  const todayTasks = tasks.filter(t => t.isConfirmed && !t.isLater && t.status !== '已完成' && t.handleMode !== '稍后处理' && t.handleMode !== '长期计划');
  
  if (todayTasks.length === 0) {
      return (
          <main className="w-full max-w-[390px] mx-auto min-h-[100dvh] pt-[88px] px-margin-page pb-[100px] flex flex-col items-center justify-center relative bg-background">
            <div className="w-20 h-20 rounded-[24px] bg-tertiary-container flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-[32px] text-tertiary">inventory_2</span>
            </div>
            <h2 className="font-headline-lg text-[20px] font-bold text-on-background mb-3 text-center">暂无今日行动任务</h2>
            <p className="font-body-md text-[14px] text-on-surface-variant text-center max-w-[85%] mb-8 leading-relaxed">
              当前任务都在稍后处理或长期计划中，你可以从档案里选择一个继续。
            </p>
            <button onClick={goArchive} className="w-full py-4 rounded-[16px] shadow-sm active:scale-95 transition-transform duration-200 flex items-center justify-center gap-2 bg-primary text-white font-label-md text-[14px]">
              查看任务档案
            </button>
          </main>
        );
  }

  const getPriorityRank = (task: Task) => {
    if (task.status === '已完成') return -999;
    if (task.isLater || task.handleMode === '稍后处理') return -100;
    if (task.handleMode === '长期计划') return -60;
    return task.priorityScore || 0;
  };

  const sortedTasks = [...todayTasks].sort((a, b) => getPriorityRank(b) - getPriorityRank(a));
  const topTask = sortedTasks[0];
  const queueTasks = sortedTasks.slice(1);

  const startFocus = () => {
    setActiveTaskId(topTask.id);
    onNext();
  };

  return (
    <main className="w-full max-w-[390px] mx-auto min-h-[100dvh] pt-[88px] px-margin-page pb-[110px] flex flex-col gap-[24px] overflow-x-hidden relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-[8px] text-[13px] font-label-md z-50 whitespace-nowrap shadow-md">
          {showToast}
        </div>
      )}

      {/* 1. 顶部显示今日可用能量和可用时间 */}
      <section className="flex flex-col gap-[16px] pt-4">
        <div className="flex items-center justify-between">
           <h2 className="font-headline-lg text-headline-lg text-on-background">今日行动</h2>
           <span className="px-3 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface-variant border border-outline-variant/20">优先推进一个任务</span>
        </div>
        
        <div className="bg-surface rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">battery_charging_20</span>
             </div>
             <div className="flex flex-col">
               <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mb-[2px]">今日可用能量</span>
               <span className="font-label-md text-[15px] text-on-background font-semibold">{energyScore}<span className="text-outline text-[12px] font-normal"> / 100</span></span>
             </div>
          </div>
          <div className="w-px h-8 bg-outline-variant/30"></div>
          <div className="flex items-center gap-3 pr-2">
             <div className="flex flex-col items-end">
               <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider mb-[2px]">可用时间</span>
               <span className="font-label-md text-[15px] text-primary font-semibold">{availableTime} 分钟</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
             </div>
          </div>
        </div>
      </section>

      {/* 2. 今日行动建议卡 */}
      {topTask && (
        <section className="bg-surface-container-lowest rounded-[24px] p-5 border border-primary-container shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/20 rounded-bl-[100px] pointer-events-none"></div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
              <span className="font-label-md text-[13px] text-primary uppercase tracking-wide font-bold">今日建议先做</span>
            </div>
            <h3 className="font-headline-md text-[20px] font-bold text-on-background mb-4">{topTask.name}</h3>
            
            <div className="flex flex-col gap-3 mb-6 relative z-10">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-outline text-[18px] mt-[2px]">info</span>
                <div className="flex flex-col">
                   <span className="font-label-sm text-[12px] text-on-surface-variant mb-1">原因</span>
                   <p className="font-body-md text-[14px] text-on-surface leading-relaxed">
                     {topTask.deadline && topTask.deadline !== '待确认' ? `${topTask.deadline}截止，` : ''}适合用 {availableTime} 分钟推进。
                   </p>
                </div>
              </div>
              <div className="w-full h-px bg-outline-variant/20 my-1"></div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary text-[18px] mt-[2px]">flag</span>
                <div className="flex flex-col flex-1">
                   <span className="font-label-sm text-[12px] text-tertiary mb-1 font-medium">本次一步</span>
                   <p className="font-body-md text-[14px] text-on-surface bg-tertiary-container/20 p-2.5 rounded-[12px] leading-relaxed border border-tertiary-container/40">{topTask.nextStep}</p>
                </div>
              </div>
            </div>
            
            <button
               onClick={startFocus}
               className="w-full text-white rounded-[16px] py-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all bg-primary font-label-md shadow-sm relative z-10"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              <span className="text-[14px]">进入 {availableTime} 分钟小专注</span>
            </button>
        </section>
      )}

      {/* 3. 当前行动队列 */}
      <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1 pl-1">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">format_list_bulleted</span>
              <h3 className="font-label-md text-on-background font-bold text-[15px]">当前行动队列</h3>
          </div>

          <div className="flex flex-col gap-3">
              {queueTasks.map((task, idx) => {
                const isUrgent = task.priorityScore >= 35;
                const isLongTerm = task.priorityScore < 10;

                return (
                  <div key={task.id} className={`bg-surface rounded-[20px] p-4 shadow-sm border border-outline-variant/20 relative overflow-hidden flex items-center gap-3 ${isLongTerm ? 'opacity-60 grayscale-[50%]' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUrgent ? 'bg-tertiary-container/30 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                         <span className="material-symbols-outlined text-[20px]">{isLongTerm ? 'menu_book' : (isUrgent ? 'work' : 'school')}</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                              <h4 className="font-body-md font-medium text-on-background truncate">{task.name}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                              {!isLongTerm && (
                                <span className={`flex items-center gap-1 ${isUrgent ? 'text-orange-500' : 'text-blue-500'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-orange-500' : 'bg-blue-500'}`}></span> {task.priority}
                                </span>
                              )}
                              {task.deadline && task.deadline !== '待确认' && (
                                <>
                                  <span>·</span>
                                  <span>{task.deadline}</span>
                                </>
                              )}
                          </div>
                      </div>
                  </div>
                )
              })}
              {queueTasks.length === 0 && (
                 <p className="text-center text-outline text-[12px] py-4">队列没有其余任务了</p>
              )}
          </div>
      </section>
    </main>
  );
}
