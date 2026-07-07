import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { cryptoService } from '@/services/crypto.service';
import { BlurredPhoto } from '@/components/photos/BlurredPhoto';

export interface MessageProps {
  id: string;
  senderId: string;
  isMe: boolean;
  ciphertext: string;
  type: 'text' | 'image';
  photoDetails?: {
    blurhash: string;
    url?: string;
    revealGranted: boolean;
  };
}

export function MessageBubble({ message }: { message: MessageProps }) {
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [message.ciphertext]);

  const isMe = message.isMe;

  return (
    <View className={`mb-4 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
      <View className={`rounded-2xl px-4 py-3 ${isMe ? 'bg-blue-600 rounded-tr-sm' : 'bg-slate-100 rounded-tl-sm'}`}>
        {loading ? (
          <ActivityIndicator size="small" color={isMe ? '#fff' : '#64748b'} />
        ) : message.type === 'text' ? (
          <Text className={`text-base ${isMe ? 'text-white' : 'text-slate-900'}`}>
            {plaintext}
          </Text>
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
    </View>
  );
}
