import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../theme/colors';

interface AudioPickerProps {
    value: string;
    onChange: (uri: string) => void;
    label?: string;
}

const AudioPicker: React.FC<AudioPickerProps> = ({ value, onChange, label }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);

    const startRecording = async () => {
        try {
            // Request permissions
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần cấp quyền ghi âm để sử dụng tính năng này');
                return;
            }

            // Set audio mode
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Start recording
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            recordingRef.current = recording;
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
        }
    };

    const stopRecording = async () => {
        try {
            if (!recordingRef.current) return;

            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            recordingRef.current = null;
            setIsRecording(false);

            // Reset audio mode to allow playback after recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            if (uri) {
                onChange(uri);
                Alert.alert('Thành công', 'Đã lưu bản ghi âm');
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert('Lỗi', 'Không thể dừng ghi âm');
        }
    };

    const pickAudioFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'audio/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                onChange(asset.uri);
                Alert.alert('Thành công', `Đã chọn: ${asset.name}`);
            }
        } catch (error) {
            console.error('Failed to pick audio:', error);
            Alert.alert('Lỗi', 'Không thể chọn file audio');
        }
    };

    const playAudio = async () => {
        if (!value) {
            Alert.alert('Lỗi', 'Chưa có file audio');
            return;
        }

        try {
            // Stop any existing playback
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: value },
                { shouldPlay: true }
            );
            soundRef.current = sound;
            setIsPlaying(true);

            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setIsPlaying(false);
                }
            });
        } catch (error) {
            console.error('Failed to play audio:', error);
            Alert.alert('Lỗi', 'Không thể phát audio');
        }
    };

    const stopPlaying = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.stopAsync();
                setIsPlaying(false);
            }
        } catch (error) {
            console.error('Failed to stop playing:', error);
        }
    };

    const clearAudio = () => {
        onChange('');
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.buttonsRow}>
                {/* Record button */}
                <TouchableOpacity
                    style={[styles.button, isRecording && styles.recordingButton]}
                    onPress={isRecording ? stopRecording : startRecording}
                >
                    <Text style={styles.buttonText}>
                        {isRecording ? '⏹ Dừng' : '● Ghi âm'}
                    </Text>
                </TouchableOpacity>

                {/* Pick file button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={pickAudioFile}
                    disabled={isRecording}
                >
                    <Text style={styles.buttonText}>Chọn file</Text>
                </TouchableOpacity>

                {/* Play button */}
                {value ? (
                    <TouchableOpacity
                        style={[styles.button, styles.playButton]}
                        onPress={isPlaying ? stopPlaying : playAudio}
                        disabled={isRecording}
                    >
                        <Text style={styles.playButtonText}>
                            {isPlaying ? '⏹ Dừng' : '▶ Nghe'}
                        </Text>
                    </TouchableOpacity>
                ) : null}

                {/* Clear button */}
                {value ? (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearAudio}
                        disabled={isRecording}
                    >
                        <Text style={styles.clearButtonText}>×</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Status */}
            <View style={styles.statusRow}>
                {isRecording && (
                    <Text style={styles.recordingStatus}>● Đang ghi âm...</Text>
                )}
                {value && !isRecording && (
                    <Text style={styles.fileStatus} numberOfLines={1}>
                        ✓ Đã có audio
                    </Text>
                )}
                {!value && !isRecording && (
                    <Text style={styles.noFileStatus}>Chưa có audio</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    label: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    buttonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    button: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: colors.bgTertiary,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
    },
    recordingButton: {
        backgroundColor: colors.dangerBg,
        borderColor: colors.danger,
    },
    buttonText: {
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    playButton: {
        backgroundColor: colors.accentPrimary,
        borderColor: colors.accentPrimary,
    },
    playButtonText: {
        fontSize: 14,
        color: colors.bgPrimary,
        fontWeight: '600',
    },
    clearButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.dangerBg,
        borderWidth: 1,
        borderColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearButtonText: {
        fontSize: 20,
        color: colors.dangerText,
        fontWeight: 'bold',
    },
    statusRow: {
        marginTop: 8,
    },
    recordingStatus: {
        fontSize: 13,
        color: colors.danger,
        fontWeight: '500',
    },
    fileStatus: {
        fontSize: 13,
        color: colors.success,
    },
    noFileStatus: {
        fontSize: 13,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
});

export default AudioPicker;
