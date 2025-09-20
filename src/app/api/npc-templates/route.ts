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

        const npcs = await prisma.npc_template.findMany({
            where,
            take: limit,
            orderBy: {
                id: 'asc',
            },
            select: {
                id: true,
                NAME: true,
                head: true,
                body: true,
                leg: true,
                avatar: true,
            },
        });

        return NextResponse.json({
            npcs,
        });
    } catch (error) {
        console.error('Error fetching npc templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch npc templates' },
            { status: 500 }
        );
    }
}
