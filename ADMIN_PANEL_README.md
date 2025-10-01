# Admin Command Panel

Giao diện web để gửi commands đến admin server của game NRO.

## Tính năng

### 1. Server Status
- **Server Status**: Hiển thị tổng quan về server (Players, Threads, Clans)
- **Player Count**: Số lượng người chơi online
- **Thread Count**: Số lượng threads đang hoạt động
- **GameLoop Stats**: Thống kê về game loop

### 2. Data Management
- **Save Clan Data**: Lưu dữ liệu clan
- **Cache Management**: 
  - Refresh Mob Cache
  - Refresh Boss Cache
  - Refresh Gift Cache

### 3. Announcements
- **Global Announcement**: Gửi thông báo cho tất cả người chơi
- **VIP Announcement**: Gửi thông báo riêng cho VIP

### 4. Server Management
- **Server Maintenance**: Bảo trì server với thời gian tùy chỉnh
- **Server Restart**: Khởi động lại server với countdown

### 5. Server Configuration
- Thay đổi URL của admin server (mặc định: localhost:8080/admin)
- Hỗ trợ VPS với IP và port tùy chỉnh

### 6. Custom Commands
- Gửi command tùy chỉnh cho người dùng nâng cao

## Cách sử dụng

### Truy cập Admin Panel
1. Mở trình duyệt và truy cập: `http://localhost:3000/admin`
2. Hoặc từ trang chủ, click vào "Admin Command Panel"

### Cấu hình Server
1. Vào tab "Server Config"
2. Nhập URL admin server của bạn (VD: `http://your-vps-ip:8080/admin`)
3. Click "Lưu cấu hình"

### Gửi Commands
1. Chọn tab tương ứng với loại command
2. Điền thông tin cần thiết (nếu có)
3. Click button để thực hiện
4. Xem kết quả trong phần "Command Results"

## Mapping Commands

| Web Interface | API Command | Mô tả |
|---------------|-------------|-------|
| Server Status | `status` | Hiển thị tổng quan server |
| Player Count | `players` | Số người chơi online |
| Thread Count | `threads` | Số threads hoạt động |
| GameLoop Stats | `gameloop-stats` | Thống kê game loop |
| Save Clan Data | `saveclan` | Lưu dữ liệu clan |
| Refresh Mob Cache | `refresh-mob-cache` | Làm mới cache mob |
| Refresh Boss Cache | `refresh-boss-cache` | Làm mới cache boss |
| Refresh Gift Cache | `refresh-gift-cache` | Làm mới cache gift |
| Global Announcement | `announcement` | Thông báo toàn server |
| VIP Announcement | `vip-announcement` | Thông báo VIP |
| Server Maintenance | `maintenance` | Bảo trì server |
| Server Restart | `restart` | Khởi động lại server |

## Lưu ý bảo mật

- Admin panel chỉ nên được truy cập bởi admin
- Cần thêm authentication cho production
- Server admin chỉ nên chạy trên localhost hoặc internal network
- Cẩn thận với các lệnh Maintenance và Restart

## Troubleshooting

### Lỗi kết nối
- Kiểm tra admin server có đang chạy không
- Kiểm tra URL và port có đúng không
- Kiểm tra firewall/network có block không

### Lỗi CORS
- Admin server cần enable CORS cho web interface
- Kiểm tra cấu hình CORS trong admin server

### Commands không hoạt động
- Kiểm tra admin server logs
- Đảm bảo command name đúng format
- Kiểm tra data format nếu command cần data

## API Format

Tất cả commands đều gửi qua POST request với format:

```json
{
  "command": "tên_lệnh",
  "data": "dữ_liệu_tùy_chọn"
}
```

Response format:
- **Success**: Plain text với kết quả
- **Error**: Plain text với thông báo lỗi
- **HTTP Status**: 200 (success), 405 (method not allowed), 500 (server error)
