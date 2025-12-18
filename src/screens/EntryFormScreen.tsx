import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    Entry,
    RichDoc,
    LanguageCode,
    LANGS,
    getLangMeta,
} from '../types';
import colors from '../theme/colors';
import RichDocEditor from '../components/RichDocEditor';
import AudioPicker from '../components/AudioPicker';
import { Picker } from '@react-native-picker/picker';

interface EntryFormScreenProps {
    mode: 'create' | 'edit';
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
    initialEntry?: Entry;
    initialDocForTarget?: RichDoc | null;
    onCancel: () => void;
    onSubmit: (entry: Entry, docForTarget: RichDoc | null) => void;
}

const EntryFormScreen: React.FC<EntryFormScreenProps> = ({
    mode,
    sourceLang,
    targetLang,
    initialEntry,
    initialDocForTarget,
    onCancel,
    onSubmit,
}) => {
    const [translations, setTranslations] = useState<Partial<Record<LanguageCode, string>>>(() => {
        if (initialEntry) {
            return { ...initialEntry.translations };
        }
        return {
            vi: '',
            tay: '',
            en: '',
            [sourceLang]: '',
            [targetLang]: '',
        };
    });

    const [audioPronTarget, setAudioPronTarget] = useState(() => {
        if (initialEntry?.lemmaAudios?.[targetLang]) {
            return initialEntry.lemmaAudios[targetLang] || '';
        }
        return '';
    });

    const [doc, setDoc] = useState<RichDoc | null>(initialDocForTarget || null);
    const [showMoreLangs, setShowMoreLangs] = useState(false);

    const sourceMeta = getLangMeta(sourceLang);
    const targetMeta = getLangMeta(targetLang);

    const handleChangeTranslation = (lang: LanguageCode, value: string) => {
        setTranslations(prev => ({ ...prev, [lang]: value }));
    };

    const handleSave = () => {
        const src = (translations[sourceLang] || '').trim();
        const dst = (translations[targetLang] || '').trim();
        if (!src || !dst) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ từ nguồn và đích.');
            return;
        }

        const baseId = mode === 'create' ? Date.now() : initialEntry!.id;

        const entry: Entry = {
            id: baseId,
            translations,
            lemmaAudios: {
                ...(initialEntry?.lemmaAudios || {}),
                ...(audioPronTarget.trim() ? { [targetLang]: audioPronTarget.trim() } : {}),
            },
        };

        onSubmit(entry, doc);
    };

    const otherLangs = LANGS.filter(
        l => l.code !== sourceLang && l.code !== targetLang
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onCancel}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerSubtitle}>
                        {mode === 'create' ? 'Tạo mục từ mới' : 'Chỉnh sửa mục từ'}
                    </Text>
                    <Text style={styles.headerTitle}>
                        {sourceMeta.label} ⇄ {targetMeta.label}
                    </Text>
                </View>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Basic translations */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Từ & nghĩa cơ bản</Text>
                            <Text style={styles.sectionSubtitle}>Bắt buộc</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{sourceMeta.label}</Text>
                            <TextInput
                                value={translations[sourceLang] || ''}
                                onChangeText={value => handleChangeTranslation(sourceLang, value)}
                                style={[styles.textInput, { backgroundColor: "white" }]}
                                placeholder={`Từ bằng ${sourceMeta.label}…`}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>{targetMeta.label}</Text>
                            <TextInput
                                value={translations[targetLang] || ''}
                                onChangeText={value => handleChangeTranslation(targetLang, value)}
                                style={[styles.textInput, { backgroundColor: "white" }]}
                                placeholder={`Nghĩa bằng ${targetMeta.label}…`}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Other languages */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => setShowMoreLangs(v => !v)}
                        >
                            <Text style={styles.sectionTitle}>Thêm nghĩa ở ngôn ngữ khác</Text>
                            <Text style={styles.sectionSubtitle}>{showMoreLangs ? 'Ẩn' : 'Hiện'}</Text>
                        </TouchableOpacity>

                        {showMoreLangs && (
                            <ScrollView style={styles.moreLangsContainer} nestedScrollEnabled>
                                {otherLangs.map(l => (
                                    <View key={l.code} style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>{l.label}</Text>
                                        <TextInput
                                            value={translations[l.code] || ''}
                                            onChangeText={value => handleChangeTranslation(l.code, value)}
                                            style={[styles.textInput, { backgroundColor: "white" }]}
                                            placeholder={`Nghĩa bằng ${l.label}…`}
                                            placeholderTextColor={colors.textMuted}
                                        />
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Audio pronunciation */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                Audio phát âm ({targetMeta.label})
                            </Text>
                            <Text style={styles.sectionSubtitle}>Tùy chọn</Text>
                        </View>

                        <AudioPicker
                            value={audioPronTarget}
                            onChange={setAudioPronTarget}
                            label="Ghi âm hoặc chọn file audio:"
                        />
                        <Text style={styles.helpText}>
                            Nút nghe sẽ ưu tiên phát audio này, nếu trống sẽ dùng TTS.
                        </Text>
                    </View>

                    {/* Rich doc editor */}
                    <RichDocEditor
                        initialDoc={doc || undefined}
                        onChange={newDoc => setDoc(newDoc)}
                        title="Ghi chú & ví dụ"
                    />

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        borderBottomColor: colors.accentPrimary,
        backgroundColor: colors.bgSecondary,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: colors.accentPrimary,
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.accentPrimary,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: 2,
    },
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.accentPrimary,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.bgPrimary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 14,
    },
    section: {
        marginTop: 14,
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        padding: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
    },
    inputGroup: {
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#000000',
    },
    moreLangsContainer: {
        maxHeight: 200,
    },
    helpText: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 6,
    },
    swapButton: {
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.accentPrimary,
        marginVertical: 10,
    },
    swapButtonText: {
        fontSize: 14,
        color: colors.accentPrimary,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 100,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
});

export default EntryFormScreen;
