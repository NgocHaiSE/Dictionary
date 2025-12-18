const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const DOC_DIR = path.join(__dirname, '..', 'doc');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');

// Language code mappings from file names and column headers
const COLUMN_LANG_MAP = {
    // Vietnamese
    'Tiếng Việt': 'vi', 'Tieng Viet': 'vi', 'Vietnamese': 'vi', 'Viet': 'vi', 'vi': 'vi', 'VI': 'vi',
    // Tày
    'Tiếng Tày': 'tay', 'Tieng Tay': 'tay', 'Tay': 'tay', 'tay': 'tay', 'TAY': 'tay',
    // Mông
    'Tiếng Mông': 'mong', 'Tieng Mong': 'mong', 'Mong': 'mong', 'mong': 'mong', 'MONG': 'mong',
    // Nùng
    'Tiếng Nùng': 'nung', 'Tieng Nung': 'nung', 'Nung': 'nung', 'nung': 'nung',
    // Dao
    'Tiếng Dao': 'dao', 'Tieng Dao': 'dao', 'Dao': 'dao', 'dao': 'dao', 'DAO': 'dao',
    // Lô Lô
    'Tiếng Lô Lô': 'lolo', 'Tieng Lo Lo': 'lolo', 'LoLo': 'lolo', 'Lo Lo': 'lolo', 'Lolo': 'lolo', 'lolo': 'lolo', 'LOLO': 'lolo',
    // Sán Chí
    'Tiếng Sán chí': 'sanchi', 'Tieng San chi': 'sanchi', 'San chi': 'sanchi', 'Sán chí': 'sanchi', 'SanChi': 'sanchi', 'sanchi': 'sanchi',
    // Sán Chay
    'Tiếng Sán chay': 'sanchay', 'Tieng San chay': 'sanchay', 'San chay': 'sanchay', 'Sán chay': 'sanchay', 'SanChay': 'sanchay', 'sanchay': 'sanchay',
    // Sán Dìu
    'Tiếng Sán Dìu': 'sandiu', 'Tieng San Diu': 'sandiu', 'San Diu': 'sandiu', 'Sán Dìu': 'sandiu', 'SanDiu': 'sandiu', 'sandiu': 'sandiu',
};

// Dictionary pairs to generate separate files for
const DICTIONARY_PAIRS = [
    { id: 'vi_tay', source: 'vi', target: 'tay', label: 'Việt - Tày' },
    { id: 'vi_dao', source: 'vi', target: 'dao', label: 'Việt - Dao' },
    { id: 'vi_mong', source: 'vi', target: 'mong', label: 'Việt - Mông' },
    { id: 'vi_lolo', source: 'vi', target: 'lolo', label: 'Việt - Lô Lô' },
    { id: 'vi_sanchay', source: 'vi', target: 'sanchay', label: 'Việt - Sán Chay' },
    { id: 'vi_sandiu', source: 'vi', target: 'sandiu', label: 'Việt - Sán Dìu' },
    { id: 'vi_sanchi', source: 'vi', target: 'sanchi', label: 'Việt - Sán Chí' },
    { id: 'vi_nung', source: 'vi', target: 'nung', label: 'Việt - Nùng' },
];

function detectLangCode(columnName) {
    const trimmed = columnName.trim();
    if (COLUMN_LANG_MAP[trimmed]) return COLUMN_LANG_MAP[trimmed];

    const lowerCol = columnName.toLowerCase();
    if (lowerCol.includes('việt') || lowerCol.includes('viet')) return 'vi';
    if (lowerCol.includes('tày') || lowerCol.includes('tay')) return 'tay';
    if (lowerCol.includes('mông') || lowerCol.includes('mong')) return 'mong';
    if (lowerCol.includes('nùng') || lowerCol.includes('nung')) return 'nung';
    if (lowerCol.includes('dao')) return 'dao';
    if (lowerCol.includes('lô lô') || lowerCol.includes('lo lo') || lowerCol.includes('lolo')) return 'lolo';
    if (lowerCol.includes('sán chí') || lowerCol.includes('san chi') || lowerCol.includes('sanchi')) return 'sanchi';
    if (lowerCol.includes('sán chay') || lowerCol.includes('san chay') || lowerCol.includes('sanchay')) return 'sanchay';
    if (lowerCol.includes('sán dìu') || lowerCol.includes('san diu') || lowerCol.includes('sandiu')) return 'sandiu';
    return null;
}

