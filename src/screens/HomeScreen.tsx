import React, { useState, useMemo, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Linking,
    Alert,
    Image,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import {
    Entry,
    RichDoc,
    LanguageCode,
    LANGS,
    getLangMeta,
    summarizeDoc,
} from '../types';
import colors from '../theme/colors';
import RichDocView from '../components/RichDocView';
import { Picker } from '@react-native-picker/picker';

// Dictionary pair options - combinations of Vietnamese with other languages
interface DictionaryPair {
    id: string;
    label: string;
    source: LanguageCode;
    target: LanguageCode;
}

const DICTIONARY_PAIRS: DictionaryPair[] = [
    { id: 'vi-tay', label: 'Việt - Tày', source: 'vi', target: 'tay' },
    { id: 'vi-dao', label: 'Việt - Dao', source: 'vi', target: 'dao' },
    { id: 'vi-mong', label: 'Việt - Mông', source: 'vi', target: 'mong' },
    { id: 'vi-lolo', label: 'Việt - Lô Lô', source: 'vi', target: 'lolo' },
    { id: 'vi-sanchay', label: 'Việt - Sán Chay', source: 'vi', target: 'sanchay' },
    { id: 'vi-sandiu', label: 'Việt - Sán Dìu', source: 'vi', target: 'sandiu' },
    { id: 'vi-sanchi', label: 'Việt - Sán Chí', source: 'vi', target: 'sanchi' },
    { id: 'vi-nung', label: 'Việt - Nùng', source: 'vi', target: 'nung' },
];

interface HomeScreenProps {
    onNavigateCreate: () => void;
    onNavigateEdit: (id: number) => void;
    onNavigateDelete: (id: number) => void;
    entries: Entry[];
    docsMap: Record<string, RichDoc>;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
    onChangeSourceLang: (code: LanguageCode) => void;
    onChangeTargetLang: (code: LanguageCode) => void;
    onImportEntries: (newEntries: Entry[], newDocs?: Record<string, RichDoc>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    onNavigateCreate,
    onNavigateEdit,
    onNavigateDelete,
    entries,
    docsMap,
    sourceLang,
    targetLang,
    onChangeSourceLang,
    onChangeTargetLang,
    onImportEntries,
}) => {
    const [query, setQuery] = useState('');
    const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
    const [isDisplaySwapped, setIsDisplaySwapped] = useState(false);
    const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    // Display languages based on swap state
    const displaySourceLang = isDisplaySwapped ? targetLang : sourceLang;
    const displayTargetLang = isDisplaySwapped ? sourceLang : targetLang;
    const displaySourceMeta = getLangMeta(displaySourceLang);
    const displayTargetMeta = getLangMeta(displayTargetLang);

    const sourceMeta = getLangMeta(sourceLang);
    const targetMeta = getLangMeta(targetLang);

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];
            const fileContent = await FileSystem.readAsStringAsync(file.uri, {
                encoding: 'base64',
            });

            const workbook = XLSX.read(fileContent, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

            // Map column names to language codes
            const columnMappings: Record<string, LanguageCode> = {
                // Tiếng Việt
                'Tiếng Việt': 'vi',
                'Tieng Viet': 'vi',
                'Vietnamese': 'vi',
                'Viet': 'vi',
                'vi': 'vi',
                // Tiếng Tày
                'Tiếng Tày': 'tay',
                'Tieng Tay': 'tay',
                'Tay': 'tay',
                'tay': 'tay',
                // Tiếng Mông
                'Tiếng Mông': 'mong',
                'Tieng Mong': 'mong',
                'Mong': 'mong',
                'mong': 'mong',
                // Tiếng Nùng
                'Tiếng Nùng': 'nung',
                'Tieng Nung': 'nung',
                'Nung': 'nung',
                'nung': 'nung',
                // Tiếng Dao
                'Tiếng Dao': 'dao',
                'Tieng Dao': 'dao',
                'Dao': 'dao',
                'dao': 'dao',
                // Tiếng Lô Lô
                'Tiếng Lô Lô': 'lolo',
                'Tieng Lo Lo': 'lolo',
                'LoLo': 'lolo',
                'Lo Lo': 'lolo',
                'lolo': 'lolo',
                // Tiếng Sán chí
                'Tiếng Sán chí': 'sanchi',
                'Tieng San chi': 'sanchi',
                'San chi': 'sanchi',
                'Sán chí': 'sanchi',
                'sanchi': 'sanchi',
                // Tiếng Sán chay
                'Tiếng Sán chay': 'sanchay',
                'Tieng San chay': 'sanchay',
                'San chay': 'sanchay',
                'Sán chay': 'sanchay',
                'sanchay': 'sanchay',
                // Tiếng Sán
                'Tiếng Sán Dìu': 'sandiu',
                'Tieng San Diu': 'sandiu',
                'San Diu': 'sandiu',
                'Sán Dìu': 'sandiu',
                'sandiu': 'sandiu',
            };

            const newEntries: Entry[] = data.map((row, index) => {
                const translations: Partial<Record<LanguageCode, string>> = {};

                // Map columns to language codes
                Object.keys(row).forEach(columnName => {
                    const langCode = columnMappings[columnName];
                    if (langCode && row[columnName]) {
                        translations[langCode] = String(row[columnName]).trim();
                    }
                });

                // Also try to match by LANGS labels
                LANGS.forEach(lang => {
                    if (!translations[lang.code]) {
                        const value = row[lang.label] || row[lang.code] || '';
                        if (value) {
                            translations[lang.code] = String(value).trim();
                        }
                    }
                });

                // Get notes column
                const notes = row['Ghi chú'] || row['Ghi chu'] || row['Notes'] || row['notes'] || '';

                return {
                    id: Date.now() + index,
                    translations,
                    pronunciation: {},
                    lemmaAudios: {},
                    notes: String(notes).trim(),
                };
            }).filter(entry =>
                Object.values(entry.translations).some(v => v && v.trim())
            );

            if (newEntries.length === 0) {
                Alert.alert('Thông báo', 'Không tìm thấy dữ liệu hợp lệ trong file Excel.\n\nĐảm bảo file có các cột: Tiếng Việt, Tiếng Tày, ...');
                return;
            }

            // Create RichDocs for entries with notes
            const newDocs: Record<string, RichDoc> = {};
            newEntries.forEach(entry => {
                if ((entry as any).notes) {
                    const docKey = `${entry.id}:${targetLang}`;
                    newDocs[docKey] = {
                        blocks: [
                            {
                                type: 'paragraph',
                                text: (entry as any).notes,
                            },
                        ],
                    };
                }
            });

            // Remove notes property from entries (not part of Entry type)
            const cleanEntries = newEntries.map((entryWithNotes) => {
                const { notes, ...entry } = entryWithNotes as any;
                return entry as Entry;
            });

            onImportEntries(cleanEntries, Object.keys(newDocs).length > 0 ? newDocs : undefined);
            Alert.alert('Thành công', `Đã nhập ${cleanEntries.length} mục từ từ file Excel.`);
        } catch (error) {
            console.error('Import error:', error);
            Alert.alert('Lỗi', 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.');
        }
    };

    // Filter entries that have BOTH source and target language translations
    const entriesWithBothLangs = useMemo(() => {
        return entries.filter(item => {
            const hasSrc = item.translations[sourceLang] && item.translations[sourceLang]!.trim() !== '';
            const hasDst = item.translations[targetLang] && item.translations[targetLang]!.trim() !== '';
            return hasSrc && hasDst;
        });
    }, [entries, sourceLang, targetLang]);

    // Then apply search filter
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entriesWithBothLangs;
        return entriesWithBothLangs.filter(item => {
            const src = (item.translations[sourceLang] || '').toLowerCase();
            const dst = (item.translations[targetLang] || '').toLowerCase();
            return src.includes(q) || dst.includes(q);
        });
    }, [entriesWithBothLangs, query, sourceLang, targetLang]);

    const getDocKey = (entryId: number, lang: LanguageCode) => `${entryId}:${lang}`;

    const getDocForEntry = (entryId: number, lang: LanguageCode): RichDoc | undefined => {
        return docsMap[getDocKey(entryId, lang)];
    };

    const speak = async (entry: Entry, word: string, lang: LanguageCode) => {
        const uri = entry.lemmaAudios?.[lang];
        if (uri && uri.trim()) {
            try {
                // Stop any existing playback
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }

                // Set audio mode for playback
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    playsInSilentModeIOS: true,
                });

                setPlayingAudioId(entry.id);

                const { sound } = await Audio.Sound.createAsync(
                    { uri: uri },
                    { shouldPlay: true }
                );
                soundRef.current = sound;

                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setPlayingAudioId(null);
                        soundRef.current?.unloadAsync();
                        soundRef.current = null;
                    }
                });
            } catch (error) {
                console.error('Failed to play audio:', error);
                setPlayingAudioId(null);
                Alert.alert('Lỗi', 'Không thể phát audio: ' + uri);
            }
            return;
        }

        // Use TTS
        const meta = getLangMeta(lang);
        Speech.speak(word, {
            language: meta.ttsLang,
        });
    };

    const handleChangeSourceLang = (code: LanguageCode) => {
        if (code === targetLang) {
            onChangeTargetLang(sourceLang);
        }
        onChangeSourceLang(code);
    };

    const handleChangeTargetLang = (code: LanguageCode) => {
        if (code === sourceLang) {
            onChangeSourceLang(targetLang);
        }
        onChangeTargetLang(code);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/ebb246.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerSubtitle}>ĐƠN VỊ E246</Text>
                    <Text style={styles.headerTitle}>Từ điển ngôn ngữ các dân tộc</Text>
                </View>
            </View>

            {/* Dictionary Pair Selector */}
            <View style={styles.langSection}>
                <View style={styles.langSectionHeader}>
                    <View style={styles.headerButtonsRow}>
                        <TouchableOpacity
                            style={styles.infoButton}
                            onPress={() => Alert.alert(
                                'Thông tin',
                                'Đây là phần mềm từ điển đa ngôn ngữ, bản quyền thuộc về Trung đoàn 246, Sư đoàn 346, Quân khu 1.',
                                [{ text: 'Đóng', style: 'default' }]
                            )}
                        >
                            <Text style={styles.infoButtonText}>ⓘ Thông tin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.importButton} onPress={handleImportExcel}>
                            <Image source={require('../../assets/icon/import.png')} style={styles.buttonIcon} />
                            <Text style={styles.importButtonText}>Nhập file</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addButton} onPress={onNavigateCreate}>
                            <Text style={styles.addButtonText}>+ Thêm mục từ</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dictionary Pair Dropdown with Swap Button */}
                <View style={styles.dictPairContainer}>
                    <Text style={styles.pickerLabel}>Chọn từ điển</Text>
                    <View style={styles.dictPairRow}>
                        <View style={styles.dictPairWrapper}>
                            <Picker
                                selectedValue={`${sourceLang}-${targetLang}`}
                                onValueChange={(pairId: string) => {
                                    const pair = DICTIONARY_PAIRS.find(p => p.id === pairId);
                                    if (pair) {
                                        onChangeSourceLang(pair.source);
                                        onChangeTargetLang(pair.target);
                                        setIsDisplaySwapped(false); // Reset swap when changing dictionary
                                    }
                                }}
                                style={styles.dictPairPicker}
                                dropdownIconColor={colors.textPrimary}
                                mode="dropdown"
                            >
                                {DICTIONARY_PAIRS.map(pair => (
                                    <Picker.Item
                                        key={pair.id}
                                        label={isDisplaySwapped
                                            ? `${getLangMeta(pair.target).label} - ${getLangMeta(pair.source).label}`
                                            : pair.label}
                                        value={pair.id}
                                        style={styles.pickerItem}
                                        color={colors.textPrimary}
                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Swap Icon Button */}
                        <TouchableOpacity
                            style={[styles.swapIconButton, isDisplaySwapped && styles.swapIconButtonActive]}
                            onPress={() => setIsDisplaySwapped(prev => !prev)}
                        >
                            <Text style={styles.swapIconText}>⇄</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.entryCountText}>
                        {entriesWithBothLangs.length} mục từ • {displaySourceMeta.label} → {displayTargetMeta.label}
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Image source={require('../../assets/icon/search.png')} style={styles.searchIconImage} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={`Tìm theo ${displaySourceMeta.label} hoặc ${displayTargetMeta.label}…`}
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                />
            </View>

            {/* Entry list */}
            <ScrollView style={styles.entryList} showsVerticalScrollIndicator={false}>
                {filtered.length === 0 && (
                    <Text style={styles.emptyText}>Không tìm thấy mục từ nào.</Text>
                )}

                {filtered.map(item => {
                    // Use display languages for swapped display
                    const srcWord = item.translations[displaySourceLang] || '—';
                    const tgtWord = item.translations[displayTargetLang] || '—';
                    const doc = getDocForEntry(item.id, displayTargetLang);
                    const summary = summarizeDoc(doc);
                    const isExpanded = expandedEntryId === item.id;

                    // Merge notes: prioritize RichDoc summary, fallback to item.notes
                    const notesDisplay = summary || item.notes || '';

                    return (
                        <View key={item.id} style={styles.entryCard}>
                            <TouchableOpacity
                                onPress={() =>
                                    setExpandedEntryId(prev => (prev === item.id ? null : item.id))
                                }
                                activeOpacity={0.8}
                            >
                                {/* Source word */}
                                <View style={styles.entrySourceRow}>
                                    <View style={styles.sourceBadge}>
                                        <Text style={styles.sourceBadgeText}>{displaySourceMeta.label}</Text>
                                    </View>
                                    <Text style={styles.sourceWord} numberOfLines={1}>
                                        {srcWord}
                                    </Text>
                                </View>

                                {/* Target word */}
                                <View style={styles.entryTargetRow}>
                                    <View style={styles.targetInfo}>
                                        <Text style={styles.targetWord}>{tgtWord}</Text>
                                    </View>

                                    {tgtWord && tgtWord !== '—' && (
                                        <TouchableOpacity
                                            style={styles.speakButton}
                                            onPress={() => speak(item, tgtWord, targetLang)}
                                        >
                                            <Text style={styles.speakButtonText}>▶ Nghe</Text>
                                        </TouchableOpacity>
                                    )}

                                </View>
                            </TouchableOpacity>

                            {/* Notes and Action buttons row */}
                            <View style={styles.actionRow}>
                                {/* Notes on left - unified display */}
                                <View style={styles.notesContainer}>
                                    {notesDisplay ? (
                                        <Text style={styles.notesText} numberOfLines={2}>
                                            {notesDisplay}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Buttons on right */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => onNavigateEdit(item.id)}
                                    >
                                        <Text style={styles.editButtonText}>✎ Sửa</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => onNavigateDelete(item.id)}
                                    >
                                        <Text style={styles.deleteButtonText}>✕ Xóa</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Expanded doc view */}
                            {isExpanded && <RichDocView doc={doc} />}
                        </View>
                    );
                })}

                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: colors.accentPrimary,
        backgroundColor: colors.bgSecondary,
    },
    headerLogo: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        letterSpacing: 2,
        color: colors.accentPrimary,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: 2,
    },
    previewBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: colors.accentPrimary,
    },
    previewBadgeText: {
        fontSize: 12,
        color: colors.bgPrimary,
        fontWeight: '600',
    },
    langSection: {
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    langSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    langSectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    langSectionSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
    },
    headerButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
        justifyContent: "space-between",
    },
    infoButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
    },
    infoButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    importButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
        gap: 6,
    },
    buttonIcon: {
        width: 18,
        height: 18,
        tintColor: colors.textPrimary,
    },
    importButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    addButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: colors.accentPrimary,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.bgPrimary,
    },
    langPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    swapLangButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accentPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    swapLangButtonText: {
        fontSize: 20,
        color: colors.bgPrimary,
        fontWeight: 'bold',
    },
    langPickerContainer: {
        flex: 1,
    },
    pickerLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    pickerWrapper: {
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    picker: {
        height: 52,
        color: colors.textPrimary,
        fontSize: 16,
    },
    pickerItem: {
        fontSize: 16,
        backgroundColor: colors.bgSecondary,
    },
    dictPairContainer: {
        marginTop: 8,
    },
    dictPairWrapper: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 2,
        borderColor: colors.accentPrimary,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    dictPairPicker: {
        height: 52,
        color: colors.textPrimary,
        fontSize: 18,
    },
    entryCountText: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },
    dictPairRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    swapIconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.bgTertiary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.borderSecondary,
    },
    swapIconButtonActive: {
        backgroundColor: colors.accentPrimary,
        borderColor: colors.accentPrimary,
    },
    swapIconText: {
        fontSize: 22,
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 12,
        borderRadius: 20,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        paddingHorizontal: 12,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchIconImage: {
        width: 20,
        height: 20,
        marginRight: 10,
        tintColor: colors.textMuted,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: colors.textPrimary,
    },
    entryList: {
        flex: 1,
        paddingHorizontal: 12,
        marginTop: 12,
    },
    emptyText: {
        fontSize: 12,
        color: colors.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 24,
    },
    entryCard: {
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        padding: 14,
        marginBottom: 10,
    },
    entrySourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    sourceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: colors.bgTertiary,
        marginRight: 10,
    },
    sourceBadgeText: {
        fontSize: 13,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    sourceWord: {
        flex: 1,
        fontSize: 14,
        color: colors.textSecondary,
    },
    entryTargetRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    targetInfo: {
        flex: 1,
    },
    targetWord: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textAccent,
    },
    pronunciation: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    summary: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 6,
    },
    notesText: {
        fontSize: 12,
        color: colors.textSecondary,
        backgroundColor: colors.bgTertiary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 8,
        fontStyle: 'italic',
    },
    speakButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
        backgroundColor: colors.bgTertiary,
        marginRight: 8,
    },
    speakButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    expandIcon: {
        fontSize: 14,
        color: colors.textMuted,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    notesContainer: {
        flex: 1,
        marginRight: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    editButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
        backgroundColor: colors.bgTertiary,
    },
    editButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    deleteButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        backgroundColor: colors.dangerBg,
    },
    deleteButtonText: {
        fontSize: 14,
        color: colors.dangerText,
    },
    bottomSpacer: {
        height: 24,
    },
});

export default HomeScreen;
