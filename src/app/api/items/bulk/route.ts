import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Bulk update items
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, updates } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
        }

        const updateData: any = {};

        if (updates.TYPE !== undefined) updateData.TYPE = Number(updates.TYPE);
        if (updates.part !== undefined) updateData.part = Number(updates.part);
        if (updates.gender !== undefined) updateData.gender = Number(updates.gender);
        if (updates.description !== undefined) updateData.description = String(updates.description);
        if (updates.icon_id !== undefined) updateData.icon_id = Number(updates.icon_id);
        if (updates.power_require !== undefined) updateData.power_require = Number(updates.power_require);
        if (updates.gold !== undefined) updateData.gold = Number(updates.gold);
        if (updates.gem !== undefined) updateData.gem = Number(updates.gem);
        if (updates.head !== undefined) updateData.head = Number(updates.head);
        if (updates.body !== undefined) updateData.body = Number(updates.body);
        if (updates.leg !== undefined) updateData.leg = Number(updates.leg);
        if (updates.ruby !== undefined) updateData.ruby = Number(updates.ruby);
        if (updates.is_up_to_up !== undefined) updateData.is_up_to_up = Boolean(updates.is_up_to_up);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
        }

        // Perform bulk update
        const result = await prisma.item_template.updateMany({
            where: {
                id: {
                    in: ids.map(id => Number(id))
                }
            },
            data: updateData
        });

        return NextResponse.json({
            message: `Successfully updated ${result.count} items`,
            updatedCount: result.count
        });
    } catch (error) {
        console.error('Error bulk updating items:', error);
        return NextResponse.json({ error: 'Failed to bulk update items' }, { status: 500 });
    }
}

// Bulk delete items
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'IDs array is required' }, { status: 400 });
        }

        const result = await prisma.item_template.deleteMany({
            where: {
                id: {
                    in: ids.map(id => Number(id))
                }
            }
        });

        return NextResponse.json({
            message: `Successfully deleted ${result.count} items`,
            deletedCount: result.count
        });
    } catch (error) {
        console.error('Error bulk deleting items:', error);
        return NextResponse.json({ error: 'Failed to bulk delete items' }, { status: 500 });
    }
}
