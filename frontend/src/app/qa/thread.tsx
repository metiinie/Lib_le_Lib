import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportService, QaMessage } from '@/services/support.service';

export default function QaThreadScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    // Initial fetch
    fetchMessages();
    
    // HTTP Polling for Q&A thread (low volume, doesn't need WebSockets)
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, []);

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await supportService.getQaMessages();
      // Assume latest first or re-sort
      setMessages(data.reverse()); 
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    try {
      const newMsg = await supportService.sendQaMessage(text);
      setMessages(prev => [newMsg, ...prev]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const renderMessage = ({ item }: { item: QaMessage }) => {
    const isMe = item.sender === 'me';
    return (
      <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
        {!isMe && (
          <Text className="text-xs text-slate-500 mb-1 ml-1 font-medium">Health Professional</Text>
        )}
        <View className={`p-4 rounded-2xl ${isMe ? 'bg-indigo-600 rounded-tr-sm' : 'bg-slate-100 rounded-tl-sm'}`}>
          <Text className={`text-base ${isMe ? 'text-white' : 'text-slate-900'}`}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View className="flex-1 bg-white justify-center"><ActivityIndicator color="#4f46e5" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-bold text-slate-900">Professional Q&A</Text>
          <Text className="text-xs text-green-600 font-bold">100% Anonymous</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted // Messages build from bottom up
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      <View className="p-4 bg-white border-t border-slate-100 flex-row items-center pb-8">
        <TextInput
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-base text-slate-900 mr-3"
          placeholder="Ask a question..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity 
          className="w-12 h-12 bg-indigo-600 rounded-full items-center justify-center shadow-sm"
          onPress={sendMessage}
        >
          <Ionicons name="send" size={20} color="#fff" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
