import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/giftcodes/[id]/restrictions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const rows = await prisma.gift_code_player_restrictions.findMany({
      where: { gift_code_id: gcId },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching restrictions:', error);
    return NextResponse.json({ error: 'Failed to fetch restrictions' }, { status: 500 });
  }
}

// POST /api/giftcodes/[id]/restrictions
// body: { player_id: number, restriction_type: 'ALLOWED' | 'BLOCKED' }
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const body = await request.json();
    const player_id = Number(body?.player_id);
    const restriction_type = String(body?.restriction_type) as 'ALLOWED' | 'BLOCKED';

    if (!Number.isFinite(player_id) || player_id <= 0) {
      return NextResponse.json({ error: 'player_id không hợp lệ' }, { status: 400 });
    }
    if (restriction_type !== 'ALLOWED' && restriction_type !== 'BLOCKED') {
      return NextResponse.json({ error: 'restriction_type phải là ALLOWED hoặc BLOCKED' }, { status: 400 });
    }

    // Upsert behavior: if exists, update type; else create
    const row = await prisma.gift_code_player_restrictions.upsert({
      where: { gift_code_id_player_id: { gift_code_id: gcId, player_id } },
      update: { restriction_type },
      create: { gift_code_id: gcId, player_id, restriction_type },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error upserting restriction:', error);
    return NextResponse.json({ error: 'Failed to upsert restriction' }, { status: 500 });
  }
}

// DELETE /api/giftcodes/[id]/restrictions?player_id=123
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gcId = parseInt(id, 10);
    if (Number.isNaN(gcId) || gcId <= 0) {
      return NextResponse.json({ error: 'Invalid gift code id' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const player_id = Number(searchParams.get('player_id'));
    if (!Number.isFinite(player_id) || player_id <= 0) {
      return NextResponse.json({ error: 'player_id không hợp lệ' }, { status: 400 });
    }

    await prisma.gift_code_player_restrictions.delete({
      where: { gift_code_id_player_id: { gift_code_id: gcId, player_id } },
    });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting restriction:', error);
    return NextResponse.json({ error: 'Failed to delete restriction' }, { status: 500 });
  }
}
