import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache (per server process). Suited for rarely-changing reference data.
type ItemRow = { id: number; NAME: string; TYPE: number; part: number; gender: number; description: string };
type TypeRow = { id: number; NAME: string };
let ITEM_CACHE: { items: ItemRow[]; types: TypeRow[]; loadedAt: number } | null = null;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limitParam = searchParams.get('limit') || '100';
        const unlimited = limitParam.toLowerCase() === 'all' || parseInt(limitParam) <= 0;
        const limit = unlimited ? Number.MAX_SAFE_INTEGER : parseInt(limitParam);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const refresh = searchParams.get('refresh') === '1';

        const offset = unlimited ? 0 : (page - 1) * limit;

        if (!ITEM_CACHE || refresh) {
            const [allItems, allTypes] = await Promise.all([
                prisma.item_template.findMany({
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        NAME: true,
                        TYPE: true,
                        part: true,
                        gender: true,
                        description: true,
                    },
                }),
                prisma.type_item.findMany({
                    select: { id: true, NAME: true },
                    orderBy: { id: 'asc' },
                }),
            ]);
            ITEM_CACHE = { items: allItems as ItemRow[], types: allTypes as TypeRow[], loadedAt: Date.now() };
        }

        // Filter in-memory
        let filtered = ITEM_CACHE.items;
        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter((it) => it.NAME.toLowerCase().includes(s) || String(it.id).includes(s));
        }
        if (type) {
            const t = parseInt(type);
            if (!isNaN(t)) filtered = filtered.filter((it) => it.TYPE === t);
        }

        const totalCount = filtered.length;
        const paged = unlimited ? filtered : filtered.slice(offset, offset + limit);

        return NextResponse.json({
            items: paged,
            types: ITEM_CACHE.types,
            pagination: {
                page,
                limit: unlimited ? totalCount : limit,
                totalCount,
                totalPages: unlimited ? 1 : Math.ceil(totalCount / Math.max(1, limit)),
                cachedAt: ITEM_CACHE.loadedAt,
            },
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch items' },
            { status: 500 }
        );
    }
}
