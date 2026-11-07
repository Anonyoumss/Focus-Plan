export interface TestSection {
  id: string;
  nameEn: string;
  nameAr: string;
  minScore: number;
  maxScore: number;
  defaultTargetScore: number;
}

export interface CatalogSources {
  scoreScale?: string;
  sections?: string;
  dates?: string;
}

export interface StandardizedTestDefinition {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  category: 'saudi' | 'international';
  minScore: number;
  maxScore: number;
  scoreUnit: string;
  typicalPrepWeeks: number;
  officialPortal: string;
  /** Official source URL per data field. Absent = unconfirmed, show "verify on official site". */
  sourceUrls: CatalogSources;
  /** Data fields not confirmed against an official page. */
  unverifiedFields: (keyof CatalogSources)[];
  sections: TestSection[];
  descriptionEn: string;
  descriptionAr: string;
}

export const TEST_CATALOG: StandardizedTestDefinition[] = [
  {
    id: 'gat_qudurat',
    code: 'GAT',
    nameEn: 'Saudi GAT (Qudurat)',
    nameAr: 'اختبار القدرات العامة (قياس)',
    category: 'saudi',
    minScore: 0,
    maxScore: 100,
    scoreUnit: 'Points',
    typicalPrepWeeks: 8,
    officialPortal: 'https://etec.gov.sa',
    sourceUrls: {},
    unverifiedFields: ['scoreScale', 'sections', 'dates'],
    descriptionEn: 'General Aptitude Test evaluating analytical and deductive abilities.',
    descriptionAr: 'اختبار يقيس القدرة التحليلية والاستدلالية للقبول الجامعي.',
    sections: [
      {
        id: 'gat_quant',
        nameEn: 'Quantitative Reasoning',
        nameAr: 'القسم الكمي (الرياضي)',
        minScore: 0,
        maxScore: 100,
        defaultTargetScore: 90,
      },
      {
        id: 'gat_verbal',
        nameEn: 'Verbal Reasoning',
        nameAr: 'القسم اللفظي (اللغوي)',
        minScore: 0,
        maxScore: 100,
        defaultTargetScore: 90,
      },
    ],
  },
  {
    id: 'saat_tahsili',
    code: 'SAAT',
    nameEn: 'Saudi SAAT (Tahsili)',
    nameAr: 'اختبار التحصيل الدراسي (تحصيلي)',
    category: 'saudi',
    minScore: 0,
    maxScore: 100,
    scoreUnit: 'Points',
    typicalPrepWeeks: 10,
    officialPortal: 'https://etec.gov.sa',
    sourceUrls: {},
    unverifiedFields: ['scoreScale', 'sections', 'dates'],
    descriptionEn: 'Standard Achievement Admission Test covering secondary STEM subjects.',
    descriptionAr: 'اختبار يقيس التحصيل العلمي في الرياضيات والفيزياء والكيمياء والأحياء.',
    sections: [
      { id: 'saat_math', nameEn: 'Mathematics', nameAr: 'الرياضيات', minScore: 0, maxScore: 100, defaultTargetScore: 92 },
      { id: 'saat_physics', nameEn: 'Physics', nameAr: 'الفيزياء', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
      { id: 'saat_chemistry', nameEn: 'Chemistry', nameAr: 'الكيمياء', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
      { id: 'saat_biology', nameEn: 'Biology', nameAr: 'الأحياء', minScore: 0, maxScore: 100, defaultTargetScore: 88 },
    ],
  },
  {
    id: 'step_saudi',
    code: 'STEP',
    nameEn: 'Saudi STEP',
    nameAr: 'كفايات اللغة الإنجليزية (STEP)',
    category: 'saudi',
    minScore: 0,
    maxScore: 100,
    scoreUnit: 'Points',
    typicalPrepWeeks: 6,
    officialPortal: 'https://etec.gov.sa',
    sourceUrls: {},
    unverifiedFields: ['scoreScale', 'sections', 'dates'],
    descriptionEn: 'Standardized Test of English Proficiency for academic & military admission.',
    descriptionAr: 'اختبار تحديد كفاءة اللغة الإنجليزية للجامعات والمؤسسات الحكومية.',
    sections: [
      { id: 'step_reading', nameEn: 'Reading Comprehension', nameAr: 'فهم المقروء (40%)', minScore: 0, maxScore: 100, defaultTargetScore: 85 },
      { id: 'step_structure', nameEn: 'Grammar & Structure', nameAr: 'التراكيب النحوية (30%)', minScore: 0, maxScore: 100, defaultTargetScore: 85 },
      { id: 'step_listening', nameEn: 'Listening Comprehension', nameAr: 'فهم المسموع (20%)', minScore: 0, maxScore: 100, defaultTargetScore: 80 },
      { id: 'step_composition', nameEn: 'Written Analysis', nameAr: 'التحليل الكتابي (10%)', minScore: 0, maxScore: 100, defaultTargetScore: 80 },
    ],
  },
  {
    id: 'kfupm_early_saat',
    code: 'KFUPM Early',
    nameEn: 'KFUPM Early SAAT',
    nameAr: 'التحصيلي المبكر (جامعة الملك فهد)',
    category: 'saudi',
    minScore: 0,
    maxScore: 100,
    scoreUnit: 'Points',
    typicalPrepWeeks: 12,
    officialPortal: 'https://admissions.kfupm.edu.sa',
    sourceUrls: {
      dates: 'https://admissions.kfupm.edu.sa/important-dates',
    },
    unverifiedFields: ['scoreScale', 'sections'],
    descriptionEn: 'Competitive early admission tracking for top STEM students at KFUPM.',
    descriptionAr: 'المسار التنافسي للقبول المبكر لطلاب التخصصات العلمية والهندسية.',
    sections: [
      { id: 'kfupm_advanced_math', nameEn: 'Advanced Mathematics', nameAr: 'الرياضيات المتقدمة', minScore: 0, maxScore: 100, defaultTargetScore: 95 },
      { id: 'kfupm_physics', nameEn: 'Physics', nameAr: 'الفيزياء التطبيقية', minScore: 0, maxScore: 100, defaultTargetScore: 92 },
      { id: 'kfupm_chemistry', nameEn: 'Chemistry', nameAr: 'الكيمياء', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
      { id: 'kfupm_english', nameEn: 'English Proficiency', nameAr: 'اللغة الإنجليزية', minScore: 0, maxScore: 100, defaultTargetScore: 90 },
    ],
  },
  {
    id: 'sat_collegeboard',
    code: 'SAT',
    nameEn: 'SAT Digital',
    nameAr: 'اختبار السات الدولي (SAT)',
    category: 'international',
    minScore: 400,
    maxScore: 1600,
    scoreUnit: 'Score',
    typicalPrepWeeks: 12,
    officialPortal: 'https://satsuite.collegeboard.org',
    sourceUrls: {
      scoreScale: 'https://satsuite.collegeboard.org/scores/what-scores-mean',
      sections: 'https://satsuite.collegeboard.org/sat/whats-on-the-test',
      dates: 'https://satsuite.collegeboard.org/sat/dates-deadlines',
    },
    unverifiedFields: [],
    descriptionEn: 'Global college admissions test measuring Reading, Writing, and Math.',
    descriptionAr: 'الاختبار المعياري العالمي للقبول الجامعي في أمريكا والجامعات العالمية.',
    sections: [
      {
        id: 'sat_reading_writing',
        nameEn: 'Reading and Writing',
        nameAr: 'القراءة والكتابة',
        minScore: 200,
        maxScore: 800,
        defaultTargetScore: 720,
      },
      {
        id: 'sat_math',
        nameEn: 'Mathematics',
        nameAr: 'الرياضيات',
        minScore: 200,
        maxScore: 800,
        defaultTargetScore: 750,
      },
    ],
  },
  {
    id: 'act_test',
    code: 'ACT',
    nameEn: 'ACT Exam',
    nameAr: 'اختبار الآكت (ACT)',
    category: 'international',
    minScore: 1,
    maxScore: 36,
    scoreUnit: 'Composite',
    typicalPrepWeeks: 10,
    officialPortal: 'https://www.act.org',
    sourceUrls: {
      scoreScale: 'https://www.act.org/content/act/en/products-and-services/the-act/scores.html',
      dates: 'https://www.act.org/content/act/en/products-and-services/the-act/scores.html',
    },
    unverifiedFields: ['sections'],
    descriptionEn: 'Standardized assessment covering English, Mathematics, Reading, and Science.',
    descriptionAr: 'اختبار القياس الأكاديمي الشامل للقبول بالجامعات الدولية.',
    sections: [
      { id: 'act_english', nameEn: 'English', nameAr: 'اللغة الإنجليزية', minScore: 1, maxScore: 36, defaultTargetScore: 32 },
      { id: 'act_math', nameEn: 'Mathematics', nameAr: 'الرياضيات', minScore: 1, maxScore: 36, defaultTargetScore: 34 },
      { id: 'act_reading', nameEn: 'Reading', nameAr: 'القراءة', minScore: 1, maxScore: 36, defaultTargetScore: 31 },
      { id: 'act_science', nameEn: 'Science Reasoning', nameAr: 'الاستدلال العلمي', minScore: 1, maxScore: 36, defaultTargetScore: 33 },
    ],
  },
  {
    id: 'ielts_academic',
    code: 'IELTS',
    nameEn: 'IELTS Academic',
    nameAr: 'اختبار الآيلتس (IELTS)',
    category: 'international',
    minScore: 0,
    maxScore: 9,
    scoreUnit: 'Band',
    typicalPrepWeeks: 8,
    officialPortal: 'https://ielts.org',
    sourceUrls: {
      scoreScale: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail',
      sections: 'https://ielts.org/take-a-test/test-types/ielts-academic-test',
      dates: 'https://ielts.org/take-a-test/booking-your-test',
    },
    unverifiedFields: [],
    descriptionEn: 'International English Language Testing System for global study visas.',
    descriptionAr: 'النظام الدولي لاختبار اللغة الإنجليزية للهجرة والابتعاث والدراسة.',
    sections: [
      { id: 'ielts_listening', nameEn: 'Listening', nameAr: 'الاستماع', minScore: 0, maxScore: 9, defaultTargetScore: 7.5 },
      { id: 'ielts_reading', nameEn: 'Reading', nameAr: 'القراءة', minScore: 0, maxScore: 9, defaultTargetScore: 7.5 },
      { id: 'ielts_writing', nameEn: 'Writing', nameAr: 'الكتابة', minScore: 0, maxScore: 9, defaultTargetScore: 7.0 },
      { id: 'ielts_speaking', nameEn: 'Speaking', nameAr: 'المحادثة', minScore: 0, maxScore: 9, defaultTargetScore: 7.5 },
    ],
  },
  {
    id: 'toefl_ibt',
    code: 'TOEFL',
    nameEn: 'TOEFL iBT',
    nameAr: 'اختبار التوفل (TOEFL iBT)',
    category: 'international',
    minScore: 0,
    maxScore: 120,
    scoreUnit: 'Points',
    typicalPrepWeeks: 8,
    officialPortal: 'https://www.ets.org/toefl',
    sourceUrls: {
      scoreScale: 'https://www.ets.org/toefl/test-takers/ibt/scores.html',
    },
    unverifiedFields: ['sections', 'dates'],
    descriptionEn: 'Test of English as a Foreign Language for university study.',
    descriptionAr: 'اختبار إتقان الإنجليزية المعتمد عالمياً في الجامعات الأمريكية والأوروبية.',
    sections: [
      { id: 'toefl_reading', nameEn: 'Reading', nameAr: 'القراءة', minScore: 0, maxScore: 30, defaultTargetScore: 26 },
      { id: 'toefl_listening', nameEn: 'Listening', nameAr: 'الاستماع', minScore: 0, maxScore: 30, defaultTargetScore: 26 },
      { id: 'toefl_speaking', nameEn: 'Speaking', nameAr: 'التحدث', minScore: 0, maxScore: 30, defaultTargetScore: 24 },
      { id: 'toefl_writing', nameEn: 'Writing', nameAr: 'الكتابة', minScore: 0, maxScore: 30, defaultTargetScore: 25 },
    ],
  },
  {
    id: 'duolingo_english_test',
    code: 'DET',
    nameEn: 'Duolingo English Test',
    nameAr: 'اختبار دوولينجو (DET)',
    category: 'international',
    minScore: 10,
    maxScore: 160,
    scoreUnit: 'Score',
    typicalPrepWeeks: 4,
    officialPortal: 'https://englishtest.duolingo.com',
    sourceUrls: {},
    unverifiedFields: ['scoreScale', 'sections', 'dates'],
    descriptionEn: 'Fast online adaptive English test accepted by 5,000+ institutions.',
    descriptionAr: 'اختبار الكفاءة اللغوية التكيفي المعتمد في أكثر من 5000 جامعة.',
    sections: [
      { id: 'det_literacy', nameEn: 'Literacy (Read/Write)', nameAr: 'معرفة القراءة والكتابة', minScore: 10, maxScore: 160, defaultTargetScore: 130 },
      { id: 'det_comprehension', nameEn: 'Comprehension (Read/Listen)', nameAr: 'الفهم والاستيعاب', minScore: 10, maxScore: 160, defaultTargetScore: 135 },
      { id: 'det_conversation', nameEn: 'Conversation (Speak/Listen)', nameAr: 'المحادثة والتفاعل', minScore: 10, maxScore: 160, defaultTargetScore: 125 },
      { id: 'det_production', nameEn: 'Production (Write/Speak)', nameAr: 'الإنتاج اللغوي', minScore: 10, maxScore: 160, defaultTargetScore: 125 },
    ],
  },
];

export interface UserTestGoal {
  id: string;
  testId: string;
  testName: string;
  testDate: string;
  targetScore: number;
  currentBaselineScore: number;
  sectionTargets: Record<string, number>;
  /**
   * User-edited section list for this goal. When present it replaces the
   * catalog definition's sections for display, score entry and analysis.
   * Set to undefined to restore catalog defaults.
   */
  customSections?: TestSection[];
  weeklyHours: number;
  weeklyPomodoros: number;
  completedPomodoros: number;
  scoresHistory: { date: string; score: number; sectionScores: Record<string, number>; notes?: string }[];
}
