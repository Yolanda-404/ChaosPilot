import { useAppContext } from '../context/AppContext';
import { parseInputToTasks } from '../lib/parser';

export function MindDumpInputPage({ onNext }: { onNext: () => void }) {
  const { energyScore, setEnergyScore, availableTime, setAvailableTime, inputText, setInputText, setTasks, tasks } = useAppContext();

  const handleParse = () => {
    const generatedTasks = parseInputToTasks(inputText, energyScore, availableTime).map(gTask => {
      const existing = tasks.find(t => t.name === gTask.name);
      if (existing) {
        return { 
          ...existing, 
          priorityScore: gTask.priorityScore,
          priority: gTask.priority,
          deadline: gTask.deadline,
          nextStep: gTask.nextStep,
          blocker: gTask.blocker,
          planSuggestion: gTask.planSuggestion || existing.planSuggestion,
          isConfirmed: false, 
          source: 'user',
          updatedAt: new Date().toLocaleString()
        };
      }
      return gTask;
    });
    setTasks([...tasks.filter(t => t.isConfirmed && !generatedTasks.some(g => g.name === t.name)), ...generatedTasks]); 
    onNext();
  };

  return (
    <main className="w-full max-w-[390px] mx-auto px-margin-page flex flex-col gap-stack-lg pt-[80px] pb-[100px]">
      {/* Header Text */}
      <section className="flex flex-col gap-stack-sm pt-4">
        <span className="font-label-md text-label-md text-primary opacity-80">AI 任务梳理助手</span>
        <h1 className="font-headline-lg text-[22px] font-bold text-on-background">现在脑子里有什么？</h1>
        <p className="font-body-md text-on-surface-variant text-sm">把资料、任务和情绪一起倒进来，我帮你整理</p>
      </section>

      {/* Module 1: Energy Status */}
      <section className="bg-white rounded-[24px] p-gutter-card shadow-sm border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <h2 className="font-label-md text-on-background font-bold tracking-wider uppercase text-[12px]">今日可用能量</h2>
            <span className="font-headline-md text-primary font-bold">{energyScore}/100</span>
          </div>
        </div>
        <div className="w-full pt-2">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={energyScore}
            onChange={(e) => setEnergyScore(parseInt(e.target.value))}
            className="w-full accent-primary h-2 bg-surface-container rounded-lg appearance-none cursor-pointer" 
          />
          <div className="flex justify-between text-[10px] text-outline mt-2">
             <span>没电了</span>
             <span>充满动力</span>
          </div>
        </div>
      </section>

      {/* Module 2: Available Time */}
      <section className="flex flex-col gap-2">
        <h2 className="font-label-md text-[12px] text-outline font-bold uppercase tracking-wider ml-1">可用时间</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {[5, 15, 25, 45].map((time) => (
             <button 
               key={time}
               onClick={() => setAvailableTime(time)}
               className={`py-2 px-4 rounded-[12px] font-label-md text-[13px] border transition-all ${
                 availableTime === time 
                 ? 'bg-primary/10 border-primary text-primary font-semibold' 
                 : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
               }`}
             >
               {time} 分钟
             </button>
          ))}
          <div className="relative">
             <input 
               type="number"
               placeholder="自定义"
               className={`py-2 px-4 rounded-[12px] font-label-md text-[13px] border transition-all w-[80px] bg-surface outline-none ${
                   ![5, 15, 25, 45].includes(availableTime) 
                   ? 'bg-primary/10 border-primary text-primary font-semibold' 
                   : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
               }`}
               onChange={(e) => {
                   const val = parseInt(e.target.value);
                   if (!isNaN(val) && val > 0) setAvailableTime(val);
               }}
             />
          </div>
        </div>
      </section>

      {/* Module 3: Brain Dump Input */}
      <section className="flex flex-col gap-2">
        <h2 className="font-label-md text-[12px] text-outline font-bold uppercase tracking-wider ml-1">内容输入</h2>
        <div className="relative w-full">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 p-4 rounded-[16px] border border-outline-variant/40 bg-white shadow-sm font-body-md text-[14px] text-on-background focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-outline-variant"
            placeholder="我今天很累，课程作业还没写..."
          />
        </div>
      </section>

      {/* Main Action Button */}
      <section className="mt-2 mb-8 flex flex-col items-center gap-2">
        <button
          onClick={handleParse}
          className="w-full py-4 rounded-[16px] bg-primary text-white font-label-md text-[15px] shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          帮我整理一下
        </button>
      </section>
    </main>
  );
}
