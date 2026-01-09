// ===== Types =====

export type LanguageCode =
    | "vi"
    | "tay"
    | "mong"
    | "nung"
    | "dao"
    | "lolo"
    | "sanchi"
    | "sanchay"
    | "sandiu";

export interface LangMeta {
    code: LanguageCode;
    label: string;
    ttsLang: string;
}

export const LANGS: LangMeta[] = [
    { code: "vi", label: "Tiếng Việt", ttsLang: "vi-VN" },
    { code: "tay", label: "Tiếng Tày", ttsLang: "vi-VN" },
    { code: "mong", label: "Tiếng Mông", ttsLang: "vi-VN" },
    { code: "nung", label: "Tiếng Nùng", ttsLang: "vi-VN" },
    { code: "dao", label: "Tiếng Dao", ttsLang: "vi-VN" },
    { code: "lolo", label: "Tiếng Lô Lô", ttsLang: "vi-VN" },
    { code: "sanchi", label: "Tiếng Sán chỉ", ttsLang: "vi-VN" },
    { code: "sanchay", label: "Tiếng Sán chay", ttsLang: "vi-VN" },
    { code: "sandiu", label: "Tiếng Sán Dìu", ttsLang: "vi-VN" },
];

export type RichBlock =
    | {
        type: "paragraph";
        text: string;
        styles?: {
            bold?: boolean;
            italic?: boolean;
            fontSize?: number;
        };
    }
    | {
        type: "image";
        uri: string;
        caption?: string;
    }
    | {
        type: "audio";
        uri: string;
        caption?: string;
    };

export interface RichDoc {
    blocks: RichBlock[];
}

export interface Entry {
    id: number;
    translations: Partial<Record<LanguageCode, string>>;
    lemmaAudios?: Partial<Record<LanguageCode, string>>;
    notes?: string;
}

// ===== Helpers =====

export function getLangMeta(code: LanguageCode): LangMeta {
    return LANGS.find(l => l.code === code)!;
}

export function summarizeDoc(doc: RichDoc | undefined | null): string {
    if (!doc) return "";
    const firstPara = doc.blocks.find(b => b.type === "paragraph") as
        | Extract<RichBlock, { type: "paragraph" }>
        | undefined;
    return firstPara?.text ?? "";
}

// ===== Base Entries =====
// NOTE: Use src/data/ for separate dictionary files or src/types/baseData.ts for all data

export const BASE_ENTRIES: Entry[] = [
    {
        id: 1,
        translations: { vi: "xin chào", tay: "xo tuộng" },
        lemmaAudios: {},
    },
    {
        id: 2,
        translations: { vi: "cảm ơn", tay: "pjom bái" },
        lemmaAudios: {},
    },
];
