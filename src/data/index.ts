// Auto-generated dictionary data index
// Generated: 2025-12-20T16:18:22.466Z

export { DICT_VI_TAY } from './dict_vi_tay';
export { DICT_VI_DAO } from './dict_vi_dao';
export { DICT_VI_MONG } from './dict_vi_mong';
export { DICT_VI_LOLO } from './dict_vi_lolo';
export { DICT_VI_SANCHAY } from './dict_vi_sanchay';
export { DICT_VI_SANDIU } from './dict_vi_sandiu';
export { DICT_VI_SANCHI } from './dict_vi_sanchi';
export { DICT_VI_NUNG } from './dict_vi_nung';

import { Entry } from '../types';
import { DICT_VI_TAY } from './dict_vi_tay';
import { DICT_VI_DAO } from './dict_vi_dao';
import { DICT_VI_MONG } from './dict_vi_mong';
import { DICT_VI_LOLO } from './dict_vi_lolo';
import { DICT_VI_SANCHAY } from './dict_vi_sanchay';
import { DICT_VI_SANDIU } from './dict_vi_sandiu';
import { DICT_VI_SANCHI } from './dict_vi_sanchi';
import { DICT_VI_NUNG } from './dict_vi_nung';

export interface DictionaryInfo {
    id: string;
    label: string;
    source: string;
    target: string;
    entries: Entry[];
}

export const DICTIONARIES: DictionaryInfo[] = [
    { id: 'vi_tay', label: 'Việt - Tày', source: 'vi', target: 'tay', entries: DICT_VI_TAY },
    { id: 'vi_dao', label: 'Việt - Dao', source: 'vi', target: 'dao', entries: DICT_VI_DAO },
    { id: 'vi_mong', label: 'Việt - Mông', source: 'vi', target: 'mong', entries: DICT_VI_MONG },
    { id: 'vi_lolo', label: 'Việt - Lô Lô', source: 'vi', target: 'lolo', entries: DICT_VI_LOLO },
    { id: 'vi_sanchay', label: 'Việt - Sán Chay', source: 'vi', target: 'sanchay', entries: DICT_VI_SANCHAY },
    { id: 'vi_sandiu', label: 'Việt - Sán Dìu', source: 'vi', target: 'sandiu', entries: DICT_VI_SANDIU },
    { id: 'vi_sanchi', label: 'Việt - Sán chỉ', source: 'vi', target: 'sanchi', entries: DICT_VI_SANCHI },
    { id: 'vi_nung', label: 'Việt - Nùng', source: 'vi', target: 'nung', entries: DICT_VI_NUNG },
];

export function getDictionary(source: string, target: string): Entry[] {
    const dict = DICTIONARIES.find(d => d.source === source && d.target === target);
    return dict?.entries || [];
}
