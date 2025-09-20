import { prisma } from "@/lib/prisma";
import MapForm from '@/components/MapForm';
import { notFound } from "next/navigation";

interface MapEditPageProps {
    params: {
        id: string;
    };
}

export default async function MapEditPage({ params }: MapEditPageProps) {
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

    return <MapForm mapId={mapId} initialData={map} />;
}