import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { quizService, QuizQuestion } from '@/services/quiz.service';

export default function QuizScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    quizService.getQuestions().then(data => {
      setQuestions(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    if (formattedAnswers.length < questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    try {
      await quizService.submitAnswers(formattedAnswers);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit quiz.');
    }
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#208AEF" /></View>;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-6 pt-12 pb-8">
        <Text className="text-3xl font-bold text-slate-900 mb-2">Compatibility Quiz</Text>
        <Text className="text-slate-600 mb-8 text-base">Answer these questions to improve your matches.</Text>

        {questions.map((q, index) => (
          <View key={q.id} className="bg-white p-6 rounded-2xl mb-6 shadow-sm border border-slate-100">
            <Text className="text-lg font-bold text-slate-800 mb-4">{index + 1}. {q.text}</Text>
            
            {q.options.map(opt => {
              const isSelected = answers[q.id] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  className={`p-4 rounded-xl border mb-3 ${
                    isSelected ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
                  }`}
                  onPress={() => handleSelect(q.id, opt.id)}
                >
                  <Text className={`${isSelected ? 'text-blue-700 font-semibold' : 'text-slate-700'}`}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-xl items-center mt-4 mb-24 shadow-md"
          onPress={handleSubmit}
        >
          <Text className="text-white font-bold text-lg">Save Answers</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
