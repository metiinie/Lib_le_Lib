import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { verificationService } from '@/services/verification.service';

export function useVerificationStatus() {
    const [status, setStatus] = useState<string>('submitted');
    const [isPendingVerification, setIsPendingVerification] = useState<boolean>(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState<boolean>(true);

    const checkStatus = useCallback(async () => {
        try {
            const res = await verificationService.checkStatus();
            const currentStatus = res?.status || 'submitted';
            setStatus(currentStatus);
            setIsPendingVerification(currentStatus === 'submitted' || currentStatus === 'in_review');
        } catch (err) {
            console.warn('Failed to check verification status', err);
        } finally {
            setIsCheckingVerification(false);
        }
    }, []);

    // Re-check status whenever the tab screen comes into view/focus
    useFocusEffect(
        useCallback(() => {
            checkStatus();
        }, [checkStatus])
    );

    // Poll status every 4 seconds while pending so approval reflects in real-time without tab switching
    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 4000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    return {
        status,
        isPendingVerification,
        isCheckingVerification,
        checkStatus,
    };
}
