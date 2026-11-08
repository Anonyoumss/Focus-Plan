import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { MaterialIcon } from '../common/MaterialIcon';
import {
  requestStudyPlan,
  type StudyPlanResult,
  type StudyPlanTaskItem,
} from '../../lib/ai/geminiClient';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export const AiPlanAssistantCard: React.FC = () => {
  const { locale, testGoals, addTask } = useAppStore();
  const ar = locale === 'ar';

  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanResult | null>(null);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(testGoals[0]?.id || 'custom');

  // AI Chat Drawer State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init_msg',
      sender: 'ai',
      text: ar
        ? 'مرحباً بك! أنا مدربك الدراسي الذكي. كيف يمكنني مساعدتك في تنظيم جدولك أو التغلب على صعوبات المذاكرة اليوم؟'
        : "Hello! I'm your AI Study Coach. How can I help you organize your schedule or optimize your focus strategy today?",
      timestamp: 0,
    },
  ]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    setAppliedCount(null);

    const goal = testGoals.find((g) => g.id === selectedGoalId);
    const testId = goal?.testId || 'gat_qudurat';
    const testName = goal?.testName || (ar ? 'اختبار القدرات العامة' : 'Standardized Exam');

    try {
      const res = await requestStudyPlan({
        testId,
        testName,
        weeklyPomodoroTarget: goal?.weeklyPomodoros || 20,
        sectionPriorities: [
          { sectionId: 'quant', sectionName: ar ? 'القسم الكمي' : 'Quantitative', gap: 15 },
          { sectionId: 'verbal', sectionName: ar ? 'القسم اللفظي' : 'Verbal & Reading', gap: 10 },
        ],
        locale: locale === 'ar' ? 'ar' : 'en',
      });
      setGeneratedPlan(res);
    } catch (e) {
      console.warn('AI Plan Generation failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTasks = () => {
    if (!generatedPlan || !generatedPlan.tasks.length) return;
    let count = 0;
    generatedPlan.tasks.forEach((task: StudyPlanTaskItem) => {
      addTask({
        title: task.title,
        category: ar ? 'اختبارات معيارية' : 'Standardized Tests',
        estimatedSessions: task.estimatedPomodoros,
        minGoal: 1,
        maxGoal: Math.max(2, task.estimatedPomodoros + 1),
        cadence: 'weekly',
        notes: `${ar ? 'تم إنشاؤه بواسطة اقتراح الذكاء الاصطناعي' : 'Generated via AI Study Plan Suggestion'} (${task.dayOfWeek.toUpperCase()})`,
      });
      count++;
    });
    setAppliedCount(count);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Simulate intelligent study coach response with real test awareness
      setTimeout(() => {
        let aiReply: string;
        const lower = userText.toLowerCase();

        if (lower.includes('sat') || lower.includes('gat') || lower.includes('قدرات') || lower.includes('تحصيلي')) {
          aiReply = ar
            ? 'للحصول على أفضل نتيجة في الاختبارات المعيارية: خصص 3 جلسات بومودورو يومياً لحل الأسئلة السابقة، وجلسة واحدة لمراجعة الأخطاء في سجل الدرجات.'
            : 'For optimal standardized test prep: allocate 3 pomodoro sessions daily to timed practice sets, and 1 session strictly to reviewing wrong answers in your Score Loop.';
        } else if (lower.includes('جدول') || lower.includes('schedule') || lower.includes('plan') || lower.includes('وقت')) {
          aiReply = ar
            ? 'أنصح بتوزيع المهام الصعبة في الصباح بعد جلسة استراحة قصيرة، واستخدام تكتكة البندول للحفاظ على الإيقاع أثناء المذاكرة.'
            : 'I recommend scheduling high-demand tasks in your morning prime time with short breaks, and using the ticking metronome sound to maintain steady rhythm.';
        } else {
          aiReply = ar
            ? 'خطتك الحالية متوازنة جداً! احرص على إنهاء 4 جلسات تركيز اليوم للحفاظ على سلسلتك وإلغاء قفل 3D Arcade.'
            : 'Your current study agenda is nicely structured! Aim to complete 4 focus sessions today to protect your streak and unlock the 3D Focus Arcade.';
        }

        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now(),
        };

        setChatMessages((prev) => [...prev, aiMsg]);
        setChatLoading(false);
      }, 700);
    } catch {
      setChatLoading(false);
    }
  };

  return (
    <div
      className="p-6 rounded-3xl border space-y-5"
      style={{
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        borderColor: 'var(--md-sys-color-outline-variant)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
          >
            <MaterialIcon name="auto_awesome" size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold font-display" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              {ar ? 'المساعد الدراسي بالذكاء الاصطناعي' : 'AI Study Assistant'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              {ar ? 'توليد جدول مهام أسبوعي ذكي واستشارة دراسية مخصصة.' : 'Generate smart weekly task agendas and consult your AI Study Coach.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--md-sys-color-secondary-container)',
              color: 'var(--md-sys-color-on-secondary-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <MaterialIcon name="forum" size={16} />
            <span>{ar ? 'محادثة المدرب' : 'Ask AI Coach'}</span>
          </button>

          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border shadow-sm transition-transform hover:scale-105 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              borderColor: 'var(--md-sys-color-primary)',
            }}
          >
            <MaterialIcon name={loading ? 'hourglass_empty' : 'auto_fix_high'} size={16} />
            <span>{loading ? (ar ? 'جارٍ التوليد...' : 'Generating...') : (ar ? 'توليد خطة ذكية' : 'Generate AI Plan')}</span>
          </button>
        </div>
      </div>

      {/* Goal Selector */}
      {testGoals.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {ar ? 'الاختبار المستهدف:' : 'Target Exam:'}
          </span>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-xl border outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {testGoals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.testName} ({ar ? 'الهدف:' : 'Target:'} {g.targetScore})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Generated AI Plan Display */}
      {generatedPlan && (
        <div
          className="p-4 rounded-2xl border space-y-3"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'var(--md-sys-color-tertiary-container)',
                  color: 'var(--md-sys-color-on-tertiary-container)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                }}
              >
                {ar ? 'مقترح ذكاء اصطناعي • يرجى التحقق' : 'AI suggested • verify'}
              </span>
              {generatedPlan.isOfflineFallback && (
                <span className="text-[11px] opacity-75">
                  ({ar ? 'تقدير محلي' : 'Offline heuristic'})
                </span>
              )}
            </div>

            <button
              onClick={handleApplyTasks}
              disabled={appliedCount !== null}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer disabled:opacity-60"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              <MaterialIcon name="playlist_add" size={16} />
              <span>
                {appliedCount !== null
                  ? (ar ? `تمت إضافة ${appliedCount} مهام` : `Added ${appliedCount} tasks!`)
                  : (ar ? 'إضافة المهام للجدول' : 'Add to My Agenda')}
              </span>
            </button>
          </div>

          {/* Task list preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {generatedPlan.tasks.map((task, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'var(--md-sys-color-surface-container-high)',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                <div className="truncate">
                  <p className="font-semibold truncate">{task.title}</p>
                  <p className="text-[10px] opacity-75 uppercase">{task.dayOfWeek}</p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold shrink-0">
                  {task.estimatedPomodoros} {ar ? 'جلسات' : 'pomo'}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[10px] italic leading-tight" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            {generatedPlan.disclaimer}
          </p>
        </div>
      )}

      {/* AI Multi-Turn Chat Coach Drawer */}
      {showChat && (
        <div
          className="p-4 rounded-2xl border space-y-3 pt-4 border-t"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--md-sys-color-on-surface)' }}>
              <MaterialIcon name="smart_toy" size={16} style={{ color: 'var(--md-sys-color-primary)' }} />
              <span>{ar ? 'استشارة المدرب الدراسي' : 'AI Study Coach Chat'}</span>
            </span>
            <button
              onClick={() => setShowChat(false)}
              className="text-xs opacity-75 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Scrollable conversation thread */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 p-2 rounded-xl bg-slate-900/10">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'rounded-te-none bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                      : 'rounded-ts-none bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse delay-100">●</span>
                <span className="animate-pulse delay-200">●</span>
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={ar ? 'اسأل المدرب عن التخطيط أو المذاكرة...' : 'Ask your AI coach for study advice...'}
              className="flex-1 px-3.5 py-2 rounded-xl border text-xs outline-none"
              style={{
                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                borderColor: 'var(--md-sys-color-outline-variant)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer border disabled:opacity-50"
              style={{
                backgroundColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
              }}
            >
              {ar ? 'إرسال' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
