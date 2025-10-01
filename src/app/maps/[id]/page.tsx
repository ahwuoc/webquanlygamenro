import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

interface MapDetailPageProps {
    params: {
        id: string;
    };
}

export default async function MapDetailPage({ params }: MapDetailPageProps) {
    const { id } = await params;
    const mapId = parseInt(id);

    if (isNaN(mapId)) {
        notFound();
    }

    const map = await prisma.map_template.findUnique({
        where: {
            id: mapId,
        },
    });

    if (!map) {
        notFound();
    }

    const _getPlanetName = (planetId: number) => {
        switch (planetId) {
            case 0: return 'Trái Đất';
            case 1: return 'Namek';
            case 2: return 'Xayda';
            default: return `Hành tinh ${planetId}`;
        }
    };

    const _getPlanetColor = (planetId: number) => {
        switch (planetId) {
            case 0: return 'blue';
            case 1: return 'green';
            case 2: return 'orange';
            default: return 'default';
        }
    };

    const _getMapTypeName = (type: number) => {
        switch (type) {
            case 0: return 'Thường';
            case 1: return 'PvP';
            case 2: return 'Boss';
            case 3: return 'Event';
            default: return `Loại ${type}`;
        }
    };

    const _getMapTypeColor = (type: number) => {
        switch (type) {
            case 0: return 'default';
            case 1: return 'red';
            case 2: return 'purple';
            case 3: return 'gold';
            default: return 'default';
        }
    };

    const _getBgTypeName = (bgType: number) => {
        switch (bgType) {
            case 0: return 'Ngày';
            case 1: return 'Đêm';
            case 2: return 'Hoàng hôn';
            case 3: return 'Bình minh';
            default: return `Loại ${bgType}`;
        }
    };

    // Redirect directly to edit page to streamline UX
    redirect(`/maps/${map.id}/edit`);
}
