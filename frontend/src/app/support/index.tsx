import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportService, Article, LanguageCode, ArticleCategory } from '@/services/support.service';

export default function SupportScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [category, setCategory] = useState<ArticleCategory | undefined>(undefined);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [language, category]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await supportService.getResources(language, category);
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity 
      className="bg-white p-5 rounded-2xl mb-4 border border-slate-100 shadow-sm"
      onPress={() => router.push(`/resources/${item.id}?lang=${language}`)}
    >
      <Text className="text-xl font-bold text-slate-900 mb-2">{item.title}</Text>
      <Text className="text-slate-600 mb-4 leading-relaxed" numberOfLines={2}>{item.summary}</Text>
      <View className="flex-row items-center">
        <Text className="text-blue-600 font-bold">Read article</Text>
        <Ionicons name="arrow-forward" size={16} color="#1B4D5C" className="ml-1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 pt-16 px-6">
      <View className="flex-row justify-between items-end mb-6">
        <Text className="text-3xl font-bold text-slate-900">Support</Text>
        <TouchableOpacity 
          className="bg-slate-200 px-3 py-1.5 rounded-full flex-row items-center"
          onPress={() => setLanguage(lang => lang === 'en' ? 'am' : 'en')}
        >
          <Ionicons name="language" size={16} color="#0F1E24" />
          <Text className="ml-1 font-bold text-slate-900">{language === 'en' ? 'English' : 'አማርኛ'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        className="w-full bg-indigo-600 p-5 rounded-2xl flex-row items-center justify-between mb-8 shadow-sm"
        onPress={() => router.push('/qa/thread')}
      >
        <View className="flex-1">
          <Text className="text-white font-bold text-lg mb-1">Ask a Professional</Text>
          <Text className="text-indigo-100 text-sm">Start an anonymous chat with our certified health team.</Text>
        </View>
        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center ml-4">
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </View>
      </TouchableOpacity>

      <View className="flex-row mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
          {(['all', 'treatment', 'u_equals_u', 'hotlines', 'general'] as const).map(cat => (
            <TouchableOpacity
              key={cat}
              className={`px-4 py-2 rounded-full mr-2 ${category === cat || (cat === 'all' && !category) ? 'bg-slate-900' : 'bg-slate-200'}`}
              onPress={() => setCategory(cat === 'all' ? undefined : cat as ArticleCategory)}
            >
              <Text className={`font-bold ${category === cat || (cat === 'all' && !category) ? 'text-white' : 'text-slate-600'}`}>
                {cat === 'all' ? 'All' : cat === 'u_equals_u' ? 'U=U' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#1B4D5C" />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
