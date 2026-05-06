import { Task, Priority, TaskStatus } from '../types';

export function parseInputToTasks(inputText: string, energyScore: number, availableTime: number): Task[] {
  const sentences = inputText.split(/[。，；！？,\n]/).map(s => s.trim()).filter(s => s.length > 0);
  let tasks: Task[] = [];
  let genericTimeMatch: string | null = null;

  const timeRegex = /(今天|今晚|明天晚上|明天|明晚|后天|周一|周二|周三前|周四前|周五前|周五|周六|周日|本周|本周内|这周|下周|周末|月底|月末|下个月|今晚前|明天前|几号前|截止|ddl|DDL|due|提交前|要交|交付)/i;

  sentences.forEach((sentence) => {
    let taskAdded = false;
    let localTimeMatch = sentence.match(timeRegex);
    const deadline = localTimeMatch ? localTimeMatch[0] : null;

    if (deadline && !genericTimeMatch) {
      genericTimeMatch = deadline;
    }

    const t = deadline || genericTimeMatch;

    // Helper to calculate score and priority
    const evaluatePriority = (deadlineTag: string | null, type: string) => {
        return calculatePriorityScore(deadlineTag, type);
    };

    const createTaskBase = (name: string, type: string, nextStep: string, blocker: string, planSuggestion: string = ''): Task => {
        const { score, label } = evaluatePriority(t, type);
        return {
            id: Math.random().toString(36).substr(2, 9),
            name,
            type,
            status: '待开始',
            deadline: t || '待确认',
            priority: label as Priority,
            priorityScore: score,
            source: 'user',
            currentProgress: '',
            lastDone: '',
            nextStep,
            blocker,
            planSuggestion,
            handleMode: '待确认',
            weeklyPlan: [],
            monthlyGoal: '',
            history: [{ time: new Date().toISOString(), title: '创建任务', content: '来自 AI 解析输入' }],
            isConfirmed: false,
            isArchived: false,
            isLater: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    };

    // 1. 社团事务
    if (/(社团|活动|策划|初稿|负责人|物料|宣传|流程安排)/.test(sentence) && !taskAdded) {
      tasks.push(createTaskBase(
          '社团活动策划', 
          '社团事务', 
          '列出活动目标、流程安排、物料需求', 
          '不知道初稿结构怎么搭'
      ));
      taskAdded = true;
    }

    // 2. 实习任务
    if (/(实习|主管|竞品|分析|周报|汇报|老板|leader|需求|整理材料)/.test(sentence) && !taskAdded) {
      tasks.push(createTaskBase(
          '实习竞品分析', 
          '实习任务', 
          '整理 3 个竞品的对比维度', 
          '不知道怎么归纳对比维度'
      ));
      taskAdded = true;
    }

    // 3. 课程作业
    if (/(课程|作业|小组报告|报告|实验报告|老师|提交|课堂|课程设计|结课)/.test(sentence) && !taskAdded) {
      tasks.push(createTaskBase(
          '课程小组报告', 
          '课程作业', 
          '列出报告目录和待补内容', 
          '需要确认报告结构和分工'
      ));
      taskAdded = true;
    }

    // 4. 秋招学习
    if (/(SQL|RAG|秋招|面试|笔试|简历|八股|算法|刷题|大模型|项目复盘)/i.test(sentence) && !taskAdded) {
      const task = createTaskBase(
          'SQL / RAG 学习', 
          '秋招准备', 
          '先整理一个 15 分钟学习清单', 
          '资料太多，不知道先看什么',
          '后续可拆成 SQL 基础、RAG 概念、面试题整理三个阶段'
      );
      tasks.push(task);
      taskAdded = true;
    }

    // 5. 论文文档
    if (/(论文|文献|开题|摘要|第二章|第三章|框架|引用|查重|导师)/.test(sentence) && !taskAdded) {
      tasks.push(createTaskBase(
          '论文写作', 
          '论文文档', 
          '先列出当前章节的小标题', 
          '结构还不清晰'
      ));
      taskAdded = true;
    }

    // 6. 考试复习
    if (/(考试|复习|期末|期中|四六级|考研|背书|复盘|错题)/.test(sentence) && !taskAdded) {
      tasks.push(createTaskBase(
          '考试复习', 
          '考试复习', 
          '列出考试范围和最薄弱的 3 个知识点', 
          '复习范围不清晰'
      ));
      taskAdded = true;
    }

    // 7. 通用待确认任务
    if (!taskAdded && localTimeMatch && /(要交|提交|截止|ddl|due|任务|要做)/i.test(sentence)) {
      tasks.push(createTaskBase(
          '待确认任务', 
          '未分类', 
          '补充这件事具体要做什么或要交什么', 
          '任务内容还不够明确'
      ));
    }
  });

  // 去重 (deduplicate by name)
  const uniqueTasks = [];
  const seen = new Set();
  for (const t of tasks) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      uniqueTasks.push(t);
    }
  }

  return uniqueTasks;
}

function calculatePriorityScore(deadline: string | null, type: string): { score: number, label: string } {
  let score = 0;
  let label = '中优先级';

  // Base score from deadline
  if (!deadline) {
    score -= 10;
  } else if (/(明天|明晚|今晚|今天|ddl|截止|要交)/i.test(deadline)) {
    score += 50;
    label = '高优先级';
  } else if (/(周三前|周五前|本周内)/i.test(deadline)) {
    score += 35;
    label = '中高优先级';
  } else {
      score += 15; // default deadline addition
  }

  // Base score from type
  switch (type) {
      case '实习任务': score += 30; break;
      case '课程作业': score += 25; break;
      case '社团事务': score += 25; break;
      case '考试复习': score += 20; break;
      case '论文文档': score += 15; break;
      case '秋招准备': score += 10; break;
      default: break;
  }

  // Adjust label for specific combinations
  if (type === '秋招准备' && !deadline) {
      label = '长期计划';
  } else if (!deadline && score < 10) {
      label = '低优先级';
  }

  return { score, label };
}
