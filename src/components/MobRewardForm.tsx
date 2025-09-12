"use client";

import { useEffect, useState } from 'react';
import { Button, Card, Input, InputNumber, Select, Switch } from 'antd';
import { useForm, Controller } from 'react-hook-form';

export type MobRewardFormData = {
  mob_id: number;
  item_id: number;
  quantity_min: number;
  quantity_max: number;
  drop_rate: number;
  map_restriction?: string | null;
  gender_restriction: number; // -1,0,1,2
  option_id: number;
  option_level: number;
  is_active: boolean;
};

interface MobRewardFormProps {
  value?: Partial<MobRewardFormData>;
  onSubmit: (data: MobRewardFormData) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
}

export default function MobRewardForm({ value, onSubmit, submitting, submitLabel = "Lưu" }: MobRewardFormProps) {
  const { register, handleSubmit, setValue, watch, control } = useForm<MobRewardFormData>({
    defaultValues: {
      mob_id: 0,
      item_id: 0,
      quantity_min: 1,
      quantity_max: 1,
      drop_rate: 0,
      map_restriction: null,
      gender_restriction: -1,
      option_id: 0,
      option_level: 0,
      is_active: true,
      ...value,
    },
  });

  const [items, setItems] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);
  const [mobs, setMobs] = useState<{ id: number; NAME: string }[]>([]);
  const [loadingMobs, setLoadingMobs] = useState<boolean>(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch('/api/items?limit=all');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setItems(data);
          } else if (Array.isArray(data?.items)) {
            setItems(data.items);
          }
        }
      } catch (e) {
        console.error('Failed to load items:', e);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const fetchMobs = async () => {
      try {
        const res = await fetch('/api/mobs?limit=all');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMobs(data);
          }
        }
      } catch (e) {
        console.error('Failed to load mobs:', e);
      } finally {
        setLoadingMobs(false);
      }
    };
    fetchMobs();
  }, []);

  useEffect(() => {
    if (value) {
      for (const [k, v] of Object.entries(value)) {
        // @ts-ignore
        setValue(k as any, v as any);
      }
    }
  }, [value, setValue]);

  const min = watch('quantity_min');
  const max = watch('quantity_max');

  return (
    <Card>
      <form
        onSubmit={handleSubmit(async (data) => {
          if (data.quantity_min > data.quantity_max) {
            alert('Số lượng tối thiểu phải <= số lượng tối đa');
            return;
          }
          await onSubmit({
            ...data,
            map_restriction: data.map_restriction === '' ? null : data.map_restriction ?? null,
          });
        })}
        className="space-y-4"
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
                  placeholder={loadingMobs ? 'Đang tải...' : 'Chọn mob'}
                  loading={loadingMobs}
                  showSearch
                  optionFilterProp="label"
                  value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
                  onChange={(val) => field.onChange(parseInt(String(val), 10))}
                  options={mobs.map((m) => ({ label: `${m.NAME} (#${m.id})`, value: String(m.id) }))}
                />
              )}
            />
            <div className="text-[11px] text-gray-500">Gợi ý: gõ tên mob để tìm nhanh</div>
          </div>
          <div className="space-y-1">
            <label>Item ID</label>
            <Controller
              name="item_id"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  placeholder={loadingItems ? 'Đang tải...' : 'Chọn item'}
                  loading={loadingItems}
                  showSearch
                  optionFilterProp="label"
                  value={field.value !== undefined && field.value !== null ? String(field.value) : undefined}
                  onChange={(val) => field.onChange(parseInt(String(val), 10))}
                  options={items.map((it) => ({ label: `${it.NAME} (#${it.id})`, value: String(it.id) }))}
                />
              )}
            />
            <div className="text-[11px] text-gray-500">Gợi ý: gõ tên item để tìm nhanh</div>
          </div>
          <div className="space-y-1">
            <label>Số lượng tối thiểu</label>
            <Controller
              name="quantity_min"
              control={control}
              render={({ field }) => (
                <InputNumber className="w-full" min={1} value={field.value} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label>Số lượng tối đa</label>
            <Controller
              name="quantity_max"
              control={control}
              render={({ field }) => (
                <InputNumber className="w-full" min={min || 1} value={field.value} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label>Tỷ lệ drop (%)</label>
            <Controller
              name="drop_rate"
              control={control}
              render={({ field }) => (
                <InputNumber className="w-full" min={0} max={100} step={0.1} value={field.value} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label>Giới hạn map (VD: 1,5,10,15-20,25 hoặc !50-60)</label>
            <Input placeholder="Để trống nếu không giới hạn" {...register('map_restriction')} />
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div><b>Để trống</b>: không giới hạn map</div>
              <div><b>Một map</b>: ví dụ <code>15</code></div>
              <div><b>Nhiều map</b>: ví dụ <code>1,5,10</code></div>
              <div><b>Khoảng map</b>: ví dụ <code>15-20</code></div>
              <div><b>Kết hợp</b>: ví dụ <code>1,5,10,15-20,25</code></div>
              <div><b>Loại trừ</b>: đặt dấu <code>!</code> phía trước khoảng/danh sách để loại trừ, ví dụ <code>!50-60</code></div>
              <div><b>Nhiều khoảng đặc biệt</b>: ví dụ <code>100-110,200-210</code> (map boss, map event)</div>
            </div>
          </div>
          <div className="space-y-1">
            <label>Giới hạn hành tinh</label>
            <Select
              className="w-full"
              value={String(watch('gender_restriction'))}
              onChange={(v) => setValue('gender_restriction', parseInt(String(v), 10))}
              options={[
                { label: 'Không giới hạn', value: '-1' },
                { label: 'Trái Đất (0)', value: '0' },
                { label: 'Namek (1)', value: '1' },
                { label: 'Xayda (2)', value: '2' },
              ]}
            />
          </div>
          <div className="space-y-1">
            <label>Option ID</label>
            <Controller
              name="option_id"
              control={control}
              render={({ field }) => (
                <InputNumber className="w-full" min={0} value={field.value} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label>Param</label>
            <Controller
              name="option_level"
              control={control}
              render={({ field }) => (
                <InputNumber className="w-full" min={0} value={field.value} onChange={(v) => field.onChange(v)} />
              )}
            />
          </div>
          <div className="space-y-1">
            <label>Trạng thái</label>
            <div>
              <Switch checked={watch('is_active')} onChange={(c) => setValue('is_active', c)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button htmlType="submit" type="primary" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
