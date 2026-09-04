import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    // Hide tab bar if any screen has tabBarStyle display: 'none'
    const currentDescriptor = descriptors[state.routes[state.index]?.key];
    const tabBarStyle = currentDescriptor?.options?.tabBarStyle as any;
    if (tabBarStyle?.display === 'none') {
        return null;
    }

    // Icons mapping per route
    const getIconName = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
        switch (routeName) {
            case 'discover':
                return isFocused ? 'home' : 'home-outline';
            case 'likes':
                return isFocused ? 'bookmark' : 'bookmark-outline';
            case 'matches':
                return isFocused ? 'chatbubbles' : 'chatbubbles-outline';
            case 'profile':
                return isFocused ? 'person' : 'person-outline';
            default:
                return isFocused ? 'square' : 'square-outline';
        }
    };

    const getLabel = (routeName: string, defaultTitle?: string): string => {
        if (defaultTitle) return defaultTitle;
        switch (routeName) {
            case 'discover':
                return 'Home';
            case 'likes':
                return 'Saved';
            case 'matches':
                return 'Inquiries';
            case 'profile':
                return 'Profile';
            default:
                return routeName;
        }
    };

    const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12;

    return (
        <View style={[styles.outerWrapper, { bottom: bottomInset }]} pointerEvents="box-none">
            <View style={styles.container}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    const label = getLabel(route.name, options.title);
                    const iconName = getIconName(route.name, isFocused);
                    const hasBadge = options.tabBarBadge !== undefined && options.tabBarBadge !== null;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarButtonTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            activeOpacity={0.8}
                            style={styles.tabItem}
                        >
                            {isFocused ? (
                                <View style={styles.activeIconCircle}>
                                    <Ionicons name={iconName} size={22} color="#FFFFFF" />
                                    {hasBadge && <View style={styles.activeBadge} />}
                                </View>
                            ) : (
                                <View style={styles.inactiveIconWrapper}>
                                    <Ionicons name={iconName} size={22} color="#8E9BAE" />
                                    {hasBadge && <View style={styles.inactiveBadge} />}
                                </View>
                            )}

                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.tabLabel,
                                    isFocused ? styles.activeLabel : styles.inactiveLabel,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        paddingHorizontal: 16,
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        backgroundColor: '#0E1720', // Dark navy / charcoal matching the image
        borderRadius: 40,
        paddingHorizontal: 10,
        paddingVertical: 8,
        width: '100%',
        maxWidth: 480, // Centered & elegant on Web viewports
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
    },
    activeIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10B981', // Vibrant emerald / teal highlight from image
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12, // Pops out slightly from the dark capsule
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
        elevation: 8,
        position: 'relative',
    },
    inactiveIconWrapper: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
    },
    activeLabel: {
        color: '#10B981',
        fontWeight: '700',
    },
    inactiveLabel: {
        color: '#8E9BAE',
    },
    activeBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    inactiveBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: '#10B981',
    },
});
