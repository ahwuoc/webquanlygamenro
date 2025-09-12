import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop-items?tab_id=number&page=1&limit=50&search_temp=
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tabIdParam = searchParams.get('tab_id');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const searchTemp = (searchParams.get('search_temp') || '').trim();
        const typeSellParam = searchParams.get('type_sell');
        const offset = (page - 1) * limit;

        if (!tabIdParam) {
            return NextResponse.json({ error: 'tab_id is required' }, { status: 400 });
        }
        const tab_id = parseInt(tabIdParam, 10);
        if (Number.isNaN(tab_id) || tab_id <= 0) {
            return NextResponse.json({ error: 'Invalid tab_id' }, { status: 400 });
        }

        const where: any = { tab_id };
        if (searchTemp) {
            const maybeId = parseInt(searchTemp, 10);
            if (!Number.isNaN(maybeId)) {
                where.temp_id = maybeId;
            }
        }
        if (typeSellParam) {
            const ts = parseInt(typeSellParam, 10);
            if (!Number.isNaN(ts)) where.type_sell = ts;
        }

        const [items, totalCount] = await Promise.all([
            prisma.item_shop.findMany({ where, skip: offset, take: limit, orderBy: { id: 'desc' } }),
            prisma.item_shop.count({ where }),
        ]);

        const tempIds = Array.from(new Set<number>(items.map((it) => it.temp_id)));
        const templates = await prisma.item_template.findMany({
            where: { id: { in: tempIds } },
            select: { id: true, NAME: true, TYPE: true, gender: true, part: true, description: true, icon_id: true },
        });
        const templateMap = new Map(templates.map((t) => [t.id, t]));

        return NextResponse.json({
            items: items.map((it) => ({
                ...it,
                template: templateMap.get(it.temp_id) || null,
            })),
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / Math.max(1, limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching shop items:', error);
        return NextResponse.json({ error: 'Failed to fetch shop items' }, { status: 500 });
    }
}

// POST /api/shop-items
// body: { tab_id: number, temp_id: number, is_new?: boolean, is_sell?: boolean, type_sell?: number, cost?: number, icon_spec?: number }
export async function POST(request: NextRequest) {
    try {
            const body = await request.json();
        const { tab_id, temp_id, is_new, is_sell, type_sell, cost } = body || {};

        if (!tab_id || Number.isNaN(Number(tab_id))) {
            return NextResponse.json({ error: 'tab_id is required' }, { status: 400 });
        }
        if (!temp_id || Number.isNaN(Number(temp_id))) {
            return NextResponse.json({ error: 'temp_id is required' }, { status: 400 });
        }

        // Optionally ensure template exists
        const template = await prisma.item_template.findUnique({ where: { id: Number(temp_id) } });
        if (!template) {
            return NextResponse.json({ error: 'item_template not found' }, { status: 404 });
        }

        const created = await prisma.item_shop.create({
            data: {
                tab_id: Number(tab_id),
                temp_id: Number(temp_id),
                is_new: typeof is_new === 'boolean' ? is_new : undefined,
                is_sell: typeof is_sell === 'boolean' ? is_sell : undefined,
                type_sell: typeof type_sell === 'number' ? type_sell : undefined,
                cost: typeof cost === 'number' ? cost : undefined,
                // icon_spec must be the icon_id of the sold item_template
                icon_spec: template.icon_id,
            },
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Error creating shop item:', error);
        return NextResponse.json({ error: 'Failed to create shop item' }, { status: 500 });
    }
}
