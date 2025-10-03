import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ItemRow = { id: number; NAME: string; TYPE: number; part: number; gender: number; description: string; icon_id: number };
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
                    where: { NAME: { not: '' } },
                    orderBy: { id: 'asc' },
                    select: {
                        id: true,
                        NAME: true,
                        TYPE: true,
                        part: true,
                        gender: true,
                        description: true,
                        icon_id: true,
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

// Create new item_template
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            NAME,
            TYPE,
            part,
            gender,
            description,
            icon_id = 0,
            power_require = 0,
            gold = 0,
            gem = 0,
            head = -1,
            body: bodyPart = -1,
            leg = -1,
            ruby = 0,
            is_up_to_up = false,
        } = body || {};

        if (!Number.isFinite(id) || !NAME || !Number.isFinite(TYPE) || !Number.isFinite(part) || !Number.isFinite(gender)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const created = await prisma.item_template.create({
            data: {
                id: Number(id),
                NAME: String(NAME),
                TYPE: Number(TYPE),
                part: Number(part),
                gender: Number(gender),
                description: String(description ?? ''),
                icon_id: Number(icon_id),
                power_require: Number(power_require),
                gold: Number(gold),
                gem: Number(gem),
                head: Number(head),
                body: Number(bodyPart),
                leg: Number(leg),
                ruby: Number(ruby),
                is_up_to_up: Boolean(is_up_to_up),
            },
        });

        // Invalidate cache
        ITEM_CACHE = null;

        return NextResponse.json({ item: created }, { status: 201 });
    } catch (error) {
        console.error('Error creating item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
