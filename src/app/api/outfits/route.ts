import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
    try {
        const outfits = await prisma.item_template.findMany({
            where: {
                TYPE: 5, // Trang phục
            },
            select: {
                id: true,
                NAME: true,
                description: true,
                gender: true,
                part: true,
                head: true,
                body: true,
                leg: true,
                gold: true,
                gem: true,
                icon_id: true,
                power_require: true,
            },
            orderBy: [
                { part: 'asc' },
                { NAME: 'asc' },
            ],
        });

        return NextResponse.json(outfits);
    } catch (error) {
        console.error('Error fetching outfits:', error);
        return NextResponse.json(
            { error: 'Failed to fetch outfits' },
            { status: 500 }
        );
    }
}
