import { api } from '@/lib/api';

export interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

export const quizService = {
  getQuestions: async (): Promise<QuizQuestion[]> => {
    const response = await api.get('/quiz/questions');
    return response.data;
  },

  submitAnswers: async (answers: { questionId: string; optionId: string }[]) => {
    const response = await api.post('/quiz/answers', { answers });
    return response.data;
  },
};
