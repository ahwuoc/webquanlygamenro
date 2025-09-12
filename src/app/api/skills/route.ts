import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
    try {
        const skills = await prisma.skill_template.findMany({
            select: {
                nclass_id: true,
                id: true,
                NAME: true,
                max_point: true,
                mana_use_type: true,
                TYPE: true,
                icon_id: true,
                dam_info: true,
                slot: true,
            },
            orderBy: [
                { nclass_id: 'asc' },
                { id: 'asc' },
            ],
        });

        return NextResponse.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        return NextResponse.json(
            { error: 'Failed to fetch skills' },
            { status: 500 }
        );
    }
}
