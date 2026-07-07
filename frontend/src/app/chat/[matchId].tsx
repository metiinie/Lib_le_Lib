import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageBubble, MessageProps } from '@/components/chat/MessageBubble';
import { cryptoService } from '@/services/crypto.service';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');

  // Mock recipient key for the current match
  const RECIPIENT_KEY = 'mock_recipient_pub_key';

  useEffect(() => {
    // Mock fetching chat history (which are encrypted ciphertexts)
    setTimeout(() => {
      setMessages([]);
      setLoading(false);
    }, 500);
  }, [matchId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const plaintext = input.trim();
    setInput('');

    try {
      // ENCRYPT BEFORE NETWORK
      const ciphertext = await cryptoService.encryptMessage(plaintext, RECIPIENT_KEY);
      
      const newMessage: MessageProps = {
        id: Date.now().toString(),
        senderId: 'me',
        isMe: true, // boolean, fixing the type below
        ciphertext,
        type: 'text'
      };

      // In real life, POST to /messages or send over WebSocket
      // await api.post(`/messages/${matchId}`, { ciphertext });
      
      // Optimistic UI update
      setMessages(prev => [newMessage, ...prev]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) {
    return <View className="flex-1 justify-center"><ActivityIndicator color="#208AEF" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Chat</Text>
        <TouchableOpacity onPress={() => router.push(`/video-call/${matchId}`)} className="p-2 -mr-2">
          <Ionicons name="videocam-outline" size={24} color="#208AEF" />
        </TouchableOpacity>
      </View>

      <FlatList
        className="flex-1 px-4"
        data={messages}
        keyExtractor={item => item.id}
        inverted // Puts new messages at the bottom
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
      />

      {/* Input Area */}
      <View className="px-4 py-3 border-t border-slate-100 flex-row items-center bg-white pb-8">
        <TouchableOpacity 
          className="mr-3"
          onPress={() => router.push(`/reveal/new`)} // Mock route for sharing photo
        >
          <Ionicons name="add-circle-outline" size={28} color="#64748b" />
        </TouchableOpacity>
        
        <TextInput
          className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-base text-slate-900"
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          multiline
        />

        <TouchableOpacity 
          className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={input.trim() ? '#ffffff' : '#94a3b8'} className="ml-1" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
