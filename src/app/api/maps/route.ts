import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limitParam = searchParams.get('limit') || '10';
        const unlimited = limitParam.toLowerCase() === 'all' || parseInt(limitParam) <= 0;
        const limit = unlimited ? undefined : parseInt(limitParam);
        const search = searchParams.get('search') || '';
        const planetId = searchParams.get('planet_id');
        const type = searchParams.get('type');
        const offset = unlimited ? 0 : (page - 1) * (limit || 10);

        const where: any = {};

        if (search) {
            where.NAME = {
                contains: search,
            };
        }

        if (planetId && planetId !== 'all') {
            where.planet_id = parseInt(planetId);
        }

        if (type && type !== 'all') {
            where.type = parseInt(type);
        }

        const [maps, totalCount] = await Promise.all([
            prisma.map_template.findMany({
                where,
                skip: unlimited ? undefined : offset,
                take: limit,
                orderBy: {
                    id: 'asc',
                },
            }),
            prisma.map_template.count({ where }),
        ]);

        return NextResponse.json({
            maps,
            pagination: {
                page,
                limit: unlimited ? totalCount : limit,
                totalCount,
                totalPages: unlimited ? 1 : Math.ceil(totalCount / (limit || 1)),
            },
        });
    } catch (error) {
        console.error('Error fetching maps:', error);
        return NextResponse.json(
            { error: 'Failed to fetch maps' },
            { status: 500 }
        );
    }
}