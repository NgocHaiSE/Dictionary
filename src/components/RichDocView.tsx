import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Alert,
} from 'react-native';
import { RichDoc, RichBlock } from '../types';
import colors from '../theme/colors';

interface RichDocViewProps {
    doc?: RichDoc;
}

const RichDocView: React.FC<RichDocViewProps> = ({ doc }) => {
    if (!doc || !doc.blocks || doc.blocks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có ghi chú/ví dụ.</Text>
            </View>
        );
    }

    const handlePlayAudio = async (uri: string) => {
        try {
            const supported = await Linking.canOpenURL(uri);
            if (supported) {
                await Linking.openURL(uri);
            } else {
                Alert.alert('Lỗi', 'Không thể mở audio: ' + uri);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể mở audio: ' + uri);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ghi chú & ví dụ</Text>
            {doc.blocks.map((block, index) => {
                if (block.type === 'paragraph') {
                    const fontSize = block.styles?.fontSize ?? 13;
                    return (
                        <Text
                            key={index}
                            style={[
                                styles.paragraph,
                                { fontSize },
                                block.styles?.bold && styles.bold,
                                block.styles?.italic && styles.italic,
                            ]}
                        >
                            {block.text}
                        </Text>
                    );
                }

                if (block.type === 'image') {
                    return (
                        <View key={index} style={styles.imageContainer}>
                            <Image
                                source={{ uri: block.uri }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            {block.caption && (
                                <Text style={styles.caption}>{block.caption}</Text>
                            )}
                        </View>
                    );
                }

                if (block.type === 'audio') {
                    return (
                        <View key={index} style={styles.audioContainer}>
                            <TouchableOpacity
                                style={styles.audioButton}
                                onPress={() => handlePlayAudio(block.uri)}
                            >
                                <Text style={styles.audioButtonText}>Nghe audio</Text>
                            </TouchableOpacity>
                            {block.caption && (
                                <Text style={styles.caption}>{block.caption}</Text>
                            )}
                        </View>
                    );
                }

                return null;
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 2,
        padding: 14,
    },
    emptyContainer: {
        marginTop: 6,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textMuted,
        fontStyle: 'italic',
    },
    title: {
        fontSize: 14,
        color: colors.bgPrimary,
        marginBottom: 10,
        fontWeight: '600',
    },
    paragraph: {
        color: colors.bgPrimary,
        marginBottom: 10,
        lineHeight: 20,
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    imageContainer: {
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderPrimary,
    },
    caption: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 6,
    },
    audioContainer: {
        marginBottom: 10,
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.accentPrimary,
        backgroundColor: colors.accentPrimary,
        alignSelf: 'flex-start',
    },
    audioButtonText: {
        fontSize: 14,
        color: colors.bgPrimary,
        fontWeight: '600',
    },
});

export default RichDocView;
