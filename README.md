# Dashboard Web NRO

Admin dashboard built with Next.js for managing NRO resources.

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 with your browser to see the result.

---

# Gift Code System - Database Schema & API

## Overview

Hệ thống Gift Code được refactor hoàn toàn từ JSON-based sang SQL-based với các tính năng nâng cao:
- Quản lý items và options riêng biệt
- Giới hạn player theo nhiều cách (VIP, specific players, exclude players)
- Tracking usage chi tiết
- Validation đầy đủ (expired, usage limits, permissions)

---

## Database Schema

### 1. `gift_codes` - Bảng chính
```sql
CREATE TABLE gift_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,           -- Mã gift code
    name VARCHAR(200) NOT NULL,                 -- Tên hiển thị
    description TEXT,                           -- Mô tả
    max_uses INT DEFAULT 0,                     -- Giới hạn sử dụng (0 = unlimited)
    current_uses INT DEFAULT 0,                 -- Đã sử dụng bao nhiều lần
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expired_date TIMESTAMP NULL,                -- Ngày hết hạn (NULL = không hết hạn)
    is_active BOOLEAN DEFAULT TRUE,             -- Có hoạt động không
    player_limit_type ENUM('NONE', 'SPECIFIC_PLAYERS', 'EXCLUDE_PLAYERS', 'VIP_ONLY') DEFAULT 'NONE',
    vip_level_min INT DEFAULT 0,               -- VIP level tối thiểu
    INDEX idx_code (code),
    INDEX idx_active_expired (is_active, expired_date)
);
```

### 2. `gift_code_items` - Items của gift code
```sql
CREATE TABLE gift_code_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gift_code_id INT NOT NULL,                  -- FK to gift_codes
    item_id INT NOT NULL,                       -- ID của item
    quantity INT NOT NULL DEFAULT 1,            -- Số lượng
    FOREIGN KEY (gift_code_id) REFERENCES gift_codes(id) ON DELETE CASCADE,
    INDEX idx_gift_code (gift_code_id)
);
```

### 3. `gift_code_item_options` - Options của items
```sql
CREATE TABLE gift_code_item_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gift_code_item_id INT NOT NULL,            -- FK to gift_code_items
    option_id INT NOT NULL,                    -- ID option (0=HP, 6=Ki, 7=Dame, etc.)
    param INT NOT NULL,                        -- Giá trị option
    FOREIGN KEY (gift_code_item_id) REFERENCES gift_code_items(id) ON DELETE CASCADE,
    INDEX idx_gift_item (gift_code_item_id)
);
```

### 4. `gift_code_player_restrictions` - Giới hạn player
```sql
CREATE TABLE gift_code_player_restrictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gift_code_id INT NOT NULL,                 -- FK to gift_codes
    player_id INT NOT NULL,                    -- ID player
    restriction_type ENUM('ALLOWED', 'BLOCKED') NOT NULL,  -- Cho phép hay chặn
    FOREIGN KEY (gift_code_id) REFERENCES gift_codes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_gift_player (gift_code_id, player_id),
    INDEX idx_gift_code (gift_code_id),
    INDEX idx_player (player_id)
);
```

### 5. `gift_code_usage` - Tracking sử dụng
```sql
CREATE TABLE gift_code_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gift_code_id INT NOT NULL,                 -- FK to gift_codes
    player_id INT NOT NULL,                    -- Player đã sử dụng
    used_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player_name VARCHAR(50),                   -- Tên player (để dễ tracking)
    FOREIGN KEY (gift_code_id) REFERENCES gift_codes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usage (gift_code_id, player_id),  -- Mỗi player chỉ dùng 1 lần
    INDEX idx_gift_code (gift_code_id),
    INDEX idx_player (player_id),
    INDEX idx_used_date (used_date)
);
```

---

## Player Limit Types

### 1. `NONE` - Không giới hạn
- Tất cả players đều có thể sử dụng
- Chỉ cần check expired date và usage limit

### 2. `VIP_ONLY` - Chỉ VIP
- Chỉ players có `vip >= vip_level_min` mới dùng được
- Ví dụ: `vip_level_min = 1` → chỉ VIP 1+ mới dùng được

### 3. `SPECIFIC_PLAYERS` - Chỉ players cụ thể
- Chỉ players có trong bảng `gift_code_player_restrictions` với `restriction_type = 'ALLOWED'`
- Dùng cho gift codes đặc biệt (admin, event, etc.)

### 4. `EXCLUDE_PLAYERS` - Loại trừ players cụ thể
- Tất cả players đều dùng được, trừ những players trong `gift_code_player_restrictions` với `restriction_type = 'BLOCKED'`
- Dùng để ban một số players khỏi gift code

---

## Sample Data

### Gift Code cho mọi người
```sql
INSERT INTO gift_codes (code, name, description, max_uses, expired_date, player_limit_type) VALUES
('WELCOME2024', 'Quà Chào Mừng', 'Quà tặng cho người chơi mới', 1000, '2024-12-31 23:59:59', 'NONE');


INSERT INTO gift_code_items (gift_code_id, item_id, quantity) VALUES
(1, 457, 10),   -- 10x Đậu Thần
(1, 1805, 5);   -- 5x Item khác


INSERT INTO gift_code_item_options (gift_code_item_id, option_id, param) VALUES
(1, 0, 2000),   -- Đậu Thần: +2000 HP
(1, 47, 500);   -- Đậu Thần: +500 Crit
```

