import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '100');

        const where: any = {};

        if (search) {
            where.NAME = {
                contains: search,
            };
        }

        const mobs = await prisma.mob_template.findMany({
            where,
            take: limit,
            orderBy: {
                id: 'asc',
            },
            select: {
                id: true,
                NAME: true,
                TYPE: true,
                hp: true,
            },
        });

        return NextResponse.json({
            mobs,
        });
    } catch (error) {
        console.error('Error fetching mob templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mob templates' },
            { status: 500 }
        );
    }
}
