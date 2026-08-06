import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { supportService, Article, LanguageCode } from '@/services/support.service';

export default function ResourceDetailScreen() {
  const { id, lang } = useLocalSearchParams<{ id: string, lang: LanguageCode }>();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [id, lang]);

  const loadArticle = async () => {
    try {
      const data = await supportService.getResourceById(id, lang || 'en');
      setArticle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    try {
      // Constraint: Plain text share, no app-identifying metadata
      await Share.share({
        message: `${article.title}\n\nhttps://resource.local/${article.id}`, // Mock URL
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !article) {
    return <View className="flex-1 bg-white justify-center"><ActivityIndicator color="#1B4D5C" /></View>;
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-6 pt-16 pb-4 border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={28} color="#0F1E24" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} className="p-2 -mr-2">
          <Ionicons name="share-outline" size={24} color="#0F1E24" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <View className="bg-slate-100 self-start px-3 py-1 rounded-full mb-4">
          <Text className="text-slate-600 font-bold text-xs uppercase tracking-wider">{article.category.replace('_', ' ')}</Text>
        </View>

        <Markdown
          style={{
            body: { fontSize: 18, lineHeight: 28, color: '#7BA3B0' },
            heading1: { fontSize: 32, fontWeight: 'bold', color: '#EFF4F5', marginBottom: 16, marginTop: 8 },
            strong: { fontWeight: 'bold', color: '#EFF4F5' }
          }}
        >
          {article.content}
        </Markdown>
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
