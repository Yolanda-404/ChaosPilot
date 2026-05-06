import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, ReviewData } from '../types';

// Mock Tasks Definition
const MOCK_TASKS: Task[] = [
    {
      id: 'm1', name: '社团活动策划', type: '社团事务', status: '进行中', deadline: '明晚', priority: '高优先级', priorityScore: 95, source: 'mock',
      handleMode: '今日行动', isConfirmed: true, isLater: false, isArchived: true, 
      currentProgress: '已完成初稿结构',
      lastDone: '已列出活动目标、流程安排、物料需求三个部分。', 
      nextStep: '补充活动流程，并确认物料需求。', 
      blocker: '物料需求还不确定，需要问负责人确认。', 
      planSuggestion: '今晚补活动流程，明早确认物料，明晚前整理成初稿。',
      weeklyPlan: ['今天：补充活动流程和活动目标', '明天上午：询问负责人确认物料需求', '明天下午：整理成完整初稿并检查格式'],
      monthlyGoal: '本月沉淀 1 套可复用的社团活动策划模板。',
      history: [
          { time: new Date(Date.now() - 86400000).toISOString(), title: '创建任务', content: '来自 AI 解析确认页' },
          { time: new Date(Date.now() - 3600000).toISOString(), title: '最近进展', content: '完成活动策划初稿结构' }
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'm2', name: '实习竞品分析', type: '实习任务', status: '进行中', deadline: '周三前', priority: '高优先级', priorityScore: 90, source: 'mock',
      handleMode: '今日行动', isConfirmed: true, isLater: false, isArchived: true, 
      currentProgress: '已明确主管要求',
      lastDone: '已确认需要输出一份竞品分析。', 
      nextStep: '整理 3 个竞品的对比维度。', 
      blocker: '不知道怎么归纳差异点。', 
      planSuggestion: '今天列维度，明天补竞品信息，周三前整理成表格。',
      weeklyPlan: ['今天：列出竞品对比维度', '明天：补充 3 个竞品的信息', '周三：整理表格并发给主管'],
      monthlyGoal: '本月形成 1 套竞品分析模板，后续实习任务可复用。',
      history: [
          { time: new Date(Date.now() - 86400000).toISOString(), title: '创建任务', content: '来自实习任务输入' },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'm3', name: '课程小组报告', type: '课程作业', status: '进行中', deadline: '周五前', priority: '中高优先级', priorityScore: 82, source: 'mock',
      handleMode: '今日行动', isConfirmed: true, isLater: false, isArchived: true, 
      currentProgress: '报告尚未完成',
      lastDone: '已确认报告还没写完，需要补结构和分工。', 
      nextStep: '列出报告目录和待补内容。', 
      blocker: '小组分工还不清晰。', 
      planSuggestion: '周三确认目录，周四补内容，周五前提交。',
      weeklyPlan: ['周三：确定报告目录和小组分工', '周四：补充主体内容', '周五：统一格式并提交'],
      monthlyGoal: '本月完成课程报告，并沉淀一份小组报告协作清单。',
      history: [
          { time: new Date(Date.now() - 86400000).toISOString(), title: '创建任务', content: '来自课程作业输入' },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'm4', name: 'SQL / RAG 学习', type: '秋招准备', status: '长期计划', deadline: '暂无', priority: '长期计划', priorityScore: 30, source: 'mock',
      handleMode: '长期计划', isConfirmed: true, isLater: true, isArchived: true, 
      currentProgress: '已收集学习资料',
      lastDone: '已收集 SQL 面试题和 RAG 基础资料。', 
      nextStep: '先整理 SQL 高频题，再看 RAG 基础概念。', 
      blocker: '资料比较多，不知道从哪里开始。', 
      planSuggestion: '拆成 SQL 基础、RAG 概念、面试题整理三个阶段，每次 15-25 分钟。',
      weeklyPlan: ['本周：整理 SQL 高频题', '下周：学习 RAG 基础概念', '第三周：整理项目表达和面试回答'],
      monthlyGoal: '本月完成 SQL 高频题梳理和 RAG 基础知识入门。',
      history: [
          { time: new Date(Date.now() - 86400000).toISOString(), title: '创建任务', content: '来自秋招资料输入' },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'm5', name: '论文第二章', type: '论文文档', status: '长期计划', deadline: '待确认', priority: '长期计划', priorityScore: 35, source: 'mock',
      handleMode: '长期计划', isConfirmed: true, isLater: true, isArchived: true, 
      currentProgress: '已有部分资料',
      lastDone: '已收集部分文献，但章节结构还不清晰。', 
      nextStep: '先整理第二章小标题。', 
      blocker: '理论部分不知道怎么展开。', 
      planSuggestion: '先搭章节框架，再补引用资料。',
      weeklyPlan: ['本周：列出第二章小标题', '下周：补充核心文献和理论定义', '第三周：完成第二章初稿'],
      monthlyGoal: '本月完成论文第二章初稿。',
      history: [
          { time: new Date(Date.now() - 86400000).toISOString(), title: '创建任务', content: '来自论文文档输入' },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString()
    },
    {
      id: 'm6', name: '上周实验报告', type: '课程作业', status: '已完成', deadline: '已提交', priority: '已完成' as any, priorityScore: -999, source: 'mock',
      handleMode: '已完成', isConfirmed: true, isLater: false, isArchived: true, 
      currentProgress: '已完成',
      lastDone: '已完成实验报告并提交。', 
      nextStep: '无需继续。', 
      blocker: '无', 
      planSuggestion: '可查看历史记录，后续类似报告可复用格式。',
      weeklyPlan: ['已完成：无需继续安排'],
      monthlyGoal: '保留为历史记录，作为后续实验报告模板参考。',
      history: [
          { time: new Date(Date.now() - 86400000 * 5).toISOString(), title: '创建任务', content: '来自课程作业' },
          { time: new Date(Date.now() - 86400000 * 2).toISOString(), title: '完成记录', content: '已提交实验报告' }
      ],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
];

interface AppState {
  energyScore: number;
  availableTime: number;
  inputText: string;
  tasks: Task[];
  activeTaskId: string | null;
  reviewData: ReviewData | null;
}

interface AppContextType extends AppState {
  setEnergyScore: (val: number) => void;
  setAvailableTime: (val: number) => void;
  setInputText: (val: string) => void;
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setActiveTaskId: (id: string | null) => void;
  setReviewData: (data: ReviewData | null) => void;
}

const defaultInput = "我刚搜了 SQL 面试题和 RAG 基础知识，感觉都要学。课程作业周五前要交，小组报告还没写。明天晚上要交社团活动策划初稿。主管让我周三前整理一份竞品分析。我现在脑子很乱，想学秋招又怕作业来不及，还想休息，但一休息就内疚。";

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [energyScore, setEnergyScore] = useState(() => {
    const saved = localStorage.getItem('chaos_energy_score');
    return saved ? JSON.parse(saved) : 42;
  });
  
  const [availableTime, setAvailableTime] = useState(() => {
    const saved = localStorage.getItem('chaos_available_time');
    return saved ? JSON.parse(saved) : 25;
  });
  
  const [inputText, setInputText] = useState(defaultInput);
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('chaos_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    const saved = localStorage.getItem('chaos_active_focus_task_id');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [reviewData, setReviewData] = useState<ReviewData | null>(() => {
    const saved = localStorage.getItem('chaos_review_record');
    return saved ? JSON.parse(saved) : null;
  });

  // Seed mock tasks if empty
  useEffect(() => {
    let currentTasks = tasks;
    let modified = false;
    
    // Auto seed if completely empty
    if (currentTasks.length === 0) {
      currentTasks = [...MOCK_TASKS];
      modified = true;
    } else {
      // Ensure mock tasks exist without overwriting user tasks
      MOCK_TASKS.forEach(mockTask => {
        if (!currentTasks.some(t => t.name === mockTask.name)) {
          currentTasks.push(mockTask);
          modified = true;
        }
      });
    }

    if (modified) {
      setTasks([...currentTasks]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chaos_energy_score', JSON.stringify(energyScore));
  }, [energyScore]);

  useEffect(() => {
    localStorage.setItem('chaos_available_time', JSON.stringify(availableTime));
  }, [availableTime]);

  useEffect(() => {
    localStorage.setItem('chaos_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('chaos_active_focus_task_id', JSON.stringify(activeTaskId));
    // Also save the full task object as requested by some specs, or we just rely on ID
    const fullTask = tasks.find(t => t.id === activeTaskId);
    if (fullTask) {
        localStorage.setItem('chaos_active_focus_task', JSON.stringify(fullTask));
    } else {
        localStorage.removeItem('chaos_active_focus_task');
    }
  }, [activeTaskId, tasks]);

  useEffect(() => {
    if (reviewData) {
      localStorage.setItem('chaos_review_record', JSON.stringify(reviewData));
    } else {
      localStorage.removeItem('chaos_review_record');
    }
  }, [reviewData]);

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  return (
    <AppContext.Provider value={{
      energyScore, setEnergyScore,
      availableTime, setAvailableTime,
      inputText, setInputText,
      tasks, setTasks,
      activeTaskId, setActiveTaskId,
      reviewData, setReviewData,
      updateTask
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
