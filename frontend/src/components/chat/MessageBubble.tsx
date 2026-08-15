import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { cryptoService } from '@/services/crypto.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export interface MessageProps {
  id: string;
  senderId: string;
  isMe: boolean;
  ciphertext: string;
  type: 'text' | 'image' | 'voice';
  duration?: number;
  audioUrl?: string;
  photoDetails?: {
    blurhash: string;
    url?: string;
    revealGranted: boolean;
  };
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export function MessageBubble({ message }: { message: MessageProps }) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    // Decrypt on render!
    const decrypt = async () => {
      try {
        const decoded = await cryptoService.decryptMessage(message.ciphertext);
        setPlaintext(decoded);
      } catch (err) {
        console.error('Decryption failed', err);
        setPlaintext('Failed to decrypt message.');
      } finally {
        setLoading(false);
      }
    };
    decrypt();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [message.ciphertext]);

  const toggleAudioPlayback = async () => {
    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else if (message.audioUrl) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: message.audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        // Fallback simulation toggle if local demo audio URL is not set
        setIsPlaying(!isPlaying);
      }
    } catch (err) {
      console.warn('Audio playback error', err);
      setIsPlaying(!isPlaying);
    }
  };

  const isMe = message.isMe;

  return (
    <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
      <View className={`rounded-2xl px-4 py-3 ${isMe ? 'bg-blue-600 rounded-tr-sm' : 'bg-slate-100 rounded-tl-sm'}`}>
        {loading ? (
          <ActivityIndicator size="small" color={isMe ? '#fff' : '#4A7A8A'} />
        ) : message.type === 'text' ? (
          <Text className={`text-base ${isMe ? 'text-white' : 'text-slate-900'}`}>
            {plaintext}
          </Text>
        ) : message.type === 'voice' ? (
          <View className="flex-row items-center space-x-3 gap-3 min-w-[160px]">
            <TouchableOpacity
              onPress={toggleAudioPlayback}
              className={`w-10 h-10 rounded-full items-center justify-center ${isMe ? 'bg-white/20' : 'bg-blue-100'}`}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color={isMe ? 'white' : '#1B4D5C'}
                className={isPlaying ? "" : "ml-0.5"}
              />
            </TouchableOpacity>

            <View className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <View className={`h-full ${isPlaying ? 'w-2/3' : 'w-1/3'} ${isMe ? 'bg-white' : 'bg-blue-600'}`} />
            </View>

            <Text className={`text-xs font-medium ${isMe ? 'text-white/90' : 'text-slate-500'}`}>
              {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:05'}
            </Text>
          </View>
        ) : (
          <View className="w-48 h-64 rounded-xl overflow-hidden bg-slate-200">
            <BlurredPhoto
              blurhash={message.photoDetails?.blurhash || ''}
              revealGranted={message.photoDetails?.revealGranted || false}
              photoUrl={message.photoDetails?.url}
            />
          </View>
        )}
      </View>
      {isMe && (
        <View className="flex-row justify-end mt-1 px-1">
          {message.readAt ? (
            <Ionicons name="checkmark-done" size={16} color="#1B4D5C" />
          ) : message.deliveredAt ? (
            <Ionicons name="checkmark-done" size={16} color="#4A7A8A" />
          ) : (
            <Ionicons name="checkmark" size={16} color="#4A7A8A" />
          )}
        </View>
      )}
    </View>
  );
}
