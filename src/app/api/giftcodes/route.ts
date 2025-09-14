import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/giftcodes
// List gift codes from normalized schema with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = searchParams.get('limit') || '10';
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam, 10);
    const offset = limit ? (page - 1) * limit : 0;

    const code = searchParams.get('code')?.trim() || '';
    const isActiveParam = searchParams.get('active'); // 'all' | '1' | '0'
    const playerLimitType = searchParams.get('player_limit_type') || undefined; // NONE | SPECIFIC_PLAYERS | EXCLUDE_PLAYERS | VIP_ONLY
    const expiredStatus = searchParams.get('expired'); // 'all' | 'yes' | 'no'

    const where: any = {};
    if (code) where.code = { contains: code };
    if (isActiveParam && isActiveParam !== 'all') where.is_active = isActiveParam === '1';
    if (playerLimitType && playerLimitType !== 'all') where.player_limit_type = playerLimitType as any;
    if (expiredStatus && expiredStatus !== 'all') {
      const now = new Date();
      if (expiredStatus === 'yes') {
        where.OR = [
          { expired_date: { lt: now } },
          { expired_date: { not: null, lt: now } },
        ];
      } else if (expiredStatus === 'no') {
        where.OR = [
          { expired_date: null },
          { expired_date: { gt: now } },
        ];
      }
    }

    const [rows, totalCount] = await Promise.all([
      prisma.gift_codes.findMany({
        where,
        skip: limit ? offset : 0,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          gift_code_items: {
            include: { gift_code_item_options: true },
          },
          gift_code_player_restrictions: true,
          gift_code_usage: true,
        },
      }),
      prisma.gift_codes.count({ where }),
    ]);

    // Map to a concise response
    const data = rows.map((gc) => ({
      id: gc.id,
      code: gc.code,
      name: gc.name,
      description: gc.description,
      max_uses: gc.max_uses ?? 0,
      current_uses: gc.current_uses ?? 0,
      created_date: gc.created_date,
      expired_date: gc.expired_date,
      is_active: gc.is_active ?? true,
      player_limit_type: gc.player_limit_type ?? 'NONE',
      vip_level_min: gc.vip_level_min ?? 0,
      items_count: gc.gift_code_items.length,
      options_count: gc.gift_code_items.reduce((sum, it) => sum + it.gift_code_item_options.length, 0),
      restrictions_count: gc.gift_code_player_restrictions.length,
      usage_count: gc.gift_code_usage.length,
    }));

    return NextResponse.json({
      data,
      pagination: limit
        ? {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / (limit || 1)),
          }
        : { page: 1, limit: totalCount, totalCount, totalPages: 1 },
    });
  } catch (error) {
    console.error('Error fetching gift codes:', error);
    return NextResponse.json({ error: 'Failed to fetch gift codes' }, { status: 500 });
  }
}

// POST /api/giftcodes
// Create a base gift code (without nested items/restrictions for now)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      max_uses = 0,
      expired_date = null,
      is_active = true,
      player_limit_type = 'NONE',
      vip_level_min = 0,
    } = body || {};

    if (typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'code không được để trống' }, { status: 400 });
    }
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name không được để trống' }, { status: 400 });
    }

    const existing = await prisma.gift_codes.findUnique({ where: { code: code.trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Code đã tồn tại' }, { status: 400 });
    }

    const created = await prisma.gift_codes.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description: description ?? null,
        max_uses: Number(max_uses) || 0,
        current_uses: 0,
        expired_date: expired_date ? new Date(expired_date) : null,
        is_active: Boolean(is_active),
        player_limit_type: player_limit_type,
        vip_level_min: Number(vip_level_min) || 0,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating gift code:', error);
    return NextResponse.json({ error: 'Failed to create gift code' }, { status: 500 });
  }
}
