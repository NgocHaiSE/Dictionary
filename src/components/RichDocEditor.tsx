import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { RichDoc, RichBlock } from '../types';
import colors from '../theme/colors';

interface RichDocEditorProps {
    initialDoc?: RichDoc | null;
    onChange: (doc: RichDoc) => void;
    title?: string;
}

const RichDocEditor: React.FC<RichDocEditorProps> = ({ initialDoc, onChange, title }) => {
    const [blocks, setBlocks] = useState<RichBlock[]>(
        initialDoc?.blocks?.length
            ? initialDoc.blocks
            : [
                {
                    type: 'paragraph',
                    text: '',
                    styles: { fontSize: 13 },
                },
            ]
    );
    const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
    const [isRecording, setIsRecording] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const isFirstRender = useRef(true);

    // Sync blocks to parent via onChange - only after initial render
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const doc: RichDoc = { blocks };
        onChange(doc);
    }, [blocks]);

    const updateBlock = (index: number, newBlock: RichBlock) => {
        setBlocks(prev => {
            const clone = [...prev];
            clone[index] = newBlock;
            return clone;
        });
    };

    const addParagraphBlock = () => {
        const newBlock = { type: 'paragraph' as const, text: '', styles: { fontSize: 13 } };
        setBlocks(prev => [...prev, newBlock]);
        setTimeout(() => setSelectedIndex(blocks.length), 0);
    };

    const addImageBlock = () => {
        Alert.prompt(
            'Thêm hình ảnh',
            'Nhập URL hình ảnh:',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'OK',
                    onPress: (uri?: string) => {
                        if (!uri) return;
                        setBlocks(prev => {
                            const clone = [...prev, { type: 'image' as const, uri, caption: '' }];
                            setTimeout(() => setSelectedIndex(clone.length - 1), 0);
                            return clone;
                        });
                    },
                },
            ],
            'plain-text',
            'https://'
        );
    };

    const addAudioBlock = () => {
        Alert.alert(
            'Thêm audio',
            'Chọn cách thêm:',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Chọn file',
                    onPress: async () => {
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'audio/*',
                                copyToCacheDirectory: true,
                            });
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                const asset = result.assets[0];
                                setBlocks(prev => {
                                    const clone = [...prev, { type: 'audio' as const, uri: asset.uri, caption: asset.name || '' }];
                                    setTimeout(() => setSelectedIndex(clone.length - 1), 0);
                                    return clone;
                                });
                            }
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể chọn file audio');
                        }
                    },
                },
                {
                    text: 'Ghi âm',
                    onPress: async () => {
                        try {
                            const { status } = await Audio.requestPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert('Lỗi', 'Cần cấp quyền ghi âm');
                                return;
                            }
                            await Audio.setAudioModeAsync({
                                allowsRecordingIOS: true,
                                playsInSilentModeIOS: true,
                            });
                            const { recording } = await Audio.Recording.createAsync(
                                Audio.RecordingOptionsPresets.HIGH_QUALITY
                            );
                            recordingRef.current = recording;
                            setIsRecording(true);
                            Alert.alert('Đang ghi âm', 'Nhấn OK khi hoàn thành', [
                                {
                                    text: 'OK',
                                    onPress: async () => {
                                        if (recordingRef.current) {
                                            await recordingRef.current.stopAndUnloadAsync();
                                            const uri = recordingRef.current.getURI();
                                            recordingRef.current = null;
                                            setIsRecording(false);
                                            if (uri) {
                                                setBlocks(prev => {
                                                    const clone = [...prev, { type: 'audio' as const, uri, caption: 'Bản ghi âm' }];
                                                    setTimeout(() => setSelectedIndex(clone.length - 1), 0);
                                                    return clone;
                                                });
                                            }
                                        }
                                    },
                                },
                            ]);
                        } catch (error) {
                            Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
                        }
                    },
                },
            ]
        );
    };

    const toggleStyle = (index: number, styleKey: 'bold' | 'italic') => {
        const block = blocks[index];
        if (block.type !== 'paragraph') return;
        const styles = block.styles || {};
        const newStyles = { ...styles, [styleKey]: !styles[styleKey] };
        updateBlock(index, { ...block, styles: newStyles });
    };

    const changeFontSize = (index: number, delta: number) => {
        const block = blocks[index];
        if (block.type !== 'paragraph') return;
        const styles = block.styles || {};
        const current = styles.fontSize || 13;
        const next = Math.max(10, Math.min(22, current + delta));
        updateBlock(index, { ...block, styles: { ...styles, fontSize: next } });
    };

    const removeBlock = (index: number) => {
        setBlocks(prev => {
            const clone = [...prev];
            clone.splice(index, 1);
            if (clone.length === 0) {
                setTimeout(() => setSelectedIndex(null), 0);
            } else if (index >= clone.length) {
                setTimeout(() => setSelectedIndex(clone.length - 1), 0);
            }
            return clone;
        });
    };

    const playAudio = async (uri: string) => {
        try {
            await Linking.openURL(uri);
        } catch {
            Alert.alert('Lỗi', 'Không thể mở audio: ' + uri);
        }
    };

    return (
        <View style={styles.container}>
            {/* Title */}
            {title && <Text style={styles.editorTitle}>{title}</Text>}

            {/* Blocks list */}
            <ScrollView style={styles.blocksList} nestedScrollEnabled>
                {blocks.map((block, index) => {
                    const isSelected = index === selectedIndex;

                    if (block.type === 'paragraph') {
                        const fontSize = block.styles?.fontSize ?? 13;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.blockContainer, isSelected && styles.blockSelected]}
                                onPress={() => setSelectedIndex(index)}
                                activeOpacity={0.8}
                            >
                                <TextInput
                                    value={block.text}
                                    onChangeText={text => updateBlock(index, { ...block, text })}
                                    placeholder="Nhập ghi chú, ví dụ..."
                                    placeholderTextColor={colors.textMuted}
                                    style={[
                                        styles.textInput,
                                        { fontSize },
                                        block.styles?.bold && styles.bold,
                                        block.styles?.italic && styles.italic,
                                    ]}
                                    multiline
                                    onFocus={() => setSelectedIndex(index)}
                                />
                            </TouchableOpacity>
                        );
                    }

                    if (block.type === 'image') {
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.blockContainer, isSelected && styles.blockSelected]}
                                onPress={() => setSelectedIndex(index)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.blockLabel}>Hình ảnh</Text>
                                <Image
                                    source={{ uri: block.uri }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                                <TextInput
                                    value={block.caption || ''}
                                    onChangeText={caption => updateBlock(index, { ...block, caption })}
                                    placeholder="Chú thích hình ảnh..."
                                    placeholderTextColor={colors.textMuted}
                                    style={styles.captionInput}
                                />
                            </TouchableOpacity>
                        );
                    }

                    if (block.type === 'audio') {
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.blockContainer, isSelected && styles.blockSelected]}
                                onPress={() => setSelectedIndex(index)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.blockLabel}>Audio</Text>
                                <View style={styles.audioRow}>
                                    <TouchableOpacity
                                        style={styles.playButton}
                                        onPress={() => playAudio(block.uri)}
                                    >
                                        <Text style={styles.playButtonText}> Nghe</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.audioUri} numberOfLines={1}>
                                        {block.uri}
                                    </Text>
                                </View>
                                <TextInput
                                    value={block.caption || ''}
                                    onChangeText={caption => updateBlock(index, { ...block, caption })}
                                    placeholder="Chú thích audio..."
                                    placeholderTextColor={colors.textMuted}
                                    style={styles.captionInput}
                                />
                            </TouchableOpacity>
                        );
                    }

                    return null;
                })}

                {blocks.length === 0 && (
                    <Text style={styles.emptyText}>Chưa có ghi chú/ví dụ.</Text>
                )}
            </ScrollView>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        borderRadius: 16,
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        padding: 14,
    },
    editorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
    },
    toolbarLabel: {
        fontSize: 13,
        color: colors.textPrimary,
        marginRight: 10,
        fontWeight: '500',
    },
    toolbarButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 6,
        backgroundColor: colors.bgSecondary,
    },
    toolbarButtonText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    deleteButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: colors.dangerBg,
    },
    deleteButtonText: {
        fontSize: 14,
        color: colors.dangerText,
    },
    flex1: {
        flex: 1,
    },
    blocksList: {
        maxHeight: 300,
    },
    blockContainer: {
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    blockSelected: {
        borderColor: colors.accentPrimary,
        backgroundColor: '#fffef5',
    },
    textInput: {
        color: '#000000',
        padding: 0,
        minHeight: 50,
        fontSize: 15,
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    blockLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 8,
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        marginBottom: 10,
    },
    captionInput: {
        backgroundColor: '#f5f5f0',
        borderWidth: 1,
        borderColor: colors.borderPrimary,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: '#000000',
    },
    audioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    playButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.accentPrimary,
        backgroundColor: colors.accentPrimary,
        marginRight: 10,
    },
    playButtonText: {
        fontSize: 13,
        color: colors.bgPrimary,
        fontWeight: '600',
    },
    audioUri: {
        flex: 1,
        fontSize: 11,
        color: colors.textMuted,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    addButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    addButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderSecondary,
        marginRight: 6,
    },
    addButtonText: {
        fontSize: 13,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    blockCount: {
        fontSize: 12,
        color: colors.textSecondary,
    },
});

export default RichDocEditor;