### Gift Code chỉ VIP
```sql
INSERT INTO gift_codes (code, name, description, max_uses, player_limit_type, vip_level_min) VALUES
('VIP_ONLY', 'Quà VIP', 'Chỉ dành cho VIP', 100, 'VIP_ONLY', 1);


INSERT INTO gift_code_items (gift_code_id, item_id, quantity) VALUES
(2, 1816, 1);   -- 1x Item VIP


INSERT INTO gift_code_item_options (gift_code_item_id, option_id, param) VALUES
(3, 0, 10000),  -- +10000 HP
(3, 6, 50000),  -- +50000 Ki
(3, 7, 25000);  -- +25000 Dame
```

### Gift Code cho admin
```sql
INSERT INTO gift_codes (code, name, description, max_uses, player_limit_type) VALUES
('ADMIN_GIFT', 'Quà Admin', 'Quà đặc biệt cho admin', 50, 'SPECIFIC_PLAYERS');


INSERT INTO gift_code_items (gift_code_id, item_id, quantity) VALUES
(3, 2000, 99);  -- 99x Item đặc biệt


-- Chỉ cho phép player ID 1 và 2
INSERT INTO gift_code_player_restrictions (gift_code_id, player_id, restriction_type) VALUES
(3, 1, 'ALLOWED'),
(3, 2, 'ALLOWED');
```

---

## API Usage

### Java Service
```java
// Sử dụng gift code
GiftCodeService.GiftCodeResult result = GiftCodeService.getInstance().useGiftCode(player, "WELCOME2024");


if (result.success) {
    // Thành công
    Service.gI().sendThongBao(player, result.message);
} else {
    // Thất bại
    Service.gI().sendThongBao(player, result.message);
}
```

### Validation Flow
1. Check gift code exists - Mã có tồn tại không?
2. Check active - Gift code có đang hoạt động không?
3. Check expired - Đã hết hạn chưa?
4. Check usage limit - Đã hết lượt sử dụng chưa?
5. Check player used - Player đã dùng mã này chưa?
6. Check player restrictions - Player có quyền dùng không?
7. Give items - Trao items cho player
8. Mark as used - Đánh dấu đã sử dụng

---

## Queries hữu ích

### Xem toàn bộ gift code setup
```sql
SELECT 
    gc.code, gc.name, gc.player_limit_type, gc.vip_level_min,
    gci.item_id, gci.quantity,
    gcio.option_id, gcio.param,
    gcpr.player_id as allowed_player
FROM gift_codes gc
LEFT JOIN gift_code_items gci ON gc.id = gci.gift_code_id
LEFT JOIN gift_code_item_options gcio ON gci.id = gcio.gift_code_item_id
LEFT JOIN gift_code_player_restrictions gcpr ON gc.id = gcpr.gift_code_id AND gcpr.restriction_type = 'ALLOWED'
ORDER BY gc.id, gci.id, gcio.id;
```

### Xem usage statistics
```sql
SELECT 
    gc.code, gc.name, gc.max_uses, gc.current_uses,
    COUNT(gcu.id) as actual_uses,
    gc.current_uses - COUNT(gcu.id) as discrepancy
FROM gift_codes gc
LEFT JOIN gift_code_usage gcu ON gc.id = gcu.gift_code_id
GROUP BY gc.id
ORDER BY gc.created_date DESC;
```

### Xem ai đã dùng gift code nào
```sql
SELECT 
    gc.code, gc.name,
    gcu.player_name, gcu.used_date
FROM gift_codes gc
JOIN gift_code_usage gcu ON gc.id = gcu.gift_code_id
ORDER BY gcu.used_date DESC
LIMIT 50;
```

---

## Migration từ hệ thống cũ

### Backup data cũ
```sql
-- Backup bảng cũ
CREATE TABLE giftcode_backup AS SELECT * FROM giftcode;
```

### Convert JSON data sang SQL
```java
// Code để convert từ MaQuaTangManager sang GiftCodeService
// Cần parse JSON trong listItem và itemoption
// Sau đó insert vào các bảng mới
```

---

## Performance Notes

- Indexes: Đã tạo indexes cho các trường thường query (code, active, expired_date, player_id)
- Foreign Keys: Cascade delete để tự động xóa data liên quan
- Unique Constraints: Đảm bảo mỗi player chỉ dùng 1 lần mỗi gift code
- Connection Management: Luôn close connection trong finally block

---

## Security Notes

- SQL Injection: Sử dụng PreparedStatement cho tất cả queries
- Input Validation: Validate gift code format trước khi query
- Permission Check: Kiểm tra đầy đủ permissions trước khi trao items
- Rate Limiting: Có thể thêm rate limiting để tránh spam

---

## Future Enhancements

1. Gift Code Categories: Thêm categories để phân loại
2. Usage Analytics: Dashboard để xem thống kê sử dụng
3. Batch Gift Codes: Tạo nhiều codes cùng lúc
4. Time-based Restrictions: Giới hạn theo giờ/ngày trong tuần
5. Level Restrictions: Giới hạn theo level player
6. Server Restrictions: Giới hạn theo server (nếu có multi-server)

---

## Contact

- Developer: [Your Name]
- Date Created: 2025-09-14
- Last Updated: 2025-09-14
- Version: 1.0.0
