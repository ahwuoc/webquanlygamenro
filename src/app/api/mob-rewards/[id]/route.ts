import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId) || groupId <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const group = await prisma.mob_reward_groups.findUnique({
      where: { id: groupId },
      include: {
        mob_reward_items: {
          include: { mob_reward_item_options: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const firstItem = group.mob_reward_items[0];
    const firstOpt = firstItem?.mob_reward_item_options?.[0];

    return NextResponse.json({
      id: group.id,
      mob_id: group.mob_id,
      item_id: firstItem?.item_id ?? 0,
      quantity_min: firstItem?.quantity_min ?? 1,
      quantity_max: firstItem?.quantity_max ?? 1,
      drop_rate: firstItem?.drop_rate ?? 0,
      map_restriction: group.map_restriction,
      gender_restriction: group.planet_restriction,
      option_id: firstOpt?.option_id ?? 0,
      option_level: firstOpt?.param ?? 0,
      is_active: group.is_active,
      created_at: group.created_at,
      updated_at: group.updated_at,
      _items: group.mob_reward_items,
    });
  } catch (error) {
    console.error('Error fetching mob_reward:', error);
    return NextResponse.json({ error: 'Failed to fetch mob reward' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId) || groupId <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();

    if (body.quantity_min !== undefined && body.quantity_max !== undefined) {
      if (Number(body.quantity_min) > Number(body.quantity_max)) {
        return NextResponse.json({ error: 'quantity_min must be <= quantity_max' }, { status: 400 });
      }
    }

    // Update group fields
    await prisma.mob_reward_groups.update({
      where: { id: groupId },
      data: {
        ...(body.mob_id !== undefined ? { mob_id: Number(body.mob_id) } : {}),
        ...(body.map_restriction !== undefined ? { map_restriction: body.map_restriction } : {}),
        ...(body.gender_restriction !== undefined ? { planet_restriction: Number(body.gender_restriction) } : {}),
        ...(body.is_active !== undefined ? { is_active: Boolean(body.is_active) } : {}),
        updated_at: new Date(),
      },
    });

    // Find first item
    const firstItem = await prisma.mob_reward_items.findFirst({
      where: { group_id: groupId },
      orderBy: { id: 'asc' },
    });

    if (firstItem) {
      await prisma.mob_reward_items.update({
        where: { id: firstItem.id },
        data: {
          ...(body.item_id !== undefined ? { item_id: Number(body.item_id) } : {}),
          ...(body.quantity_min !== undefined ? { quantity_min: Number(body.quantity_min) } : {}),
          ...(body.quantity_max !== undefined ? { quantity_max: Number(body.quantity_max) } : {}),
          ...(body.drop_rate !== undefined ? { drop_rate: Number(body.drop_rate) } : {}),
          updated_at: new Date(),
        },
      });

      // Handle first option (create/update/delete accordingly)
      const firstOpt = await prisma.mob_reward_item_options.findFirst({
        where: { reward_item_id: firstItem.id },
        orderBy: { id: 'asc' },
      });

      const optionId = body.option_id !== undefined ? Number(body.option_id) : undefined;
      const param = body.option_level !== undefined ? Number(body.option_level) : undefined;

      if (optionId !== undefined || param !== undefined) {
        const data: any = {};
        if (optionId !== undefined) data.option_id = optionId;
        if (param !== undefined) data.param = param;

        if (firstOpt) {
          await prisma.mob_reward_item_options.update({ where: { id: firstOpt.id }, data });
        } else {
          // Only create if at least one provided and not both zero
          if ((optionId ?? 0) > 0 || (param ?? 0) > 0) {
            await prisma.mob_reward_item_options.create({
              data: {
                reward_item_id: firstItem.id,
                option_id: optionId ?? 0,
                param: param ?? 0,
              },
            });
          }
        }
      }
    }

    // Return updated flattened data
    const updatedGroup = await prisma.mob_reward_groups.findUnique({
      where: { id: groupId },
      include: {
        mob_reward_items: { include: { mob_reward_item_options: true }, orderBy: { id: 'asc' } },
      },
    });
    const uItem = updatedGroup?.mob_reward_items[0];
    const uOpt = uItem?.mob_reward_item_options?.[0];
    return NextResponse.json({
      id: updatedGroup!.id,
      mob_id: updatedGroup!.mob_id,
      item_id: uItem?.item_id ?? 0,
      quantity_min: uItem?.quantity_min ?? 1,
      quantity_max: uItem?.quantity_max ?? 1,
      drop_rate: uItem?.drop_rate ?? 0,
      map_restriction: updatedGroup!.map_restriction,
      gender_restriction: updatedGroup!.planet_restriction,
      option_id: uOpt?.option_id ?? 0,
      option_level: uOpt?.param ?? 0,
      is_active: updatedGroup!.is_active,
      created_at: updatedGroup!.created_at,
      updated_at: updatedGroup!.updated_at,
    });
  } catch (error) {
    console.error('Error updating mob_reward:', error);
    return NextResponse.json({ error: 'Failed to update mob reward' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = parseInt(id, 10);
    if (isNaN(groupId) || groupId <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await prisma.mob_reward_groups.delete({ where: { id: groupId } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting mob_reward:', error);
    return NextResponse.json({ error: 'Failed to delete mob reward' }, { status: 500 });
  }
}

