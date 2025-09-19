import React from 'react';

// Service để map Target ID với template names
interface TemplateItem {
    id: number;
    NAME: string;
}

interface TemplateCache {
    npcs: TemplateItem[];
    mobs: TemplateItem[];
    items: TemplateItem[];
    maps: TemplateItem[];
    bosses: TemplateItem[];
    loadedAt: number;
}

let templateCache: TemplateCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadTemplates(): Promise<TemplateCache> {
    try {
        const [npcsRes, mobsRes, itemsRes, mapsRes, bossesRes] = await Promise.all([
            fetch('/api/npcs'),
            fetch('/api/mobs?limit=all'),
            fetch('/api/items?limit=all'),
            fetch('/api/map-templates'),
            fetch('/api/boss?limit=all')
        ]);

        const [npcs, mobs, items, maps, bossesData] = await Promise.all([
            npcsRes.json(),
            mobsRes.json(),
            itemsRes.json(),
            mapsRes.json(),
            bossesRes.json()
        ]);

        return {
            npcs: npcs || [],
            mobs: mobs || [],
            items: items.items || [],
            maps: maps.maps || [],
            bosses: bossesData.bosses?.map((b: any) => ({ id: b.id, NAME: b.name })) || [],
            loadedAt: Date.now()
        };
    } catch (error) {
        console.error('Error loading templates:', error);
        return {
            npcs: [],
            mobs: [],
            items: [],
            maps: [],
            bosses: [],
            loadedAt: Date.now()
        };
    }
}

async function getTemplates(): Promise<TemplateCache> {
    if (!templateCache || Date.now() - templateCache.loadedAt > CACHE_DURATION) {
        templateCache = await loadTemplates();
    }
    return templateCache;
}

export function getTargetDisplayName(
    requirementType: string,
    targetId: number,
    templates: TemplateCache
): string {
    try {
        switch (requirementType) {
            case 'TALK_NPC':
                const npc = templates.npcs?.find(n => n.id === targetId);
                return npc ? `${npc.NAME} (ID: ${targetId})` : `NPC ID: ${targetId}`;

            case 'KILL_MOB':
                const mob = templates.mobs?.find(m => m.id === targetId);
                return mob ? `${mob.NAME} (ID: ${targetId})` : `Mob ID: ${targetId}`;

            case 'KILL_BOSS':
                const boss = templates.bosses?.find(b => b.id === targetId);
                return boss ? `${boss.NAME} (ID: ${targetId})` : `Boss ID: ${targetId}`;

            case 'PICK_ITEM':
            case 'USE_ITEM':
                const item = templates.items?.find(i => i.id === targetId);
                return item ? `${item.NAME} (ID: ${targetId})` : `Item ID: ${targetId}`;

            case 'GO_TO_MAP':
                const map = templates.maps?.find(m => m.id === targetId);
                return map ? `${map.NAME} (ID: ${targetId})` : `Map ID: ${targetId}`;

            default:
                return `ID: ${targetId}`;
        }
    } catch (error) {
        console.error('Error in getTargetDisplayName:', error);
        return `ID: ${targetId}`;
    }
}

export async function getTargetDisplayNameAsync(
    requirementType: string,
    targetId: number
): Promise<string> {
    const templates = await getTemplates();
    return getTargetDisplayName(requirementType, targetId, templates);
}

// Hook để sử dụng trong React components
export function useTemplateMapping() {
    const [templates, setTemplates] = React.useState<TemplateCache | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        getTemplates().then(t => {
            setTemplates(t);
            setLoading(false);
        });
    }, []);

    const getDisplayName = React.useCallback((requirementType: string, targetId: number) => {
        if (!templates) return `ID: ${targetId}`;
        return getTargetDisplayName(requirementType, targetId, templates);
    }, [templates]);

    return { templates, loading, getDisplayName };
}
