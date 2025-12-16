
import { Question, TopicCategory } from '../types';

const FALLBACK_DB: Record<string, Omit<Question, 'id'>[]> = {
  [TopicCategory.WHOLE_NUMBERS]: [
    {
      text: 'פתרו לפי סדר פעולות חשבון: `5 + 3 * 2`',
      options: ['16', '11', '10', '13'],
      correctAnswerIndex: 1,
      explanation: 'כפל קודם לחיבור. קודם מחשבים `3 * 2` (שזה 6), ואז מוסיפים 5. התוצאה היא 11.',
      difficulty: 'medium'
    },
    {
      text: 'מהו ערך הספרה 4 במספר `4,320`?',
      options: ['4', '40', '400', '4,000'],
      correctAnswerIndex: 3,
      explanation: 'הספרה 4 נמצאת במקום האלפים, ולכן ערכה הוא `4,000`.',
      difficulty: 'easy'
    },
    {
      text: 'איזה סימן מתאים? `500 + 50 ___ 600 - 60`',
      options: ['>', '<', '=', 'לא ניתן לדעת'],
      correctAnswerIndex: 0,
      explanation: '`550` גדול מ- `540`. (`500+50=550`, `600-60=540`).',
      difficulty: 'medium'
    },
    {
      text: 'כמה הם `150 / 3`?',
      options: ['30', '40', '50', '60'],
      correctAnswerIndex: 2,
      explanation: '15 לחלק ל-3 זה 5, ולכן 150 לחלק ל-3 זה 50.',
      difficulty: 'medium'
    },
    {
      text: 'דני קנה 4 חטיפים במחיר 5 שקלים כל אחד. כמה שילם?',
      options: ['15 שקלים', '20 שקלים', '25 שקלים', '9 שקלים'],
      correctAnswerIndex: 1,
      explanation: 'תרגיל כפל פשוט: `4 * 5 = 20`.',
      difficulty: 'easy'
    }
  ],
  [TopicCategory.FRACTIONS]: [
    {
      text: 'הפכו את המספר המעורב 2 וחצי `2 1/2` לשבר גדול',
      options: ['`3/2`', '`5/2`', '`4/2`', '`2/2`'],
      correctAnswerIndex: 1,
      explanation: 'מכפילים את השלם (2) במכנה (2) ומוסיפים את המונה (1). מקבלים 5 חצאים.',
      difficulty: 'medium'
    },
    {
      text: 'איך כותבים "שלושה רבעים" במספרים?',
      options: ['`3/4`', '`4/3`', '34', '4.3'],
      correctAnswerIndex: 0,
      explanation: '3 במונה (למעלה) ו-4 במכנה (למטה).',
      difficulty: 'easy'
    },
    {
      text: 'מהו השבר המשלים ל-1 בשבר `3/5`?',
      options: ['`1/5`', '`2/5`', '`3/5`', '`4/5`'],
      correctAnswerIndex: 1,
      explanation: 'כדי להגיע ל-5/5 (שלם) חסרים לנו 2 חלקים מתוך 5.',
      difficulty: 'easy'
    },
    {
      text: 'כמה הם `3/4 - 1/4`?',
      options: ['`1/4`', '`1/2`', '`3/4`', '1'],
      correctAnswerIndex: 1,
      explanation: '3 רבעים פחות רבע אחד נשארים 2 רבעים, שזה בדיוק חצי.',
      difficulty: 'medium'
    }
  ],
  [TopicCategory.GEOMETRY]: [
    {
      text: 'כמה אלכסונים יוצאים מקודקוד אחד במרובע?',
      options: ['1', '2', '3', '0'],
      correctAnswerIndex: 0,
      explanation: 'במרובע ניתן למתוח רק אלכסון אחד מכל קודקוד (לקודקוד הנגדי).',
      difficulty: 'medium',
      svg: '<svg width="200" height="150" viewBox="0 0 200 150"><rect x="50" y="25" width="100" height="100" stroke="#4F46E5" stroke-width="3" fill="none"/><line x1="50" y1="25" x2="150" y2="125" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5,5"/></svg>'
    },
    {
      text: 'איזה זוג צלעות במלבן הן מקבילות?',
      options: ['צלעות סמוכות', 'צלעות נגדיות', 'אין צלעות מקבילות', 'האלכסונים'],
      correctAnswerIndex: 1,
      explanation: 'במלבן (ובכל מקבילית), הצלעות הנגדיות מקבילות זו לזו.',
      difficulty: 'easy',
      svg: '<svg width="200" height="150" viewBox="0 0 200 150"><rect x="40" y="40" width="120" height="70" stroke="#4F46E5" stroke-width="3" fill="#E0E7FF"/><path d="M40 40 L160 40" stroke="#10B981" stroke-width="4"/><path d="M40 110 L160 110" stroke="#10B981" stroke-width="4"/></svg>'
    },
    {
      text: 'איך מחשבים שטח מלבן?',
      options: ['אורך ועוד רוחב', 'אורך כפול רוחב', 'אורך כפול 2', 'רוחב כפול 2'],
      correctAnswerIndex: 1,
      explanation: 'נוסחת שטח מלבן היא צלע כפול הצלע הסמוכה לה (אורך כפול רוחב).',
      difficulty: 'medium',
      svg: '<svg width="200" height="150" viewBox="0 0 200 150"><rect x="50" y="50" width="100" height="50" stroke="#4F46E5" stroke-width="3" fill="none"/><text x="100" y="45" text-anchor="middle" font-size="14">אורך</text><text x="35" y="80" text-anchor="middle" font-size="14" transform="rotate(-90, 35, 80)">רוחב</text></svg>'
    },
    {
      text: 'כמה זוויות יש במשולש?',
      options: ['2', '3', '4', '1'],
      correctAnswerIndex: 1,
      explanation: 'במשולש יש 3 זוויות (ו-3 צלעות).',
      difficulty: 'easy',
      svg: '<svg width="200" height="150" viewBox="0 0 200 150"><polygon points="100,20 40,130 160,130" stroke="#4F46E5" stroke-width="3" fill="none"/><circle cx="100" cy="20" r="5" fill="#EF4444"/><circle cx="40" cy="130" r="5" fill="#EF4444"/><circle cx="160" cy="130" r="5" fill="#EF4444"/></svg>'
    }
  ]
};

export const getFallbackQuestion = (category: TopicCategory): Question => {
  // Determine key based on category string or default to WHOLE_NUMBERS
  let key = TopicCategory.WHOLE_NUMBERS;
  if (category === TopicCategory.FRACTIONS) key = TopicCategory.FRACTIONS;
  if (category === TopicCategory.GEOMETRY) key = TopicCategory.GEOMETRY;

  const questions = FALLBACK_DB[key] || FALLBACK_DB[TopicCategory.WHOLE_NUMBERS];
  const randomQ = questions[Math.floor(Math.random() * questions.length)];

  return {
    ...randomQ,
    id: `local-${Date.now()}-${Math.random()}`
  };
};

export const getRandomFallbackQuestion = (): Question => {
  // Flatten all questions
  const allQuestions = [
    ...FALLBACK_DB[TopicCategory.WHOLE_NUMBERS],
    ...FALLBACK_DB[TopicCategory.FRACTIONS],
    ...FALLBACK_DB[TopicCategory.GEOMETRY]
  ];
  
  const randomQ = allQuestions[Math.floor(Math.random() * allQuestions.length)];
  return {
    ...randomQ,
    id: `local-mixed-${Date.now()}-${Math.random()}`
  };
};
