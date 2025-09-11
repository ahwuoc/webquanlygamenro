import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';

        const offset = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.NAME = {
                contains: search,
            };
        }

        if (type) {
            where.TYPE = parseInt(type);
        }

        const [items, totalCount] = await Promise.all([
            prisma.item_template.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: {
                    id: 'asc',
                },
                select: {
                    id: true,
                    NAME: true,
                    TYPE: true,
                    part: true,
                    gender: true,
                    description: true,
                },
            }),
            prisma.item_template.count({ where }),
        ]);

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
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
