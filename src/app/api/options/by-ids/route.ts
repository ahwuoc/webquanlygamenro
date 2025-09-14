import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const idsParam = (searchParams.get('ids') || '').trim();
        if (!idsParam) return NextResponse.json({ options: [] });

        const ids = idsParam
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => Number.isFinite(n));

        if (ids.length === 0) return NextResponse.json({ options: [] });

        const rows = await prisma.item_option_template.findMany({
            where: { id: { in: ids } },
            select: { id: true, NAME: true },
        });

        return NextResponse.json({ options: rows });
    } catch (error) {
        console.error('Fetch options by ids error:', error);
        return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
    }
}
