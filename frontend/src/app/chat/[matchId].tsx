import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageBubble, MessageProps } from '@/components/chat/MessageBubble';
import { cryptoService } from '@/services/crypto.service';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/state/auth.store';
import { ChatHeaderMenu } from '@/components/chat/ChatHeaderMenu';
import { usePreferencesStore } from '@/stores/preferences.store';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  
  const isDiscreetMode = usePreferencesStore(state => state.isDiscreetMode);

  // Mock recipient key for the current match
  const RECIPIENT_KEY = 'mock_recipient_pub_key';

  const getMyId = () => {
    const token = useAuthStore.getState().token;
    if (!token) return '';
    try {
      const payload = token.split('.')[1];
      // RN doesn't always have atob globally depending on Hermes config, but
      // crypto.service uses it. Just to be safe, use basic parsing.
      const decoded = JSON.parse(atob(payload));
      return decoded.sub || decoded.id;
    } catch (e) {
      return '';
    }
  };

  const fetchMessages = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      const res = await api.get(`/matches/${matchId}/messages?limit=100&offset=0`);
      const myId = getMyId();
      
      const formattedMessages: MessageProps[] = res.data.data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        isMe: msg.senderId === myId,
        ciphertext: atob(msg.ciphertext),
        type: msg.messageType,
        sentAt: msg.sentAt,
        deliveredAt: msg.deliveredAt,
        readAt: msg.readAt,
      }));

      setMessages(formattedMessages);
      setLoading(false);

      // If NOT in discreet mode, mark unread received messages as read
      if (!isDiscreetMode) {
        const unreadReceived = formattedMessages.filter(m => !m.isMe && !m.readAt);
        unreadReceived.forEach(async (m) => {
          try {
            await api.patch(`/matches/${matchId}/messages/${m.id}/read`);
          } catch (e) {
            console.error('Failed to mark read', e);
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(interval);
  }, [matchId, isDiscreetMode]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const plaintext = input.trim();
    setInput('');

    try {
      // ENCRYPT BEFORE NETWORK
      const ciphertext = await cryptoService.encryptMessage(plaintext, RECIPIENT_KEY);
      
      // Post to real backend
      // Backend expects ciphertext and nonce to be base64 strings
      const res = await api.post(`/matches/${matchId}/messages`, {
        messageType: 'text',
        ciphertext: btoa(ciphertext),
        nonce: btoa('dummy_nonce'),
      });
      
      const newMessage: MessageProps = {
        id: res.data.id,
        senderId: getMyId(),
        isMe: true,
        ciphertext,
        type: 'text',
        sentAt: res.data.sentAt,
      };

      // Optimistic UI update
      setMessages(prev => [newMessage, ...prev]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading) {
    return <View className="flex-1 justify-center"><ActivityIndicator color="#1B4D5C" /></View>;
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#0F1E24" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Chat</Text>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.push(`/video-call/${matchId}`)} className="p-2">
            <Ionicons name="videocam-outline" size={24} color="#1B4D5C" />
          </TouchableOpacity>
          <ChatHeaderMenu matchId={matchId} />
        </View>
      </View>

      <FlatList
        className="flex-1 px-4"
        data={messages}
        keyExtractor={item => item.id}
        inverted // Puts new messages at the bottom
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        getItemLayout={(data, index) => (
          { length: 80, offset: 80 * index, index } // Optimization for lists
        )}
      />

      {/* Input Area */}
      <View className="px-4 py-3 border-t border-slate-100 flex-row items-center bg-white pb-8">
        <TouchableOpacity 
          className="mr-3 p-2 min-w-[48px] min-h-[48px] items-center justify-center"
          onPress={() => router.push(`/reveal/new`)} // Mock route for sharing photo
          accessibilityLabel="Share photo"
          accessibilityHint="Navigates to photo sharing screen"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={28} color="#4A7A8A" />
        </TouchableOpacity>
        
        <TextInput
          className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-base text-slate-900 min-h-[48px]"
          placeholder="Type a message..."
          placeholderTextColor="#4A7A8A"
          value={input}
          onChangeText={setInput}
          multiline
          accessibilityLabel="Message input"
        />

        <TouchableOpacity 
          className={`ml-3 min-w-[48px] min-h-[48px] rounded-full items-center justify-center ${input.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
          onPress={sendMessage}
          disabled={!input.trim()}
          accessibilityLabel="Send message"
          accessibilityRole="button"
        >
          <Ionicons name="send" size={18} color={input.trim() ? '#ffffff' : '#4A7A8A'} className="ml-1" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
