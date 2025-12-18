import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry, RichDoc } from '../types';

const ENTRIES_KEY = '@TayDictionary:entries';
const DOCS_KEY = '@TayDictionary:docs';

export interface StorageData {
    entries: Entry[];
    docsMap: Record<string, RichDoc>;
}

// Lưu tất cả entries
export const saveEntries = async (entries: Entry[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Error saving entries:', error);
        throw error;
    }
};

// Đọc tất cả entries
export const loadEntries = async (): Promise<Entry[]> => {
    try {
        const data = await AsyncStorage.getItem(ENTRIES_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading entries:', error);
        return [];
    }
};

// Lưu rich docs
export const saveDocs = async (docsMap: Record<string, RichDoc>): Promise<void> => {
    try {
        await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(docsMap));
    } catch (error) {
        console.error('Error saving docs:', error);
        throw error;
    }
};

// Đọc rich docs
export const loadDocs = async (): Promise<Record<string, RichDoc>> => {
    try {
        const data = await AsyncStorage.getItem(DOCS_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Error loading docs:', error);
        return {};
    }
};

// Lưu cả entries và docs
export const saveAll = async (entries: Entry[], docsMap: Record<string, RichDoc>): Promise<void> => {
    await Promise.all([
        saveEntries(entries),
        saveDocs(docsMap),
    ]);
};

// Đọc cả entries và docs
export const loadAll = async (): Promise<StorageData> => {
    const [entries, docsMap] = await Promise.all([
        loadEntries(),
        loadDocs(),
    ]);
    return { entries, docsMap };
};

// Xóa tất cả dữ liệu (reset)
export const clearAll = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([ENTRIES_KEY, DOCS_KEY]);
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
};

// Kiểm tra đã có dữ liệu chưa
export const hasData = async (): Promise<boolean> => {
    try {
        const data = await AsyncStorage.getItem(ENTRIES_KEY);
        return data !== null && JSON.parse(data).length > 0;
    } catch {
        return false;
    }
};
