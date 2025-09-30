import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const mapId = parseInt(id);

        if (isNaN(mapId)) {
            return NextResponse.json(
                { error: 'Invalid map ID' },
                { status: 400 }
            );
        }

        const map = await prisma.map_template.findUnique({
            where: {
                id: mapId,
            },
        });

        if (!map) {
            return NextResponse.json(
                { error: 'Map not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(map);
    } catch (error) {
        console.error('Error fetching map:', error);
        return NextResponse.json(
            { error: 'Failed to fetch map' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const mapId = parseInt(id);
        const body = await request.json();

        if (isNaN(mapId)) {
            return NextResponse.json(
                { error: 'Invalid map ID' },
                { status: 400 }
            );
        }

        // Check if map exists
        const existingMap = await prisma.map_template.findUnique({
            where: { id: mapId },
        });

        if (!existingMap) {
            return NextResponse.json(
                { error: 'Map not found' },
                { status: 404 }
            );
        }

        // Validate required fields
        const nameValid = typeof body.NAME === 'string' && body.NAME.trim().length > 0;
        const zonesValid = typeof body.zones === 'number' && Number.isFinite(body.zones) && body.zones > 0;
        const maxPlayerValid = typeof body.max_player === 'number' && Number.isFinite(body.max_player) && body.max_player > 0;

        if (!nameValid || !zonesValid || !maxPlayerValid) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: {
                        NAME: nameValid ? undefined : 'Tên map không được để trống',
                        zones: zonesValid ? undefined : 'Số zone phải là số > 0',
                        max_player: maxPlayerValid ? undefined : 'Max player phải là số > 0',
                    },
                },
                { status: 400 }
            );
        }

        // Validate JSON fields for mobs and waypoints (NPCs are handled in frontend)
        try {
            if (body.mobs) JSON.parse(body.mobs);
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON format for mobs' },
                { status: 400 }
            );
        }

        try {
            if (body.waypoints) JSON.parse(body.waypoints);
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON format for waypoints' },
                { status: 400 }
            );
        }

        const updatedMap = await prisma.map_template.update({
            where: {
                id: mapId,
            },
            data: {
                NAME: body.NAME.trim(),
                zones: body.zones,
                max_player: body.max_player,
                type: body.type !== undefined ? body.type : existingMap.type,
                planet_id: body.planet_id !== undefined ? body.planet_id : existingMap.planet_id,
                // Keep original values for complex fields (unless provided)
                bg_type: existingMap.bg_type,
                tile_id: existingMap.tile_id,
                bg_id: existingMap.bg_id,
                data: existingMap.data,
                waypoints: body.waypoints || existingMap.waypoints,
                // Allow editing mobs and npcs
                mobs: body.mobs || existingMap.mobs,
                npcs: body.npcs || existingMap.npcs,
            },
        });

        return NextResponse.json(updatedMap);
    } catch (error) {
        console.error('Error updating map:', error);
        return NextResponse.json(
            { error: 'Failed to update map' },
            { status: 500 }
        );
    }
}