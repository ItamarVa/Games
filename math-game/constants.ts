
import { Topic, TopicCategory } from './types';

// Special topic for mixed practice
export const MIXED_TOPIC: Topic = {
  id: 'mixed',
  title: 'תרגול מעורב (כל הנושאים)',
  category: TopicCategory.WHOLE_NUMBERS, // Placeholder category
  description: 'שאלות מכל הסוגים בהפתעה!'
};

export const TOPICS: Topic[] = [
  // Whole Numbers
  {
    id: 'decimal-structure',
    title: 'מבנה עשרוני',
    category: TopicCategory.WHOLE_NUMBERS,
    description: 'ערך הספרה, מבנה המספר ומשמעות המיקום.'
  },
  {
    id: 'basic-ops',
    title: 'ארבע פעולות החשבון',
    category: TopicCategory.WHOLE_NUMBERS,
    description: 'חיבור, חיסור, כפל וחילוק במספרים שלמים.'
  },
  {
    id: 'comparisons',
    title: 'השוואות',
    category: TopicCategory.WHOLE_NUMBERS,
    description: 'מי גדול יותר? סימני גדול, קטן ושווה.'
  },
  {
    id: 'order-ops',
    title: 'סדר פעולות חשבון',
    category: TopicCategory.WHOLE_NUMBERS,
    description: 'חוקי הסדר: סוגריים, כפל וחילוק לפני חיבור וחיסור.'
  },
  
  // Fractions
  {
    id: 'frac-ident',
    title: 'זיהוי וכתיבת שברים',
    category: TopicCategory.FRACTIONS,
    description: 'זיהוי החלק הצבוע, כתיבה במילים ובספרות.'
  },
  {
    id: 'frac-convert',
    title: 'מספרים מעורבים ושברים',
    category: TopicCategory.FRACTIONS,
    description: 'הפיכת מספר מעורב לשבר גדול (מדומה) ולהיפך.'
  },

  // Geometry
  {
    id: 'geo-diagonals',
    title: 'אלכסונים במצולעים',
    category: TopicCategory.GEOMETRY,
    description: 'זיהוי אלכסונים, כמה אלכסונים יוצאים מקודקוד?'
  },
  {
    id: 'geo-angles',
    title: 'זוויות ומקבילות',
    category: TopicCategory.GEOMETRY,
    description: 'זיהוי זוויות ומקבילות (צלעות מקבילות) במצולעים.'
  }
];
