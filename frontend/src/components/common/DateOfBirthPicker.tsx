import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DateOfBirthPickerProps {
    value: string; // YYYY-MM-DD or ISO format or partial
    onChange: (isoDate: string) => void;
    disabled?: boolean;
}

function parseValue(val: string): { year: number; month: number; day: number } {
    if (!val || typeof val !== 'string') return { year: 0, month: 0, day: 0 };
    const trimmed = val.trim();
    if (!trimmed) return { year: 0, month: 0, day: 0 };

    // Try YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
        return {
            year: parseInt(ymdMatch[1], 10) || 0,
            month: parseInt(ymdMatch[2], 10) || 0,
            day: parseInt(ymdMatch[3], 10) || 0,
        };
    }

    // Try YYYY (just year)
    if (/^\d{4}$/.test(trimmed)) {
        return { year: parseInt(trimmed, 10) || 0, month: 0, day: 0 };
    }

    // Try Standard ISO or Date parse
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        return {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
        };
    }

    return { year: 0, month: 0, day: 0 };
}

export function DateOfBirthPicker({ value, onChange, disabled }: DateOfBirthPickerProps) {
    const [activeDropdown, setActiveDropdown] = useState<'month' | 'day' | 'year' | null>(null);

    // Internal selected state to allow picking Month or Year independently without forcing arbitrary defaults
    const parsedFromProps = useMemo(() => parseValue(value), [value]);

    const [selectedYear, setSelectedYear] = useState<number>(parsedFromProps.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(parsedFromProps.month);
    const [selectedDay, setSelectedDay] = useState<number>(parsedFromProps.day);

    // Sync with value prop if value changes externally
    useEffect(() => {
        const parsed = parseValue(value);
        if (parsed.year !== selectedYear) setSelectedYear(parsed.year);
        if (parsed.month !== selectedMonth) setSelectedMonth(parsed.month);
        if (parsed.day !== selectedDay) setSelectedDay(parsed.day);
    }, [value]);

    const currentYear = new Date().getFullYear();

    // Generate year range: currentYear down to currentYear - 100 (e.g. 2026 down to 1926)
    const years = useMemo(() => {
        const list: number[] = [];
        for (let y = currentYear; y >= currentYear - 100; y--) {
            list.push(y);
        }
        return list;
    }, [currentYear]);

    // Generate days based on selected month/year
    const days = useMemo(() => {
        const month = selectedMonth || 1;
        const year = selectedYear || currentYear - 20;
        const daysInMonth = new Date(year, month, 0).getDate();
        const list: number[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            list.push(d);
        }
        return list;
    }, [selectedMonth, selectedYear, currentYear]);

    const formatISO = (y: number, m: number, d: number) => {
        const mStr = String(m).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        return `${y}-${mStr}-${dStr}`;
    };

    const handleSelect = (type: 'month' | 'day' | 'year', val: number) => {
        let newYear = selectedYear;
        let newMonth = selectedMonth;
        let newDay = selectedDay;

        if (type === 'month') newMonth = val;
        if (type === 'day') newDay = val;
        if (type === 'year') newYear = val;

        // If user picked both year and month (or all 3), ensure day is valid
        if (newYear && newMonth) {
            if (!newDay) newDay = 1;
            const maxDay = new Date(newYear, newMonth, 0).getDate();
            if (newDay > maxDay) newDay = maxDay;
        }

        setSelectedYear(newYear);
        setSelectedMonth(newMonth);
        setSelectedDay(newDay);

        // Notify parent if we have a full valid date (Year + Month + Day)
        if (newYear && newMonth && newDay) {
            onChange(formatISO(newYear, newMonth, newDay));
        } else {
            onChange('');
        }

        setActiveDropdown(null);
    };

    const monthLabel = selectedMonth ? MONTHS[selectedMonth - 1] : 'Month';
    const dayLabel = selectedDay ? String(selectedDay) : 'Date';
    const yearLabel = selectedYear ? String(selectedYear) : 'Year';

    const pillStyle = (isSet: boolean) =>
        `flex-1 flex-row items-center justify-between px-4 py-3.5 rounded-xl border ${isSet ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
        }`;

    return (
        <>
            <View className="flex-row gap-3">
                {/* Month Picker Button */}
                <TouchableOpacity
                    className={pillStyle(!!selectedMonth)}
                    onPress={() => !disabled && setActiveDropdown('month')}
                    disabled={disabled}
                    style={disabled ? { opacity: 0.5 } : undefined}
                >
                    <Text className={`text-base font-semibold ${selectedMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                        {monthLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Day Picker Button */}
                <TouchableOpacity
                    className={pillStyle(!!selectedDay)}
                    onPress={() => !disabled && setActiveDropdown('day')}
                    disabled={disabled}
                    style={[{ flex: 0.7 }, disabled ? { opacity: 0.5 } : undefined]}
                >
                    <Text className={`text-base font-semibold ${selectedDay ? 'text-slate-900' : 'text-slate-400'}`}>
                        {dayLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>

                {/* Year Picker Button */}
                <TouchableOpacity
                    className={pillStyle(!!selectedYear)}
                    onPress={() => !disabled && setActiveDropdown('year')}
                    disabled={disabled}
                    style={[{ flex: 0.8 }, disabled ? { opacity: 0.5 } : undefined]}
                >
                    <Text className={`text-base font-semibold ${selectedYear ? 'text-slate-900' : 'text-slate-400'}`}>
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
                <Pressable
                    className="flex-1 bg-black/40 justify-end"
                    onPress={() => setActiveDropdown(null)}
                >
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className="bg-white rounded-t-3xl max-h-[60%] pb-8"
                    >
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
                            initialNumToRender={20}
                            maxToRenderPerBatch={20}
                            renderItem={({ item }) => {
                                const isActive =
                                    (activeDropdown === 'month' && item.value === selectedMonth) ||
                                    (activeDropdown === 'day' && item.value === selectedDay) ||
                                    (activeDropdown === 'year' && item.value === selectedYear);

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
                            showsVerticalScrollIndicator={true}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

