# Todo List

Ứng dụng quản lý công việc full-stack: thêm, xem, xóa và đánh dấu hoàn thành công việc.

## Công nghệ

- **Frontend:** HTML, CSS, JavaScript thuần (`fetch`)
- **Backend:** Node.js, Express
- **Database:** MySQL (XAMPP)

## Chức năng

- Thêm công việc (kiểm tra dữ liệu ở cả frontend và backend)
- Xem danh sách, công việc mới nhất hiển thị trước
- Đánh dấu hoàn thành / bỏ đánh dấu
- Xóa công việc
- Chống SQL injection (prepared statement) và XSS (`textContent`)

## Cài đặt và chạy

1. **Yêu cầu:** Node.js >= 18.11 (để dùng `node --watch`), XAMPP (hoặc MySQL).
2. Clone repo:

```bash
   git clone https://github.com/DANG1906/todo-app.git
   cd todo-app
   npm install
```

3. Bật **MySQL** trong XAMPP, mở phpMyAdmin, tab **SQL**, dán nội dung file `database/schema.sql` rồi chạy.
4. Tạo file `.env` từ bản mẫu (Windows: `copy .env.example .env`) và chỉnh nếu MySQL của bạn có mật khẩu.
5. Chạy server:

```bash
   npm run dev
```

   `npm run dev` dùng `node --watch` có sẵn trong Node.js nên không cần cài `nodemon`.
   Nếu MySQL chưa bật, server báo lỗi rõ ràng và dừng ngay.

6. Mở http://localhost:3000

## API

| Method | Endpoint         | Mô tả                                     | Mã thành công |
| ------ | ---------------- | ----------------------------------------- | ------------- |
| GET    | `/api/tasks`     | Lấy danh sách công việc                   | 200           |
| POST   | `/api/tasks`     | Thêm công việc, body `{ "title": "..." }` | 201           |
| PATCH  | `/api/tasks/:id` | Sửa `title` và/hoặc `status` (0 hoặc 1)   | 200           |
| DELETE | `/api/tasks/:id` | Xóa công việc                             | 200           |

Mã lỗi: `400` dữ liệu sai, `404` không tìm thấy, `413` body quá lớn, `500` lỗi server.
Có thể thử nhanh các API bằng file `requests.http` (extension REST Client của VS Code).

## Bảo mật

- Dùng prepared statement cho mọi truy vấn có dữ liệu người dùng (chống SQL injection).
- Render bằng `textContent`, không dùng `innerHTML` (chống XSS).
- Validate ở server: `title` phải là chuỗi, tối đa 255 ký tự; `id` chỉ gồm chữ số; `status` chỉ nhận 0/1.
- Giới hạn body JSON 10kb; JSON sai cú pháp trả `400`, body quá lớn trả `413`.
- Middleware lỗi tập trung chỉ ghi log ở server, client nhận `{ "message": "..." }`.
- Frontend cùng origin nên không bật CORS mở; ẩn header `X-Powered-By`.
- `npm audit` hiện báo **0 lỗ hổng**. Không dùng `nodemon` vì phụ thuộc `braces` đang có CVE-2026-93687 chưa có bản vá; `npm run dev` dùng `node --watch` thay thế.

## Cấu trúc thư mục

```
todo-app/
├── config/db.js                  # kết nối MySQL (connection pool)
├── controllers/taskController.js # logic xử lý
├── routes/tasks.js               # khai báo route
├── public/                       # giao diện
├── database/schema.sql           # tạo database và bảng
└── server.js                     # khởi động server
```
