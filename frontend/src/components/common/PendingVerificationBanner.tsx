import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verificationService } from '@/services/verification.service';

export function PendingVerificationBanner() {
    const [isPending, setIsPending] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkStatus = async () => {
            try {
                const { status } = await verificationService.checkStatus();
                if (isMounted) {
                    setIsPending(status === 'submitted' || status === 'in_review');
                }
            } catch (err) {
                console.warn('Failed to check verification status for banner', err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (!isPending) return null;

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                activeOpacity={0.9}
                className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 flex-row items-center justify-between"
            >
                <View className="flex-row items-center flex-1 mr-2">
                    <Ionicons name="time-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
                    <Text className="text-amber-800 font-semibold text-xs flex-1" numberOfLines={1}>
                        ⏳ Verification Pending — Profile & educational resources active. Full matching unlocks upon approval!
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D97706" />
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/60 items-center justify-center p-6">
                    <View className="bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-xl">
                        <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-4">
                            <Ionicons name="shield-checkmark" size={32} color="#D97706" />
                        </View>

                        <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
                            Verification Pending
                        </Text>

                        <Text className="text-slate-600 text-center mb-6 leading-relaxed text-sm">
                            Our admin team is currently reviewing your verification document. While waiting, you can explore your profile, settings, and educational resources!
                        </Text>

                        <View className="w-full bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                                <Text className="text-slate-800 font-medium text-xs">View & Edit Profile</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                                <Text className="text-slate-800 font-medium text-xs">Access Educational Resources & Advice</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="lock-closed" size={18} color="#D97706" style={{ marginRight: 8 }} />
                                <Text className="text-amber-800 font-medium text-xs">Swiping & Messaging (Unlocks upon approval)</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            className="bg-[#1B4D5C] w-full py-3.5 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-base">Got it!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}
