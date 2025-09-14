import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/giftcodes/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const gift = await prisma.gift_codes.findUnique({
      where: { id: gcId },
      include: {
        gift_code_items: { include: { gift_code_item_options: true } },
        gift_code_player_restrictions: true,
        gift_code_usage: true,
      },
    });
    if (!gift) return NextResponse.json({ error: 'Gift code not found' }, { status: 404 });

    return NextResponse.json(gift);
  } catch (error) {
    console.error('Error fetching gift code:', error);
    return NextResponse.json({ error: 'Failed to fetch gift code' }, { status: 500 });
  }
}

// PUT /api/giftcodes/[id]
// Update main fields only (nested updates can be added via dedicated endpoints)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      max_uses,
      expired_date,
      is_active,
      player_limit_type,
      vip_level_min,
    } = body || {};

    const updated = await prisma.gift_codes.update({
      where: { id: gcId },
      data: {
        code: typeof code === 'string' ? code.trim() : undefined,
        name: typeof name === 'string' ? name.trim() : undefined,
        description: description === undefined ? undefined : (description ?? null),
        max_uses: typeof max_uses === 'number' ? max_uses : undefined,
        expired_date: expired_date === undefined ? undefined : (expired_date ? new Date(expired_date) : null),
        is_active: typeof is_active === 'boolean' ? is_active : undefined,
        player_limit_type: player_limit_type as any || undefined,
        vip_level_min: typeof vip_level_min === 'number' ? vip_level_min : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating gift code:', error);
    return NextResponse.json({ error: 'Failed to update gift code' }, { status: 500 });
  }
}

// DELETE /api/giftcodes/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    await prisma.gift_codes.delete({ where: { id: gcId } });
    return NextResponse.json({ message: 'Gift code deleted' });
  } catch (error) {
    console.error('Error deleting gift code:', error);
    return NextResponse.json({ error: 'Failed to delete gift code' }, { status: 500 });
  }
}
