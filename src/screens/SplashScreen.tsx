import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const textFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo in
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 4,
                    useNativeDriver: true,
                }),
            ]),
            // Animate text
            Animated.timing(textFadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            // Wait a bit
            Animated.delay(1200),
        ]).start(() => {
            onFinish();
        });
    }, []);

    return (
        <View style={styles.container}>
            {/* Background pattern */}
            <View style={styles.backgroundPattern}>
                {[...Array(5)].map((_, i) => (
                    <View key={i} style={[styles.star, { top: 50 + i * 120, left: 30 + i * 60 }]}>
                        <Text style={styles.starText}>★</Text>
                    </View>
                ))}
            </View>

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Image
                    source={require('../../assets/ebb246.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* App name */}
            <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
                <Text style={styles.unitText}>ĐƠN VỊ E246</Text>
                <View style={styles.divider} />
                <Text style={styles.appSubtitle}>Từ điển ngôn ngữ các dân tộc</Text>
                <Text style={styles.langList}>Việt • Tày • Mông • Nùng • Dao</Text>
                <Text style={styles.langList}>LoLo • Sán chí • Sán chay • Sán dìu</Text>
            </Animated.View>

            {/* Bottom decoration */}
            <View style={styles.bottomDecor}>
                <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundPattern: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
    },
    star: {
        position: 'absolute',
    },
    starText: {
        fontSize: 60,
        color: colors.starGold,
    },
    logoContainer: {
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 200,
        height: 200,
    },
    textContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    appSubtitle: {
        fontSize: 18,
        color: colors.textPrimary,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    langList: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
        letterSpacing: 0.5,
    },
    divider: {
        width: 80,
        height: 3,
        backgroundColor: colors.accentPrimary,
        marginVertical: 16,
        borderRadius: 2,
    },
    unitText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.accentPrimary,
        letterSpacing: 3,
    },
    bottomDecor: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 14,
        color: colors.textMuted,
    },
});

export default SplashScreen;
