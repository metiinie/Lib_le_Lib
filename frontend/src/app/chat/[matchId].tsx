import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageBubble, MessageProps } from '@/components/chat/MessageBubble';
import { AttachmentMenu } from '@/components/chat/AttachmentMenu';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { cryptoService } from '@/services/crypto.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
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

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const isDiscreetMode = usePreferencesStore(state => state.isDiscreetMode);

  // Mock recipient key for the current match
  const RECIPIENT_KEY = 'mock_recipient_pub_key';

  const getMyId = () => {
    const token = useAuthStore.getState().token;
    if (!token) return '';
    try {
      const payload = token.split('.')[1];
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
    } catch (err: any) {
      if (err.isAxiosError && err.message === 'Network Error') {
        if (!isPoll) console.warn('Failed to fetch messages (Network Error)');
      } else {
        console.warn('Failed to fetch messages', err?.message || err);
      }
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
      const ciphertext = await cryptoService.encryptMessage(plaintext, RECIPIENT_KEY);

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

      setMessages(prev => [newMessage, ...prev]);
    } catch (err: any) {
      console.warn('Failed to send message', err?.message || err);
    }
  };

  const pickImage = async () => {
    setShowAttachmentMenu(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access gallery is required to send photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMessage: MessageProps = {
          id: Math.random().toString(),
          senderId: getMyId(),
          isMe: true,
          ciphertext: '📷 Sent a photo',
          type: 'image',
          sentAt: new Date().toISOString(),
        };
        setMessages(prev => [newMessage, ...prev]);
      }
    } catch (err) {
      console.warn('Error picking image', err);
    }
  };

  const takePhoto = async () => {
    setShowAttachmentMenu(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access camera is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newMessage: MessageProps = {
          id: Math.random().toString(),
          senderId: getMyId(),
          isMe: true,
          ciphertext: '📷 Sent a photo',
          type: 'image',
          sentAt: new Date().toISOString(),
        };
        setMessages(prev => [newMessage, ...prev]);
      }
    } catch (err) {
      console.warn('Error taking photo', err);
    }
  };

  const startRecording = async () => {
    setShowAttachmentMenu(false);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(recording);
        setIsRecording(true);
        setRecordingDuration(0);

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        alert('Permission to access microphone is required.');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;

    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (recordingDuration < 1) return;

      const newMessage: MessageProps = {
        id: Math.random().toString(),
        senderId: getMyId(),
        isMe: true,
        ciphertext: '🎤 Voice message',
        type: 'voice',
        duration: recordingDuration,
        audioUrl: uri || undefined,
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    } catch (error) {
      console.error('Failed to cancel recording', error);
    }
  };

  if (loading) {
    return <View className="flex-1 justify-center"><ActivityIndicator color="#1B4D5C" /></View>;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#0F1E24" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">Chat</Text>
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
        inverted
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        getItemLayout={(data, index) => (
          { length: 80, offset: 80 * index, index }
        )}
      />

      {/* Modular Attachment Popup Menu */}
      <AttachmentMenu
        visible={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onPickGallery={pickImage}
        onTakePhoto={takePhoto}
        onStartVoice={startRecording}
      />

      {/* Input Area */}
      <View className="px-4 py-3 border-t border-slate-100 flex-row items-center bg-white pb-8">
        {!isRecording ? (
          <>
            <TouchableOpacity
              className="mr-3 p-2 min-w-[48px] min-h-[48px] items-center justify-center"
              onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
            >
              <Ionicons name={showAttachmentMenu ? "close-circle" : "add-circle-outline"} size={28} color="#4A7A8A" />
            </TouchableOpacity>

            <TextInput
              className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-base text-slate-900 min-h-[48px]"
              placeholder="Type a message..."
              placeholderTextColor="#4A7A8A"
              value={input}
              onChangeText={setInput}
              multiline
              onFocus={() => setShowAttachmentMenu(false)}
            />

            {input.trim() ? (
              <TouchableOpacity
                className="ml-3 min-w-[48px] min-h-[48px] rounded-full items-center justify-center bg-blue-600 shadow-sm"
                onPress={sendMessage}
              >
                <Ionicons name="send" size={18} color="#ffffff" className="ml-0.5" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="ml-3 min-w-[48px] min-h-[48px] rounded-full items-center justify-center bg-slate-100"
                onPressIn={startRecording}
                onPressOut={stopRecordingAndSend}
              >
                <Ionicons name="mic" size={22} color="#4A7A8A" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* Modular Voice Recording Bar */
          <VoiceRecorder
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            onCancel={cancelRecording}
            onSend={stopRecordingAndSend}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
