import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceRecorderProps {
    isRecording: boolean;
    recordingDuration: number;
    onCancel: () => void;
    onSend: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    isRecording,
    recordingDuration,
    onCancel,
    onSend,
}) => {
    if (!isRecording) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View className="flex-1 flex-row items-center justify-between bg-slate-100 rounded-full min-h-[48px] px-4 py-2 border border-slate-200">
            <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-rose-500 mr-2 animate-pulse" />
                <Text className="text-slate-900 font-bold text-sm">
                    {formatDuration(recordingDuration)}
                </Text>
            </View>

            <View className="flex-row items-center space-x-3 gap-3">
                <TouchableOpacity onPress={onCancel} className="flex-row items-center px-2 py-1">
                    <Ionicons name="chevron-back" size={18} color="#64748B" />
                    <Text className="text-slate-500 text-xs font-medium ml-1">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onSend}
                    className="w-9 h-9 rounded-full bg-rose-600 items-center justify-center shadow-sm"
                >
                    <Ionicons name="send" size={16} color="#ffffff" className="ml-0.5" />
                </TouchableOpacity>
            </View>
        </View>
    );
};
