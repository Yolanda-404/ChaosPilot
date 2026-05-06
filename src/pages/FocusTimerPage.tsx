import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export function FocusTimerPage({ onNext }: { onNext: () => void }) {
  const { activeTaskId, tasks, availableTime } = useAppContext();
  const activeTask = tasks.find(t => t.id === activeTaskId) || { name: '未知任务', nextStep: '暂无目标' };
  
  const [timeLeft, setTimeLeft] = useState(availableTime * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [isDowngraded, setIsDowngraded] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleDowngrade = () => {
    setIsDowngraded(true);
    setShowDowngrade(false);
    setTimeLeft(5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const totalSeconds = isDowngraded ? 5 * 60 : availableTime * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  // Calculate strokeDashoffset based on actual SVG path length from standard formula 2 * pi * r
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <main className="w-full max-w-[390px] h-full min-h-[100dvh] flex flex-col px-margin-page py-stack-lg z-10 relative overflow-hidden mx-auto bg-[#111827]">
        {/* Ambient Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#2DD4BF] blur-[100px] mix-blend-multiply opacity-20"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500 blur-[100px] mix-blend-multiply opacity-10"></div>
        </div>

        {/* Top Co-Pilot Message */}
        <div className="flex flex-col items-center text-center mt-6 mb-stack-md z-10 w-full max-w-[280px] mx-auto">
          <span className="material-symbols-outlined text-[#2DD4BF] mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
          <p className="font-body-lg text-[14px] text-gray-400">
              {isDowngraded ? '已切换为 5 分钟轻专注。只需完成最小一步。' : '这次只做这一小步，不需要解决所有问题。'}
          </p>
        </div>

        {/* Task Card */}
        <div className="bg-gray-800 rounded-[20px] p-gutter-card mb-stack-lg flex flex-col items-center text-center z-10">
          <h2 className="font-headline-md text-headline-md text-white mb-2">{activeTask.name}</h2>
          <div className="flex items-center gap-2 text-gray-400">
             <div className="w-2 h-2 rounded-full bg-[#2DD4BF]"></div>
             <span className="font-label-md text-[13px] bg-transparent">目标: {isDowngraded ? '只打开文件，写一句“我现在卡在哪里”' : activeTask.nextStep}</span>
          </div>
        </div>

        {/* Timer Circle */}
        <div className="flex-grow flex items-center justify-center relative mb-stack-lg z-10">
           <svg className="w-[280px] h-[280px] transform -rotate-90" viewBox="0 0 300 300">
               <circle className="text-gray-800" cx="150" cy="150" fill="none" r={radius} stroke="currentColor" strokeWidth="8"></circle>
               <circle 
                 className="text-[#2DD4BF] transition-all duration-1000 linear" 
                 cx="150" cy="150" fill="none" r={radius} stroke="currentColor" strokeLinecap="round" strokeWidth="8" 
                 strokeDasharray={circumference} 
                 strokeDashoffset={strokeDashoffset}
               ></circle>
           </svg>
           <div className="absolute flex flex-col items-center justify-center">
              <span className="font-headline-lg text-[64px] font-bold tracking-tighter text-white leading-none mb-2">{timeString}</span>
              <span className="font-label-md text-[12px] text-gray-400 border border-gray-700 bg-transparent rounded-full px-3 py-1">
                {isPaused ? '已暂停' : '专注中'}
              </span>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-stack-sm mb-stack-lg w-full z-10">
           <div className="flex gap-stack-sm w-full">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="flex-1 bg-[#2DD4BF] text-white font-label-md text-[14px] rounded-[16px] py-4 px-6 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                 <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                   {isPaused ? 'play_arrow' : 'pause'}
                 </span>
                 {isPaused ? '继续' : '暂停'}
              </button>
              <button 
                onClick={onNext} 
                className="flex-1 bg-gray-800 text-gray-400 border border-gray-700 font-label-md text-[14px] rounded-[16px] py-4 px-6 flex items-center justify-center gap-2 hover:bg-gray-700 active:scale-95 transition-all"
              >
                 <span className="material-symbols-outlined">stop_circle</span>
                 提前结束
              </button>
           </div>
           
           {!isDowngraded && (
            <button 
              onClick={() => setShowDowngrade(true)} 
              className="w-full bg-transparent border border-gray-700 text-gray-400 font-label-md text-[14px] rounded-[16px] py-4 px-6 flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined">sentiment_dissatisfied</span>
                我撑不住了
            </button>
           )}
        </div>

        {/* Downgrade Card */}
        {showDowngrade && (
          <div className="bg-gray-800 rounded-[16px] p-gutter-card mt-auto flex flex-col gap-stack-sm border-none z-10 soft-shadow animate-in slide-in-from-bottom-5 fade-in duration-300">
              <div className="flex items-start gap-3 text-left">
                 <span className="material-symbols-outlined text-[#2DD4BF] mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>psychology_alt</span>
                 <p className="font-body-md text-[14px] text-gray-400 flex-1">
                     没关系，我们把任务降到更小：<strong className="text-white font-semibold">只打开文件，写一句“我现在卡在哪里”。完成这一步也算推进。</strong>
                 </p>
              </div>
              <button 
                onClick={handleDowngrade}
                className="w-full bg-gray-700 text-white font-label-md text-[14px] rounded-[16px] py-3 px-6 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all mt-2"
              >
                  <span className="material-symbols-outlined">timer</span>
                  开始 5 分钟轻专注
              </button>
              <button onClick={() => setShowDowngrade(false)} className="w-full text-gray-500 text-[12px] underline mt-1">取消</button>
          </div>
        )}
    </main>
  );
}
