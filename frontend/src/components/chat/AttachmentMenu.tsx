import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AttachmentMenuProps {
    visible: boolean;
    onClose: () => void;
    onPickGallery: () => void;
    onTakePhoto: () => void;
    onStartVoice?: () => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
    visible,
    onClose,
    onPickGallery,
    onTakePhoto,
    onStartVoice,
}) => {
    if (!visible) return null;

    return (
        <View className="absolute bottom-24 left-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 flex-row space-x-2 gap-2">
            <TouchableOpacity
                className="items-center p-3 rounded-xl active:bg-slate-50"
                onPress={() => {
                    onClose();
                    onPickGallery();
                }}
            >
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-1">
                    <Ionicons name="images" size={24} color="#2A6B80" />
                </View>
                <Text className="text-xs font-medium text-slate-700">Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="items-center p-3 rounded-xl active:bg-slate-50"
                onPress={() => {
                    onClose();
                    onTakePhoto();
                }}
            >
                <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center mb-1">
                    <Ionicons name="camera" size={24} color="#4F46E5" />
                </View>
                <Text className="text-xs font-medium text-slate-700">Camera</Text>
            </TouchableOpacity>

            {onStartVoice && (
                <TouchableOpacity
                    className="items-center p-3 rounded-xl active:bg-slate-50"
                    onPress={() => {
                        onClose();
                        onStartVoice();
                    }}
                >
                    <View className="w-12 h-12 rounded-full bg-rose-100 items-center justify-center mb-1">
                        <Ionicons name="mic" size={24} color="#E11D48" />
                    </View>
                    <Text className="text-xs font-medium text-slate-700">Voice</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
