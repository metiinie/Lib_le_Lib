import { api } from '@/lib/api';

export type ArticleCategory = 'treatment' | 'u_equals_u' | 'hotlines' | 'general';
export type LanguageCode = 'am' | 'en';

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  language: LanguageCode;
  summary: string;
  content: string; // Markdown
}

export interface QaMessage {
  id: string;
  sender: 'me' | 'professional';
  text: string;
  timestamp: string;
}

export const supportService = {
  getResources: async (language: LanguageCode, category?: ArticleCategory): Promise<Article[]> => {
    // In real app, this hits GET /resources?lang=en&category=...
    // Mocking the response here
    const mockArticles: Article[] = [
      {
        id: '1',
        title: language === 'en' ? 'Understanding U=U' : 'U=U ማለት ምን ማለት ነው?',
        category: 'u_equals_u',
        language,
        summary: language === 'en' ? 'Undetectable equals Untransmittable explained.' : 'በደም ውስጥ ያለው የቫይረስ መጠን ካልታየ...',
        content: language === 'en' 
          ? '# Understanding U=U\n\n**U=U** means Undetectable = Untransmittable. If you take your ART medication daily and maintain an undetectable viral load, you **cannot** pass HIV through sex.'
          : '# U=U መረዳት\n\n**U=U** ማለት አይታይም = አይተላለፍም ማለት ነው።'
      },
      {
        id: '2',
        title: language === 'en' ? 'ART Treatment Basics' : 'የ ART ህክምና መሰረታዊ ነገሮች',
        category: 'treatment',
        language,
        summary: language === 'en' ? 'What you need to know about starting ART.' : 'ስለ ART ህክምና ማወቅ ያለብዎት።',
        content: '# Treatment Basics\n\nTaking your medication at the exact same time every day builds a strong defense.'
      }
    ];
    return mockArticles.filter(a => (category ? a.category === category : true));
  },

  getResourceById: async (id: string, language: LanguageCode = 'en'): Promise<Article> => {
    const resources = await supportService.getResources(language);
    const found = resources.find(r => r.id === id);
    if (!found) throw new Error('Resource not found');
    return found;
  },

  getQaMessages: async (): Promise<QaMessage[]> => {
    // Hits GET /qa/messages
    return [
      {
        id: 'm1',
        sender: 'professional',
        text: 'Hello, I am a certified health professional. How can I support you today? This space is completely anonymous.',
        timestamp: new Date().toISOString()
      }
    ];
  },

  sendQaMessage: async (text: string): Promise<QaMessage> => {
    // Hits POST /qa/messages
    return {
      id: Date.now().toString(),
      sender: 'me',
      text,
      timestamp: new Date().toISOString()
    };
  }
};
