import * as SQLite from 'expo-sqlite';
import { Entry, RichDoc, LanguageCode } from '../types';

const DATABASE_NAME = 'dictionary.db';

let db: SQLite.SQLiteDatabase | null = null;

// ===== DATABASE FUNCTIONS =====

const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    }
    return db;
};

export const initDatabase = async (): Promise<void> => {
    const database = await getDatabase();

    // Create entries table with is_user_added flag
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY,
            notes TEXT,
            is_user_added INTEGER DEFAULT 0
        );
    `);

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS translations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            lang_code TEXT NOT NULL,
            word TEXT NOT NULL,
            FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
            UNIQUE(entry_id, lang_code)
        );
    `);

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS lemma_audios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            lang_code TEXT NOT NULL,
            audio_uri TEXT NOT NULL,
            FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
            UNIQUE(entry_id, lang_code)
        );
    `);

    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS rich_docs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            lang_code TEXT NOT NULL,
            blocks_json TEXT NOT NULL,
            FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
            UNIQUE(entry_id, lang_code)
        );
    `);

    console.log('Database initialized successfully');
};

export const saveEntry = async (entry: Entry, isUserAdded: boolean = true): Promise<void> => {
    const database = await getDatabase();

    await database.runAsync(
        'INSERT OR REPLACE INTO entries (id, notes, is_user_added) VALUES (?, ?, ?)',
        [entry.id, entry.notes || null, isUserAdded ? 1 : 0]
    );

    await database.runAsync('DELETE FROM translations WHERE entry_id = ?', [entry.id]);
    for (const [langCode, word] of Object.entries(entry.translations)) {
        if (word && word.trim()) {
            await database.runAsync(
                'INSERT INTO translations (entry_id, lang_code, word) VALUES (?, ?, ?)',
                [entry.id, langCode, word]
            );
        }
    }

    await database.runAsync('DELETE FROM lemma_audios WHERE entry_id = ?', [entry.id]);
    if (entry.lemmaAudios) {
        for (const [langCode, audioUri] of Object.entries(entry.lemmaAudios)) {
            if (audioUri && audioUri.trim()) {
                await database.runAsync(
                    'INSERT INTO lemma_audios (entry_id, lang_code, audio_uri) VALUES (?, ?, ?)',
                    [entry.id, langCode, audioUri]
                );
            }
        }
    }
};

export const saveAllEntries = async (entries: Entry[], isUserAdded: boolean = false): Promise<void> => {
    const database = await getDatabase();

    await database.withTransactionAsync(async () => {
        for (const entry of entries) {
            await database.runAsync(
                'INSERT OR REPLACE INTO entries (id, notes, is_user_added) VALUES (?, ?, ?)',
                [entry.id, entry.notes || null, isUserAdded ? 1 : 0]
            );

            await database.runAsync('DELETE FROM translations WHERE entry_id = ?', [entry.id]);
            for (const [langCode, word] of Object.entries(entry.translations)) {
                if (word && word.trim()) {
                    await database.runAsync(
                        'INSERT INTO translations (entry_id, lang_code, word) VALUES (?, ?, ?)',
                        [entry.id, langCode, word]
                    );
                }
            }

            await database.runAsync('DELETE FROM lemma_audios WHERE entry_id = ?', [entry.id]);
            if (entry.lemmaAudios) {
                for (const [langCode, audioUri] of Object.entries(entry.lemmaAudios)) {
                    if (audioUri && audioUri.trim()) {
                        await database.runAsync(
                            'INSERT INTO lemma_audios (entry_id, lang_code, audio_uri) VALUES (?, ?, ?)',
                            [entry.id, langCode, audioUri]
                        );
                    }
                }
            }
        }
    });
};

