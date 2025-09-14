export type NpcTemplate = { id: number; name: string };

export const NPC_TEMPLATES: NpcTemplate[] = [
  { id: 0, name: 'Rock' },
  { id: 105, name: 'Người Hướng Dẫn' },
  { id: 55, name: 'Berrus' },
  { id: 17, name: 'Bò Mộng' },
  { id: 16, name: 'Uron' },
  { id: 21, name: 'Bà Hạt Mít' },
  { id: 107, name: 'Thần Bí' },
  // Bổ sung thêm theo database thực tế khi cần
];

const npcMap: Record<number, string> = NPC_TEMPLATES.reduce((acc, cur) => {
  acc[cur.id] = cur.name;
  return acc;
}, {} as Record<number, string>);

export function npcNameById(id?: number | null): string | undefined {
  if (id == null) return undefined;
  return npcMap[id];
}
