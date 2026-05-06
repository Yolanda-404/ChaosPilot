import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';

export function AIParseReviewPage({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { tasks, updateTask, setTasks } = useAppContext();
  const [showToast, setShowToast] = useState('');

  // We consider all unarchived user tasks as the parsed list for this session
  const parsedTasks = tasks.filter(t => !t.isArchived && t.source === 'user').sort((a, b) => b.priorityScore - a.priorityScore);

  const [editTask, setEditTask] = useState<any>(null); // Quick edit state

  // Generate mock AI planning recommendations for new tasks
  useEffect(() => {
     let updated = false;
     const newTasks = tasks.map((t) => {
         if (t.source === 'user' && !t.isArchived && !t.recommendReason) {
             updated = true;
             const isLongTerm = /(秋招|考试|学习|论文|复习)/.test(t.type) || t.priority === '长期计划';
             return {
                 ...t,
                 recommendReason: isLongTerm ? '没有明确截止时间，适合作为长期计划。' : '根据任务类型和截止时间，建议今日优先推进。',
                 todayGoal: isLongTerm ? '' : `列出 ${t.name} 的初版结构或关键点`,
                 estimatedTime: isLongTerm ? '' : '25 分钟',
                 handleMode: isLongTerm ? '长期计划' : '今日行动',
                 planAction: '新建计划',
                 weeklyPlan: isLongTerm ? ['本周：完成初步资料收集和基础梳理', '下周：深入核心细节', '第三周：总结与复盘'] : [],
                 monthlyGoal: isLongTerm ? `本月目标：推进并完成 ${t.name} 的基础内容` : '',
                 isLater: isLongTerm
             };
         }
         return t;
     });
     if (updated) {
         setTasks(newTasks as any);
     }
  }, [tasks, setTasks]);

  const toggleStash = (id: string, currentlyStashed: boolean) => {
      const t = tasks.find(x => x.id === id);
      if (!t) return;
      
      const isLongTerm = /(秋招|外语|学习|论文)/.test(t.type) || t.priority === '长期计划';
      
      if (!currentlyStashed) {
          updateTask(id, { 
              isConfirmed: true,
              isLater: true, 
              handleMode: '稍后处理',
          });
      } else {
          updateTask(id, { 
              isConfirmed: true,
              isLater: false, 
              handleMode: isLongTerm ? '长期计划' : '今日行动',
          });
      }
  };

  const confirmTaskSingle = (id: string) => {
      updateTask(id, {
          isConfirmed: true,
          isLater: false,
          handleMode: '今日行动'
      });
  };

  const deleteTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
  };

  const handleFinish = () => {
      if (parsedTasks.length === 0) {
          setShowToast('还没有可更新的任务，请先输入内容。');
          setTimeout(() => setShowToast(''), 3000);
          return;
      }
      
      parsedTasks.forEach(t => {
          const isStashed = t.isLater || t.handleMode === '稍后处理';
          const isLongTerm = t.handleMode === '长期计划' || (/(秋招|外语|学习|论文)/.test(t.type) && !/(本周|今|明)/.test(t.deadline));

          updateTask(t.id, {
              isConfirmed: true,
              isArchived: true,
              updatedAt: new Date().toLocaleString(),
              handleMode: isStashed ? '稍后处理' : (isLongTerm ? '长期计划' : '今日行动'),
              isLater: isStashed || isLongTerm,
              status: isStashed ? (t.status || '待开始') : (isLongTerm ? '长期计划' : (t.status || '待开始'))
          });
      });
      
      localStorage.setItem('chaos_show_plan_toast', 'true');
      onNext();
  };

  const handleBack = () => {
      setTasks(tasks.filter(t => t.isConfirmed || t.source !== 'user'));
      onBack();
  };

  const todayActionTasks = parsedTasks.filter(t => t.isConfirmed && !t.isLater && t.handleMode === '今日行动');
  const longTermTasks = parsedTasks.filter(t => t.handleMode === '长期计划' || t.planAction === '新建计划' || t.planAction === '更新计划');

  return (
    <main className="w-full max-w-[390px] min-h-[100dvh] bg-background relative overflow-hidden flex flex-col mx-auto">
      {showToast && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-[8px] text-[13px] font-label-md z-50 whitespace-nowrap shadow-md">
          {showToast}
        </div>
      )}

      <header className="flex items-center justify-between px-margin-page pt-[48px] pb-stack-sm w-full bg-background z-20">
        <button
          onClick={handleBack}
          aria-label="返回"
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto pb-[180px] px-margin-page hide-scrollbar">
        <h1 className="font-headline-lg text-[24px] font-bold text-on-background mt-2 leading-tight">
          AI 解析与规划确认
        </h1>
        <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed mt-2 mb-6">
          我先帮你整理出了这些任务，并给出一个可调整的安排。你可以确认、修改或稍后处理。
        </p>

        <section className="mb-8">
            <h2 className="font-headline-sm text-[16px] font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">task</span>
                第一部分：识别到的任务
            </h2>
            
            <div className="flex flex-col gap-4">
               {parsedTasks.length === 0 && (
                  <div className="text-center py-6 bg-surface-container-lowest rounded-[16px] border border-outline-variant/30">
                    <p className="text-outline text-[13px]">暂无可确认的任务。</p>
                  </div>
               )}

               {parsedTasks.map((t) => {
                 const isStashed = t.isLater || t.handleMode === '稍后处理';
                 
                 return (
                   <article key={t.id} className={`bg-surface rounded-[24px] p-5 shadow-sm border ${isStashed ? 'border-outline-variant/20 opacity-70' : (t.isConfirmed ? 'border-primary/40' : 'border-outline-variant/40')} flex flex-col gap-3 transition-all relative overflow-hidden`}>
                      <div className="flex justify-between items-start">
                          <h3 className="font-headline-md text-[18px] font-bold text-on-background pr-2">{t.name}</h3>
                          {t.isConfirmed && (
                              <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                          )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-1">
                        {t.deadline && <span className="px-2 py-0.5 bg-error-container text-on-error-container font-label-md text-[10px] rounded-sm font-medium">{t.deadline}</span>}
                        <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant font-label-md text-[10px] rounded-sm">{t.type}</span>
                        <span className="px-2 py-0.5 bg-surface-variant text-on-surface-variant font-label-md text-[10px] rounded-sm">{t.handleMode || t.priority}</span>
                      </div>

                      <div className="bg-surface-container-lowest rounded-[12px] p-3 border border-outline-variant/20 flex flex-col gap-2">
                           <div className="flex gap-2 items-start opacity-80">
                              <span className="material-symbols-outlined text-outline text-[16px] shrink-0 mt-[2px]">chat_bubble</span>
                              <p className="font-label-md text-[13px] text-on-surface-variant"><span className="text-[11px] font-normal text-outline">卡点：</span>{t.blocker || '无'}</p>
                           </div>
                           <div className="w-full h-px bg-outline-variant/20"></div>
                           <div className="flex gap-2 items-start">
                              <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-[2px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                              <p className="font-label-md text-[13px] text-on-surface"><span className="text-[11px] font-normal text-primary">建议：</span>{t.nextStep}</p>
                           </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant/10">
                        <button onClick={() => setEditTask(t)} className="font-label-md text-[12px] text-outline px-3 py-1.5 rounded-full hover:bg-surface-container transition-colors">编辑</button>
                        <button onClick={() => deleteTask(t.id)} className="font-label-md text-[12px] text-error px-3 py-1.5 rounded-full hover:bg-error-container/50 transition-colors">删除</button>
                        {isStashed ? (
                             <button onClick={() => toggleStash(t.id, true)} className="font-label-md text-[12px] text-primary px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors border border-primary/20">恢复今日行动</button>
                        ) : (
                             <button onClick={() => toggleStash(t.id, false)} className="font-label-md text-[12px] text-outline px-3 py-1.5 rounded-full hover:bg-surface-container transition-colors">稍后处理</button>
                        )}
                        {!t.isConfirmed && !isStashed && (
                             <button onClick={() => confirmTaskSingle(t.id)} className="font-label-md text-[12px] bg-primary text-white px-5 py-1.5 rounded-[12px] shadow-sm hover:opacity-90 transition-opacity">确认</button>
                        )}
                      </div>
                   </article>
                 );
               })}
            </div>
        </section>

        <section className="mb-8">
            <h2 className="font-headline-sm text-[16px] font-bold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">magic_button</span>
                第二部分：AI 规划推荐
            </h2>

            <div className="bg-surface rounded-[24px] p-5 shadow-sm border border-outline-variant/30 mb-4">
                <h3 className="font-label-lg text-[14px] font-bold text-primary mb-3">模块 A：今日行动排序</h3>
                <p className="text-[12px] text-outline mb-4">已确认且适合今日行动的任务</p>
                <div className="flex flex-col gap-3">
                    {todayActionTasks.length === 0 ? (
                        <p className="text-[12px] text-outline italic text-center py-4">暂无加入今日行动的任务，请先在上方确认任务。</p>
                    ) : (
                        todayActionTasks.map((t, idx) => (
                            <div key={t.id} className="bg-surface-container-lowest p-3 rounded-[12px] border border-outline-variant/20">
                               <div className="flex justify-between items-start mb-2">
                                  <div className="font-label-md text-[13px] font-bold text-on-surface flex items-center gap-2">
                                     <span className="bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded-full text-[10px]">{idx + 1}</span>
                                     {t.name}
                                  </div>
                                  <label className="flex items-center gap-1 text-[11px] text-outline">
                                      <input type="checkbox" checked={t.handleMode === '今日行动'} onChange={() => toggleStash(t.id, false)} className="accent-primary" /> 加入今日
                                  </label>
                               </div>
                               <div className="flex flex-col gap-1 mt-2 text-[12px]">
                                  <p><span className="text-outline">推荐处理：</span>{t.handleMode}</p>
                                  <p><span className="text-outline">原因：</span>{t.recommendReason}</p>
                                  <p><span className="text-outline">本次目标：</span>{t.todayGoal}</p>
                                  <p><span className="text-outline">预计时间：</span>{t.estimatedTime}</p>
                               </div>
                               <button onClick={() => setEditTask(t)} className="text-[11px] text-primary mt-2">编辑推荐</button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-[24px] p-5 shadow-sm border border-outline-variant/30">
                <h3 className="font-label-lg text-[14px] font-bold text-tertiary mb-3">模块 B：长期计划建议</h3>
                <p className="text-[12px] text-outline mb-4">无需今日紧急完成的长期或复习任务</p>
                <div className="flex flex-col gap-3">
                    {longTermTasks.length === 0 ? (
                        <p className="text-[12px] text-outline italic text-center py-4">无相关建议</p>
                    ) : (
                        longTermTasks.map((t) => (
                            <div key={t.id} className="bg-surface-container-lowest p-3 rounded-[12px] border border-outline-variant/20">
                               <div className="flex flex-col gap-2 text-[12px]">
                                  <div className="font-label-md text-[13px] font-bold text-on-surface flex items-center justify-between">
                                     <span>{t.planAction === '更新计划' ? '更新已有计划：' : '新建长期计划：'}{t.name}</span>
                                     <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-sm text-[10px]">{t.handleMode}</span>
                                  </div>
                                  <p className="mt-1"><span className="text-outline">AI 判断：</span>{t.recommendReason}</p>
                                  <div className="bg-surface-variant/30 p-2 rounded-[8px] mt-1 space-y-1">
                                      <p className="font-bold text-on-surface-variant text-[11px]">本周计划：</p>
                                      <ul className="list-disc list-inside text-on-surface-variant opacity-90 pl-1">
                                          {(t.weeklyPlan || []).map((step, i) => <li key={i}>{step}</li>)}
                                      </ul>
                                  </div>
                                  <p className="mt-1"><span className="text-outline font-bold">本月目标：</span>{t.monthlyGoal}</p>
                               </div>
                               <div className="flex flex-wrap gap-2 mt-3 p-2 bg-surface-container/5 rounded-[8px]">
                                  <button onClick={() => confirmTaskSingle(t.id)} className="font-label-md text-[10px] text-primary bg-primary/10 px-2 py-1 rounded-sm">改为今日任务</button>
                                  <button onClick={() => setEditTask(t)} className="font-label-md text-[10px] text-outline px-2 py-1 rounded-sm border border-outline-variant/30">编辑计划</button>
                               </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </section>
      </div>

      <div className="absolute bottom-0 w-full px-margin-page pb-stack-lg pt-[60px] bg-gradient-to-t from-background via-background/95 to-transparent z-30 flex flex-col gap-2">
         <button
            onClick={handleFinish}
            className="w-full bg-primary text-white font-label-md text-[15px] py-4 rounded-[16px] shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200"
         >
             确认任务与规划
         </button>
      </div>

      {editTask && (
          <div className="absolute inset-0 bg-black/40 z-50 flex items-end justify-center">
             <div className="bg-surface w-full max-h-[85vh] rounded-t-[24px] p-6 flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom-full pb-8">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-headline-md text-[20px] font-bold">编辑任务与计划</h3>
                   <button onClick={() => setEditTask(null)} className="material-symbols-outlined text-outline">close</button>
                </div>
                
                <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline">任务名称
                  <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                    value={editTask.name || ''} onChange={e => setEditTask({...editTask, name: e.target.value})} />
                </label>
                
                <div className="flex gap-2">
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline flex-1">类型
                      <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                        value={editTask.type || ''} onChange={e => setEditTask({...editTask, type: e.target.value})} />
                    </label>
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline flex-1">截止时间
                      <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                        value={editTask.deadline || ''} onChange={e => setEditTask({...editTask, deadline: e.target.value})} />
                    </label>
                </div>

                <div className="flex gap-2">
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline flex-1">优先级
                      <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                        value={editTask.priority || ''} onChange={e => setEditTask({...editTask, priority: e.target.value})} />
                    </label>
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline flex-1">处理方式
                       <select className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                         value={editTask.handleMode || '今日行动'} onChange={e => setEditTask({...editTask, handleMode: e.target.value, isLater: e.target.value !== '今日行动'})}
                       >
                         <option value="今日行动">今日行动</option>
                         <option value="长期计划">长期计划</option>
                         <option value="稍后处理">稍后处理</option>
                       </select>
                    </label>
                </div>

                <div className="w-full h-px bg-outline-variant/20 my-2"></div>
                <p className="font-bold text-[14px]">执行计划设置</p>
                <div className="flex gap-2">
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline flex-1">本次目标 (今日行动)
                      <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                        value={editTask.todayGoal || ''} onChange={e => setEditTask({...editTask, todayGoal: e.target.value})} />
                    </label>
                    <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline w-[100px]">预计时间
                      <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                        value={editTask.estimatedTime || ''} onChange={e => setEditTask({...editTask, estimatedTime: e.target.value})} />
                    </label>
                </div>

                <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline">推荐下一步
                  <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                    value={editTask.nextStep || ''} onChange={e => setEditTask({...editTask, nextStep: e.target.value})} />
                </label>

                <label className="flex flex-col gap-1 font-label-md text-[13px] text-outline">本月目标 (长期计划)
                  <input type="text" className="border border-outline-variant/30 rounded-[12px] p-3 text-on-surface bg-surface-container-lowest"
                    value={editTask.monthlyGoal || ''} onChange={e => setEditTask({...editTask, monthlyGoal: e.target.value})} />
                </label>
                
                <button 
                  onClick={() => {
                      updateTask(editTask.id, {
                          name: editTask.name,
                          type: editTask.type,
                          deadline: editTask.deadline,
                          status: editTask.status,
                          blocker: editTask.blocker,
                          nextStep: editTask.nextStep,
                          handleMode: editTask.handleMode,
                          isLater: editTask.isLater,
                          priority: editTask.priority as any,
                          todayGoal: editTask.todayGoal,
                          estimatedTime: editTask.estimatedTime,
                          monthlyGoal: editTask.monthlyGoal
                      });
                      setEditTask(null);
                  }}
                  className="w-full bg-primary text-white p-4 rounded-[16px] font-bold mt-4">
                  保存
                </button>
             </div>
          </div>
      )}

    </main>
  );
}