function parseExcelFile(filePath, fileName) {
    console.log(`Reading: ${fileName}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (data.length === 0) {
        console.log(`  No data found in ${fileName}`);
        return [];
    }

    const columns = Object.keys(data[0]);
    const colToLang = {};
    columns.forEach(col => {
        const langCode = detectLangCode(col);
        if (langCode) colToLang[col] = langCode;
    });

    console.log(`  Language mappings: ${JSON.stringify(colToLang)}`);

    const entries = [];
    data.forEach((row) => {
        const translations = {};
        let notes = '';

        columns.forEach(col => {
            const value = row[col];
            if (!value || (typeof value !== 'string' && typeof value !== 'number')) return;

            const strValue = String(value).trim();
            if (!strValue) return;

            const lowerCol = col.toLowerCase();
            if (lowerCol.includes('ghi chú') || lowerCol.includes('note') || lowerCol === 'notes') {
                notes = strValue;
                return;
            }

            const langCode = colToLang[col];
            if (langCode && strValue) {
                translations[langCode] = strValue;
            }
        });

        if (Object.keys(translations).length >= 2) {
            entries.push({ translations, notes: notes || undefined });
        }
    });

    console.log(`  Found ${entries.length} entries`);
    return entries;
}

function generateData() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const allEntries = [];
    const files = fs.readdirSync(DOC_DIR).filter(f => f.endsWith('.xlsx'));

    console.log(`Found ${files.length} Excel files\n`);

    files.forEach(file => {
        const filePath = path.join(DOC_DIR, file);
        const entries = parseExcelFile(filePath, file);
        allEntries.push(...entries);
    });

    // Deduplicate by Vietnamese translation
    const uniqueMap = new Map();
    allEntries.forEach(entry => {
        const viKey = entry.translations.vi || '';
        if (viKey) {
            if (uniqueMap.has(viKey)) {
                const existing = uniqueMap.get(viKey);
                Object.assign(existing.translations, entry.translations);
                if (entry.notes && !existing.notes) existing.notes = entry.notes;
            } else {
                uniqueMap.set(viKey, entry);
            }
        } else {
            const firstKey = Object.values(entry.translations)[0];
            if (!uniqueMap.has(firstKey)) uniqueMap.set(firstKey, entry);
        }
    });

    const uniqueEntries = Array.from(uniqueMap.values());
    console.log(`\nTotal unique entries: ${uniqueEntries.length}`);

    // Generate separate files for each dictionary pair
    DICTIONARY_PAIRS.forEach(pair => {
        const pairEntries = uniqueEntries
            .filter(e => {
                const hasSrc = e.translations[pair.source] && e.translations[pair.source].trim();
                const hasTgt = e.translations[pair.target] && e.translations[pair.target].trim();
                return hasSrc && hasTgt;
            })
            .map((e, idx) => ({
                id: idx + 1,
                translations: {
                    [pair.source]: e.translations[pair.source],
                    [pair.target]: e.translations[pair.target],
                },
                lemmaAudios: {},
                ...(e.notes ? { notes: e.notes } : {}),
            }));

        const fileName = `dict_${pair.id}.ts`;
        const filePath = path.join(OUTPUT_DIR, fileName);

        const tsContent = `import { Entry } from '../types';

// Dictionary: ${pair.label}
// Generated: ${new Date().toISOString()}
// Total entries: ${pairEntries.length}

export const DICT_${pair.id.toUpperCase()}: Entry[] = ${JSON.stringify(pairEntries, null, 2)};
`;

        fs.writeFileSync(filePath, tsContent, 'utf8');
        console.log(`Generated: ${fileName} (${pairEntries.length} entries)`);
    });

    // Generate index file that exports all dictionaries
    const indexContent = `// Auto-generated dictionary data index
// Generated: ${new Date().toISOString()}

${DICTIONARY_PAIRS.map(p => `export { DICT_${p.id.toUpperCase()} } from './dict_${p.id}';`).join('\n')}

import { Entry } from '../types';
${DICTIONARY_PAIRS.map(p => `import { DICT_${p.id.toUpperCase()} } from './dict_${p.id}';`).join('\n')}

export interface DictionaryInfo {
    id: string;
    label: string;
    source: string;
    target: string;
    entries: Entry[];
}

export const DICTIONARIES: DictionaryInfo[] = [
${DICTIONARY_PAIRS.map(p => `    { id: '${p.id}', label: '${p.label}', source: '${p.source}', target: '${p.target}', entries: DICT_${p.id.toUpperCase()} },`).join('\n')}
];

export function getDictionary(source: string, target: string): Entry[] {
    const dict = DICTIONARIES.find(d => d.source === source && d.target === target);
    return dict?.entries || [];
}
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent, 'utf8');
    console.log(`\nGenerated: index.ts`);

    // Also generate combined baseData.ts for backwards compatibility
    const allFormattedEntries = uniqueEntries.map((e, idx) => ({
        id: idx + 1,
        translations: e.translations,
        lemmaAudios: {},
        ...(e.notes ? { notes: e.notes } : {}),
    }));

    const baseDataContent = `import { Entry } from './index';

// Auto-generated BASE_ENTRIES from Excel files
// Source: doc/*.xlsx (${files.length} files, ${allFormattedEntries.length} entries)
// Generated: ${new Date().toISOString()}

export const BASE_ENTRIES: Entry[] = ${JSON.stringify(allFormattedEntries, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, '..', 'src', 'types', 'baseData.ts'), baseDataContent, 'utf8');
    console.log(`Generated: baseData.ts (${allFormattedEntries.length} entries)`);
}

generateData();