export const loadAllEntries = async (): Promise<Entry[]> => {
    const database = await getDatabase();

    const entryRows = await database.getAllAsync<{ id: number; notes: string | null; is_user_added: number }>(
        'SELECT id, notes, is_user_added FROM entries ORDER BY id DESC'
    );

    const entries: Entry[] = [];

    for (const row of entryRows) {
        const translationRows = await database.getAllAsync<{ lang_code: string; word: string }>(
            'SELECT lang_code, word FROM translations WHERE entry_id = ?',
            [row.id]
        );
        const translations: Partial<Record<LanguageCode, string>> = {};
        for (const t of translationRows) {
            translations[t.lang_code as LanguageCode] = t.word;
        }

        const audioRows = await database.getAllAsync<{ lang_code: string; audio_uri: string }>(
            'SELECT lang_code, audio_uri FROM lemma_audios WHERE entry_id = ?',
            [row.id]
        );
        const lemmaAudios: Partial<Record<LanguageCode, string>> = {};
        for (const a of audioRows) {
            lemmaAudios[a.lang_code as LanguageCode] = a.audio_uri;
        }

        entries.push({
            id: row.id,
            translations,
            lemmaAudios: Object.keys(lemmaAudios).length > 0 ? lemmaAudios : undefined,
            notes: row.notes || undefined,
        });
    }

    return entries;
};

export const deleteEntry = async (entryId: number): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM entries WHERE id = ?', [entryId]);
    await database.runAsync('DELETE FROM translations WHERE entry_id = ?', [entryId]);
    await database.runAsync('DELETE FROM lemma_audios WHERE entry_id = ?', [entryId]);
    await database.runAsync('DELETE FROM rich_docs WHERE entry_id = ?', [entryId]);
};

export const saveRichDoc = async (entryId: number, langCode: LanguageCode, doc: RichDoc): Promise<void> => {
    const database = await getDatabase();
    const blocksJson = JSON.stringify(doc.blocks);

    await database.runAsync(
        'INSERT OR REPLACE INTO rich_docs (entry_id, lang_code, blocks_json) VALUES (?, ?, ?)',
        [entryId, langCode, blocksJson]
    );
};

export const loadAllRichDocs = async (): Promise<Record<string, RichDoc>> => {
    const database = await getDatabase();

    const rows = await database.getAllAsync<{ entry_id: number; lang_code: string; blocks_json: string }>(
        'SELECT entry_id, lang_code, blocks_json FROM rich_docs'
    );

    const docsMap: Record<string, RichDoc> = {};
    for (const row of rows) {
        const key = `${row.entry_id}:${row.lang_code}`;
        try {
            docsMap[key] = { blocks: JSON.parse(row.blocks_json) };
        } catch {
            console.error('Failed to parse blocks_json for', key);
        }
    }

    return docsMap;
};

export const hasDataInDb = async (): Promise<boolean> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM entries');
    return result ? result.count > 0 : false;
};

export const importBaseEntries = async (baseEntries: Entry[]): Promise<void> => {
    // Only import base entries that don't already exist
    const database = await getDatabase();

    for (const entry of baseEntries) {
        const existing = await database.getFirstAsync<{ id: number }>(
            'SELECT id FROM entries WHERE id = ?',
            [entry.id]
        );

        if (!existing) {
            await database.runAsync(
                'INSERT INTO entries (id, notes, is_user_added) VALUES (?, ?, 0)',
                [entry.id, entry.notes || null]
            );

            for (const [langCode, word] of Object.entries(entry.translations)) {
                if (word && word.trim()) {
                    await database.runAsync(
                        'INSERT INTO translations (entry_id, lang_code, word) VALUES (?, ?, ?)',
                        [entry.id, langCode, word]
                    );
                }
            }

            if (entry.lemmaAudios) {
                for (const [langCode, audioUri] of Object.entries(entry.lemmaAudios)) {
                    if (audioUri && audioUri.trim()) {
                        await database.runAsync(
                            'INSERT INTO lemma_audios (entry_id, lang_code, audio_uri) VALUES (?, ?, ?)',
                            [entry.id, langCode, audioUri]
                        );
                    }
                }
            }
        }
    }

    console.log(`Imported base entries to database (skipped existing)`);
};
