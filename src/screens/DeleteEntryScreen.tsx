import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Entry, LanguageCode, LANGS, getLangMeta } from '../types';
import colors from '../theme/colors';

interface DeleteEntryScreenProps {
    entry: Entry;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteEntryScreen: React.FC<DeleteEntryScreenProps> = ({
    entry,
    sourceLang,
    targetLang,
    onCancel,
    onConfirm,
}) => {
    const sourceMeta = getLangMeta(sourceLang);
    const targetMeta = getLangMeta(targetLang);
    const srcWord = entry.translations[sourceLang] || '—';
    const tgtWord = entry.translations[targetLang] || '—';

    const otherTranslations = LANGS.filter(
        l => l.code !== sourceLang && l.code !== targetLang && entry.translations[l.code]
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onCancel}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerSubtitleDanger}>Xóa mục từ</Text>
                    <Text style={styles.headerTitle}>
                        {sourceMeta.label} → {targetMeta.label}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.warningCard}>
                    <View style={styles.warningHeader}>
                        <View style={styles.warningIcon}>
                            <Text style={styles.warningIconText}>!</Text>
                        </View>
                        <View style={styles.warningInfo}>
                            <Text style={styles.warningTitle}>Bạn chắc chắn muốn xóa?</Text>
                            <Text style={styles.warningSubtitle}>
                                Thao tác này sẽ xóa mục từ và ghi chú/ví dụ liên quan.
                            </Text>
                        </View>
                    </View>

                    <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>
                                Từ nguồn ({sourceMeta.label})
                            </Text>
                            <Text style={styles.detailValue}>{srcWord}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>
                                Nghĩa đích ({targetMeta.label})
                            </Text>
                            <Text style={styles.detailValueAccent}>{tgtWord}</Text>
                        </View>

                        {otherTranslations.length > 0 && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Nghĩa ở ngôn ngữ khác</Text>
                                {otherTranslations.map(l => (
                                    <View key={l.code} style={styles.otherLangItem}>
                                        <Text style={styles.otherLangLabel}>{l.label}:</Text>
                                        <Text style={styles.otherLangValue}>
                                            {entry.translations[l.code]}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Action buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>Xác nhận xóa</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: colors.danger,
        backgroundColor: colors.bgSecondary,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: colors.danger,
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerSubtitleDanger: {
        fontSize: 14,
        color: colors.danger,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: 2,
    },
    content: {
        flex: 1,
        padding: 14,
    },
    warningCard: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 2,
        borderColor: colors.dangerBorder,
        padding: 18,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    warningIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.dangerBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    warningIconText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.dangerText,
    },
    warningInfo: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.dangerText,
    },
    warningSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    detailsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    detailItem: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    detailValueAccent: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textAccent,
    },
    otherLangItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    otherLangLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginRight: 6,
    },
    otherLangValue: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
        backgroundColor: colors.bgTertiary,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 20,
        backgroundColor: colors.danger,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
});

export default DeleteEntryScreen;
