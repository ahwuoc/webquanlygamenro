import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/shop-items/bulk - Bulk update shop items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_ids, updates } = body || {};

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ error: 'item_ids array is required' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
    }

    // Validate item_ids are numbers
    const validIds = item_ids.filter(id => Number.isInteger(Number(id))).map(id => Number(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid item IDs provided' }, { status: 400 });
    }

    // Build update data object
    const updateData: any = {};
    
    if (updates.type_sell !== undefined && updates.type_sell !== '') {
      updateData.type_sell = Number(updates.type_sell);
    }
    
    if (updates.cost !== undefined && updates.cost !== '') {
      updateData.cost = Number(updates.cost);
    }
    
    if (updates.is_new !== undefined) {
      updateData.is_new = Boolean(updates.is_new);
    }
    
    if (updates.is_sell !== undefined) {
      updateData.is_sell = Boolean(updates.is_sell);
    }

    // If temp_id is being updated, we need to handle icon_spec
    if (updates.temp_id !== undefined && updates.temp_id !== '') {
      const tempId = Number(updates.temp_id);
      updateData.temp_id = tempId;
      
      // Get the template to update icon_spec
      const template = await prisma.item_template.findUnique({ 
        where: { id: tempId },
        select: { icon_id: true }
      });
      
      if (template) {
        updateData.icon_spec = template.icon_id;
      }
    }

    // If icon_spec is explicitly provided, use it
    if (updates.icon_spec !== undefined && updates.icon_spec !== '') {
      updateData.icon_spec = Number(updates.icon_spec);
    }

    // Perform bulk update
    const result = await prisma.item_shop.updateMany({
      where: {
        id: { in: validIds }
      },
      data: updateData
    });

    return NextResponse.json({
      message: `Updated ${result.count} items successfully`,
      updated_count: result.count,
      requested_ids: validIds.length
    });

  } catch (error) {
    console.error('Error bulk updating shop items:', error);
    return NextResponse.json({ error: 'Failed to bulk update shop items' }, { status: 500 });
  }
}

// DELETE /api/shop-items/bulk - Bulk delete shop items
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_ids } = body || {};

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ error: 'item_ids array is required' }, { status: 400 });
    }

    // Validate item_ids are numbers
    const validIds = item_ids.filter(id => Number.isInteger(Number(id))).map(id => Number(id));
    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid item IDs provided' }, { status: 400 });
    }

    // Perform bulk delete
    const result = await prisma.item_shop.deleteMany({
      where: {
        id: { in: validIds }
      }
    });

    return NextResponse.json({
      message: `Deleted ${result.count} items successfully`,
      deleted_count: result.count,
      requested_ids: validIds.length
    });

  } catch (error) {
    console.error('Error bulk deleting shop items:', error);
    return NextResponse.json({ error: 'Failed to bulk delete shop items' }, { status: 500 });
  }
}
