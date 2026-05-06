export type TaskStatus = '待开始' | '进行中' | '长期计划' | '已完成' | '待确认';
export type Priority = '高优先级' | '中高优先级' | '中优先级' | '低优先级' | '长期计划' | '待确认';

export interface Task {
  id: string;
  name: string;
  type: string;
  status: TaskStatus;
  deadline: string;
  priority: Priority;
  priorityScore: number;
  source: string;
  currentProgress: string;
  lastDone: string;
  nextStep: string;
  blocker: string; // Used to replace currentStuck
  planSuggestion: string;
  handleMode: string; // 今日行动、稍后处理、长期计划、待确认、已完成
  weeklyPlan: string[];
  monthlyGoal: string;
  history: Array<{ time: string; title: string; content: string }>;
  isConfirmed: boolean;
  isArchived: boolean;
  isLater: boolean;
  createdAt: string;
  updatedAt: string;
  todayRank?: number;
  todayGoal?: string;
  estimatedTime?: string;
  recommendReason?: string;
  planAction?: "新建计划" | "更新计划" | "无变化";
  planConfirmStatus?: "待确认" | "已确认" | "已修改";
  calendarItems?: string[];
  reviewStatus?: "无复盘" | "草稿中" | "已生成接续记录";
  reviewDraftId?: string | null;
  lastReviewAt?: string | null;
  feeling?: string;
}

export interface ReviewDraft {
  id: string;
  taskId: string;
  taskName: string;
  doneText: string;
  nextText: string;
  feeling: string;
  status: "草稿中";
  createdAt: string;
  updatedAt: string;
}

export interface ReviewData {
  done: string;
  next: string;
  feeling?: string;
}

