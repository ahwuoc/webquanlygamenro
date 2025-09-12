"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, InputNumber, Select, Switch, Table, Space, Popconfirm } from "antd";
import { Controller, useFieldArray, useForm } from "react-hook-form";

export type AdvancedOption = {
  id?: number;
  option_id: number;
  param: number;
};

export type AdvancedItem = {
  id?: number;
  item_id: number;
  quantity_min: number;
  quantity_max: number;
  drop_rate: number;
  options: AdvancedOption[];
};

export type AdvancedGroupForm = {
  mob_id: number;
  map_restriction?: string | null;
  planet_restriction: number; // -1,0,1,2
  is_active: boolean;
  items: AdvancedItem[];
};

interface Props {
  value?: Partial<AdvancedGroupForm & { id?: number }>;
  onSubmit: (data: AdvancedGroupForm) => Promise<void> | void;
  submitting?: boolean;
}

// Child component to manage options for a given item
function OptionsEditor({ control, itemName }: { control: any; itemName: string }) {
  const { fields: optionFields, append: appendOpt, remove: removeOpt } = useFieldArray({ control, name: `${itemName}.options` as any });
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Options</div>
        <Button onClick={() => appendOpt({ option_id: 0, param: 0 })}>+ Thêm option</Button>
      </div>
      <Table
        rowKey={(r) => String((r as any).id ?? `${itemName}-${(r as any).option_id}-${(r as any).param}`)}
        dataSource={optionFields as any}
        pagination={false}
        columns={[
          {
            title: 'Option ID',
            render: (_: any, __: any, i: number) => (
              <Controller
                name={`${itemName}.options.${i}.option_id` as any}
                control={control}
                render={({ field }) => (
                  <InputNumber min={0} value={field.value} onChange={(v) => field.onChange(v)} />
                )}
              />
            ),
          },
          {
            title: 'Param',
            render: (_: any, __: any, i: number) => (
              <Controller
                name={`${itemName}.options.${i}.param` as any}
                control={control}
                render={({ field }) => (
                  <InputNumber min={0} value={field.value} onChange={(v) => field.onChange(v)} />
                )}
              />
            ),
          },
          {
            title: 'Thao tác',
            render: (_: any, __: any, i: number) => (
              <Popconfirm title="Xóa option này?" onConfirm={() => removeOpt(i)}>
                <Button danger>Xóa</Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  );
}

export default function MobRewardAdvancedForm({ value, onSubmit, submitting }: Props) {
  const { control, handleSubmit, watch } = useForm<AdvancedGroupForm>({
    defaultValues: {
      mob_id: 0,
      map_restriction: null,
      planet_restriction: -1,
      is_active: true,
      items: [
        { item_id: 0, quantity_min: 1, quantity_max: 1, drop_rate: 0, options: [] },
      ],
      ...value,
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "items" });

  const [mobsList, setMobsList] = useState<{ id: number; NAME: string }[]>([]);
  const [itemsList, setItemsList] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const [mobsRes, itemsRes] = await Promise.all([
          fetch("/api/mobs?limit=all"),
          fetch("/api/items?limit=all"),
        ]);
        if (!cancelled) {
          if (mobsRes.ok) {
            const m = await mobsRes.json();
            if (Array.isArray(m)) setMobsList(m);
          }
          if (itemsRes.ok) {
            const it = await itemsRes.json();
            if (Array.isArray(it)) setItemsList(it);
            else if (Array.isArray(it?.items)) setItemsList(it.items);
          }
        }
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    loadMeta();
    return () => { cancelled = true; };
  }, []);

  const mobOptions = useMemo(() => mobsList.map(m => ({ label: `${m.NAME} (#${m.id})`, value: String(m.id) })), [mobsList]);
  const itemOptions = useMemo(() => itemsList.map(it => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id) })), [itemsList]);

  return (
    <Card>
      <form
        className="space-y-6"
        onSubmit={handleSubmit(async (data) => {
          // normalize map_restriction empty string to null
          const normalized: AdvancedGroupForm = {
            ...data,
            map_restriction: data.map_restriction === "" ? null : data.map_restriction ?? null,
            items: data.items.map(it => ({
              ...it,
              quantity_min: Number(it.quantity_min || 1),
              quantity_max: Number(it.quantity_max || 1),
              drop_rate: Number(it.drop_rate || 0),
              options: (it.options || []).map(op => ({ option_id: Number(op.option_id || 0), param: Number(op.param || 0), id: op.id }))
            })),
          };

          for (const it of normalized.items) {
            if (it.quantity_min > it.quantity_max) {
              alert("Số lượng tối thiểu phải <= số lượng tối đa");
              return;
            }
          }

          await onSubmit(normalized);
        })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label>Mob</label>
            <Controller
              name="mob_id"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  placeholder={loadingMeta ? 'Đang tải...' : 'Chọn mob'}
                  loading={loadingMeta}
                  showSearch
                  optionFilterProp="label"
                  value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
                  onChange={(val) => field.onChange(parseInt(String(val), 10))}
                  options={mobOptions}
                />
              )}
            />
            <div className="text-[11px] text-gray-500">Gợi ý: gõ tên mob để tìm nhanh</div>
          </div>

          <div className="space-y-1">
            <label>Giới hạn map (VD: 1,5,10,15-20,25 hoặc !50-60)</label>
            <Controller
              name="map_restriction"
              control={control}
              render={({ field }) => (
                <Input placeholder="Để trống nếu không giới hạn" value={field.value ?? ""} onChange={e => field.onChange(e.target.value)} />
              )}
            />
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div><b>Để trống</b>: không giới hạn map</div>
              <div><b>Một map</b>: ví dụ <code>15</code></div>
              <div><b>Nhiều map</b>: ví dụ <code>1,5,10</code></div>
              <div><b>Khoảng map</b>: ví dụ <code>15-20</code></div>
              <div><b>Kết hợp</b>: ví dụ <code>1,5,10,15-20,25</code></div>
              <div><b>Loại trừ</b>: đặt dấu <code>!</code> phía trước khoảng/danh sách để loại trừ, ví dụ <code>!50-60</code></div>
            </div>
          </div>

          <div className="space-y-1">
            <label>Giới hạn hành tinh</label>
            <Controller
              name="planet_restriction"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  value={String(field.value)}
                  onChange={(v) => field.onChange(parseInt(String(v), 10))}
                  options={[
                    { label: 'Không giới hạn', value: '-1' },
                    { label: 'Trái Đất (0)', value: '0' },
                    { label: 'Namek (1)', value: '1' },
                    { label: 'Xayda (2)', value: '2' },
                  ]}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <label>Trạng thái</label>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={!!field.value} onChange={(c) => field.onChange(c)} />
              )}
            />
          </div>
        </div>

        <Card title="Danh sách Item drop" className="border-dashed">
          <div className="space-y-4">
            {itemFields.map((itemField, idx) => {
              const itemName = `items.${idx}` as const;
              return (
                <Card key={itemField.id} type="inner" title={`Item #${idx + 1}`} extra={
                  <Space>
                    <Popconfirm title="Xóa item này?" onConfirm={() => removeItem(idx)}>
                      <Button danger>Xóa</Button>
                    </Popconfirm>
                  </Space>
                }>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label>Item</label>
                      <Controller
                        name={`${itemName}.item_id` as any}
                        control={control}
                        render={({ field }) => (
                          <Select
                            className="w-full"
                            placeholder={loadingMeta ? 'Đang tải...' : 'Chọn item'}
                            loading={loadingMeta}
                            showSearch
                            optionFilterProp="label"
                            value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
                            onChange={(val) => field.onChange(parseInt(String(val), 10))}
                            options={itemOptions}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Tối thiểu</label>
                      <Controller
                        name={`${itemName}.quantity_min` as any}
                        control={control}
                        render={({ field }) => (
                          <InputNumber className="w-full" min={1} value={field.value} onChange={(v) => field.onChange(v)} />
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Tối đa</label>
                      <Controller
                        name={`${itemName}.quantity_max` as any}
                        control={control}
                        render={({ field }) => (
                          <InputNumber className="w-full" min={1} value={field.value} onChange={(v) => field.onChange(v)} />
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <label>Drop (%)</label>
                      <Controller
                        name={`${itemName}.drop_rate` as any}
                        control={control}
                        render={({ field }) => (
                          <InputNumber className="w-full" min={0} max={100} step={0.1} value={field.value} onChange={(v) => field.onChange(v)} />
                        )}
                      />
                    </div>
                  </div>
                  <OptionsEditor control={control} itemName={itemName} />
                </Card>
              );
            })}

            <Button onClick={() => appendItem({ item_id: 0, quantity_min: 1, quantity_max: 1, drop_rate: 0, options: [] })}>+ Thêm item</Button>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button htmlType="submit" type="primary" loading={submitting}>Lưu</Button>
        </div>
      </form>
    </Card>
  );
}
