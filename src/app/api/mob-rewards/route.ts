import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/mob-rewards?page=1&limit=20&mob_id=1&active=1
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const mobId = searchParams.get('mob_id');
    const itemId = searchParams.get('item_id');
    const active = searchParams.get('active'); // '1' | '0' | null

    const where: any = {};
    if (mobId) where.mob_id = parseInt(mobId, 10);
    if (active === '1') where.is_active = true;
    if (active === '0') where.is_active = false;
    if (itemId) {
      const iid = parseInt(itemId, 10);
      if (!Number.isNaN(iid)) {
        where.mob_reward_items = { some: { item_id: iid } };
      }
    }

    const skip = (page - 1) * limit;

    const [groups, totalCount] = await Promise.all([
      prisma.mob_reward_groups.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
        include: {
          mob_reward_items: {
            include: { mob_reward_item_options: true },
            orderBy: { id: 'asc' },
          },
        },
      }),
      prisma.mob_reward_groups.count({ where }),
    ]);

    // Flatten first item/option for current UI
    const data = groups.map((g: any) => {
      const firstItem = g.mob_reward_items[0];
      const firstOpt = firstItem?.mob_reward_item_options?.[0];
      return {
        id: g.id,
        mob_id: g.mob_id,
        // Backward-compatible flattened fields (first item only)
        item_id: firstItem?.item_id ?? 0,
        quantity_min: firstItem?.quantity_min ?? 1,
        quantity_max: firstItem?.quantity_max ?? 1,
        drop_rate: firstItem?.drop_rate ?? 0,
        map_restriction: g.map_restriction,
        gender_restriction: g.planet_restriction, // backward-compatible field name
        option_id: firstOpt?.option_id ?? 0,
        option_level: firstOpt?.param ?? 0,
        is_active: g.is_active,
        created_at: g.created_at,
        updated_at: g.updated_at,
        // New: full items for this group
        items: g.mob_reward_items.map((it: any) => ({
          id: it.id,
          item_id: it.item_id,
          quantity_min: it.quantity_min,
          quantity_max: it.quantity_max,
          drop_rate: it.drop_rate,
          options: (it.mob_reward_item_options || []).map((op: any) => ({ id: op.id, option_id: op.option_id, param: op.param })),
        })),
        _items_count: g.mob_reward_items.length,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching mob_rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch mob rewards' }, { status: 500 });
  }
}

// POST /api/mob-rewards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // If nested items provided, create in nested mode
    if (Array.isArray(body.items)) {
      if (body.mob_id === undefined || body.mob_id === null) {
        return NextResponse.json({ error: 'Missing field: mob_id' }, { status: 400 });
      }
      // basic validation for items
      for (const [i, it] of (body.items as any[]).entries()) {
        const req = ['item_id', 'quantity_min', 'quantity_max', 'drop_rate'];
        for (const k of req) {
          if (it[k] === undefined || it[k] === null) {
            return NextResponse.json({ error: `Item[${i}] missing field: ${k}` }, { status: 400 });
          }
        }
        if (Number(it.quantity_min) > Number(it.quantity_max)) {
          return NextResponse.json({ error: `Item[${i}] quantity_min must be <= quantity_max` }, { status: 400 });
        }
      }

      const group = await prisma.mob_reward_groups.create({
        data: {
          mob_id: Number(body.mob_id),
          map_restriction: body.map_restriction ?? null,
          planet_restriction: body.planet_restriction !== undefined
            ? Number(body.planet_restriction)
            : (body.gender_restriction !== undefined ? Number(body.gender_restriction) : -1),
          is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
        },
      });

      for (const it of body.items as any[]) {
        const createdItem = await prisma.mob_reward_items.create({
          data: {
            group_id: group.id,
            item_id: Number(it.item_id),
            quantity_min: Number(it.quantity_min),
            quantity_max: Number(it.quantity_max),
            drop_rate: Number(it.drop_rate),
          },
        });
        if (Array.isArray(it.options)) {
          for (const op of it.options) {
            await prisma.mob_reward_item_options.create({
              data: {
                reward_item_id: createdItem.id,
                option_id: Number(op.option_id || 0),
                param: Number(op.param || 0),
              },
            });
          }
        }
      }

      // Return group with nested items for advanced UI
      const full = await prisma.mob_reward_groups.findUnique({
        where: { id: group.id },
        include: {
          mob_reward_items: {
            include: { mob_reward_item_options: true },
            orderBy: { id: 'asc' },
          },
        },
      });
      return NextResponse.json(full, { status: 201 });
    }

    // Fallback: flat single-item create (backward compatible)
    const required = ['mob_id', 'item_id', 'quantity_min', 'quantity_max', 'drop_rate'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null) {
        return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
      }
    }
    if (Number(body.quantity_min) > Number(body.quantity_max)) {
      return NextResponse.json({ error: 'quantity_min must be <= quantity_max' }, { status: 400 });
    }
    const group = await prisma.mob_reward_groups.create({
      data: {
        mob_id: Number(body.mob_id),
        map_restriction: body.map_restriction ?? null,
        planet_restriction: body.gender_restriction !== undefined ? Number(body.gender_restriction) : -1,
        is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      },
    });
    const item = await prisma.mob_reward_items.create({
      data: {
        group_id: group.id,
        item_id: Number(body.item_id),
        quantity_min: Number(body.quantity_min),
        quantity_max: Number(body.quantity_max),
        drop_rate: Number(body.drop_rate),
      },
    });
    let opt: any = null;
    const optionId = Number(body.option_id || 0);
    const param = Number(body.option_level || 0);
    if (optionId > 0 || param > 0) {
      opt = await prisma.mob_reward_item_options.create({
        data: {
          reward_item_id: item.id,
          option_id: optionId,
          param,
        },
      });
    }
    return NextResponse.json({
      id: group.id,
      mob_id: group.mob_id,
      item_id: item.item_id,
      quantity_min: item.quantity_min,
      quantity_max: item.quantity_max,
      drop_rate: item.drop_rate,
      map_restriction: group.map_restriction,
      gender_restriction: group.planet_restriction,
      option_id: opt?.option_id ?? 0,
      option_level: opt?.param ?? 0,
      is_active: group.is_active,
      created_at: group.created_at,
      updated_at: group.updated_at,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating mob_reward group:', error);
    return NextResponse.json({ error: 'Failed to create mob reward' }, { status: 500 });
  }
}
