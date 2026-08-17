import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DateOfBirthPickerProps {
    value: string; // YYYY-MM-DD format
    onChange: (isoDate: string) => void;
    disabled?: boolean;
}

export function DateOfBirthPicker({ value, onChange, disabled }: DateOfBirthPickerProps) {
    const [activeDropdown, setActiveDropdown] = useState<'month' | 'day' | 'year' | null>(null);

    // Parse the current value
    const parsed = useMemo(() => {
        if (!value) return { month: 0, day: 0, year: 0 };
        const parts = value.split('-');
        return {
            year: parseInt(parts[0], 10) || 0,
            month: parseInt(parts[1], 10) || 0,
            day: parseInt(parts[2], 10) || 0,
        };
    }, [value]);

    // Generate year range: current year - 18 down to current year - 80
    const currentYear = new Date().getFullYear();
    const years = useMemo(() => {
        const list: number[] = [];
        for (let y = currentYear - 18; y >= currentYear - 80; y--) {
            list.push(y);
        }
        return list;
    }, [currentYear]);

    // Generate days based on selected month/year
    const days = useMemo(() => {
        const month = parsed.month || 1;
        const year = parsed.year || currentYear - 25;
        const daysInMonth = new Date(year, month, 0).getDate();
        const list: number[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            list.push(d);
        }
        return list;
    }, [parsed.month, parsed.year, currentYear]);

    const buildDate = useCallback((month: number, day: number, year: number) => {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }, []);

    const handleSelect = (type: 'month' | 'day' | 'year', val: number) => {
        let { month, day, year } = parsed;
        if (type === 'month') month = val;
        if (type === 'day') day = val;
        if (type === 'year') year = val;

        // Auto-set defaults for unset fields
        if (!year) year = currentYear - 25;
        if (!month) month = 1;
        if (!day) day = 1;

        // Clamp day to valid range for new month/year
        const maxDay = new Date(year, month, 0).getDate();
        if (day > maxDay) day = maxDay;

        onChange(buildDate(month, day, year));
        setActiveDropdown(null);
    };

    const monthLabel = parsed.month ? MONTHS[parsed.month - 1] : 'Month';
    const dayLabel = parsed.day ? String(parsed.day) : 'Date';
    const yearLabel = parsed.year ? String(parsed.year) : 'Year';

    const pillStyle = (isSet: boolean) =>
        `flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-xl border ${isSet ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
        }`;

    return (
        <>
            <View className="flex-row gap-3">
                {/* Month */}
                <TouchableOpacity
                    className={pillStyle(!!parsed.month)}
                    onPress={() => !disabled && setActiveDropdown('month')}
                    disabled={disabled}
                    style={disabled ? { opacity: 0.5 } : undefined}
                >
                    <Text className={`text-base font-semibold ${parsed.month ? 'text-slate-900' : 'text-slate-400'}`}>
                        {monthLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Day */}
                <TouchableOpacity
                    className={pillStyle(!!parsed.day)}
                    onPress={() => !disabled && setActiveDropdown('day')}
                    disabled={disabled}
                    style={[{ flex: 0.7 }, disabled ? { opacity: 0.5 } : undefined]}
                >
                    <Text className={`text-base font-semibold ${parsed.day ? 'text-slate-900' : 'text-slate-400'}`}>
                        {dayLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Year */}
                <TouchableOpacity
                    className={pillStyle(!!parsed.year)}
                    onPress={() => !disabled && setActiveDropdown('year')}
                    disabled={disabled}
                    style={[{ flex: 0.8 }, disabled ? { opacity: 0.5 } : undefined]}
                >
                    <Text className={`text-base font-semibold ${parsed.year ? 'text-slate-900' : 'text-slate-400'}`}>
                        {yearLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Dropdown Modal */}
            <Modal
                visible={activeDropdown !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setActiveDropdown(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setActiveDropdown(null)}
                    className="flex-1 bg-black/40 justify-end"
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                        <View className="bg-white rounded-t-3xl max-h-[50%] pb-8">
                            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
                                <Text className="text-lg font-bold text-slate-900">
                                    {activeDropdown === 'month' ? 'Select Month' : activeDropdown === 'day' ? 'Select Date' : 'Select Year'}
                                </Text>
                                <TouchableOpacity onPress={() => setActiveDropdown(null)} className="p-1">
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={
                                    activeDropdown === 'month'
                                        ? MONTHS.map((m, i) => ({ key: String(i + 1), label: m, value: i + 1 }))
                                        : activeDropdown === 'day'
                                            ? days.map(d => ({ key: String(d), label: String(d), value: d }))
                                            : years.map(y => ({ key: String(y), label: String(y), value: y }))
                                }
                                keyExtractor={item => item.key}
                                renderItem={({ item }) => {
                                    const isActive =
                                        (activeDropdown === 'month' && item.value === parsed.month) ||
                                        (activeDropdown === 'day' && item.value === parsed.day) ||
                                        (activeDropdown === 'year' && item.value === parsed.year);

                                    return (
                                        <TouchableOpacity
                                            className={`px-6 py-3.5 flex-row items-center justify-between ${isActive ? 'bg-blue-50' : ''}`}
                                            onPress={() => handleSelect(activeDropdown!, item.value)}
                                        >
                                            <Text className={`text-base ${isActive ? 'font-bold text-blue-700' : 'text-slate-700'}`}>
                                                {item.label}
                                            </Text>
                                            {isActive && <Ionicons name="checkmark" size={20} color="#1D4ED8" />}
                                        </TouchableOpacity>
                                    );
                                }}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
