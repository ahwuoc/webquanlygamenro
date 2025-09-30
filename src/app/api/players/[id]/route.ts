import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/players/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (Number.isNaN(playerId) || playerId <= 0) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      gender,
      head,
      thoi_vang,
      account_id,
    } = body || {};

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        gender: typeof gender === 'number' ? gender : undefined,
        head: typeof head === 'number' ? head : undefined,
        thoi_vang: typeof thoi_vang === 'number' ? thoi_vang : undefined,
        account_id: typeof account_id === 'number' || account_id === null ? account_id : undefined,
      },
      select: {
        id: true,
        account_id: true,
        name: true,
        gender: true,
        head: true,
        thoi_vang: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}

// DELETE /api/players/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const playerId = parseInt(id, 10);
    if (Number.isNaN(playerId) || playerId <= 0) {
      return NextResponse.json({ error: 'Invalid player id' }, { status: 400 });
    }

    await prisma.player.delete({ where: { id: playerId } });
    return NextResponse.json({ message: 'Player deleted' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 });
  }
}
