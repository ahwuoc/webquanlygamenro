import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
    try {
        const maps = await prisma.map_template.findMany({
            select: {
                id: true,
                NAME: true,
                zones: true,
                max_player: true,
                type: true,
                planet_id: true,
            },
            orderBy: {
                NAME: 'asc',
            },
        });

        return NextResponse.json(maps);
    } catch (error) {
        console.error('Error fetching maps:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maps' },
            { status: 500 }
        );
    }
}
