# AGENTS.md

Hướng dẫn cho AI coding agent làm việc trong repo này. Đọc kỹ trước khi sửa code.

## 1. Tổng quan

Website **Todo List full-stack** đơn giản: thêm, xem, xóa (và sau này đánh dấu hoàn thành) công việc.
Đây là project học tập; chủ repo là sinh viên CNTT, ưu tiên **code dễ hiểu, đúng chuẩn** hơn là tối ưu sớm.

## 2. Tech stack

| Tầng      | Công nghệ                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| Frontend  | HTML, CSS, JavaScript thuần (dùng `fetch()` gọi API), **không dùng framework** |
| Backend   | Node.js, Express, `cors`, `dotenv`                                             |
| Database  | MySQL (chạy qua XAMPP, quản lý bằng phpMyAdmin)                                |
| Driver DB | `mysql2/promise` (connection pool)                                             |
| Dev tool  | VS Code, `nodemon`                                                             |

Module system: **CommonJS** (`require` / `module.exports`), không dùng ES Modules.

## 3. Cấu trúc thư mục

```
todo-app/
├── config/
│   └── db.js            # Tạo connection pool MySQL, đọc cấu hình từ .env
├── public/              # Frontend, được Express phục vụ tĩnh
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .env                 # Cấu hình cục bộ (KHÔNG commit)
├── .gitignore
├── package.json
└── server.js            # Khởi tạo Express, middleware, các route API
```

Dự kiến tách sau này: `routes/tasks.js` và `controllers/taskController.js`. **Chưa tách** cho tới khi chủ repo yêu cầu.

## 4. Lệnh thường dùng

Luôn chạy từ thư mục gốc `todo-app/` (để `dotenv` tìm thấy `.env`).

```bash
npm install        # cài dependencies
npm run dev        # chạy server với nodemon (tự restart khi sửa code)
npm start          # chạy server bằng node
```

Yêu cầu trước khi chạy: bật **MySQL** trong XAMPP Control Panel.
Server chạy tại `http://localhost:3000` (cổng lấy từ `PORT` trong `.env`).

## 5. Cấu hình môi trường (`.env`)

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=todo_db
```

- **Không bao giờ** commit `.env` hoặc hard-code thông tin kết nối trong code.
- Nếu thêm biến mới, cập nhật cả mục này.

## 6. Database

Database: `todo_db` (charset `utf8mb4`, collation `utf8mb4_unicode_ci`).

```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  status TINYINT(1) NOT NULL DEFAULT 0,          -- 0 = chưa xong, 1 = đã xong
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Mọi thay đổi schema phải đi kèm câu SQL `ALTER TABLE` rõ ràng và được ghi lại trong file này.

## 7. API

| Method | Endpoint         | Mô tả                                | Status thành công |
| ------ | ---------------- | ------------------------------------ | ----------------- |
| GET    | `/api/tasks`     | Lấy toàn bộ task, mới nhất trước     | 200               |
| POST   | `/api/tasks`     | Thêm task, body `{ "title": "..." }` | 201               |
| DELETE | `/api/tasks/:id` | Xóa task theo id                     | 200               |
| PATCH  | `/api/tasks/:id` | _(dự kiến)_ đổi `status` / `title`   | 200               |

Mã lỗi dùng thống nhất:

- `400` dữ liệu hoặc id sai định dạng
- `404` đúng định dạng nhưng không tìm thấy tài nguyên
- `500` lỗi server (trả thông báo chung, **không lộ** `err.message` của DB cho client)

Response lỗi có dạng `{ "message": "..." }`.

## 8. Quy ước code (bắt buộc)

**Backend**

- Mọi truy vấn có dữ liệu từ người dùng **phải dùng prepared statement** (`pool.execute(sql, [params])`). **Cấm** nối chuỗi vào câu SQL.
- Dùng `async/await` với `try/catch`; ghi lỗi bằng `console.error` rồi trả `500`.
- Validate đầu vào ở server: `title` bỏ khoảng trắng đầu/cuối (`trim()`), không rỗng, tối đa 255 ký tự; `id` phải là số nguyên dương.
- Khi trả lỗi trong route handler phải có `return` để dừng hàm.
- Middleware `express.json()` phải đặt **trước** các route.
- Dùng chung một pool từ `config/db.js`, không tạo kết nối mới ở nơi khác.

**Frontend**

- Render nội dung người dùng bằng `textContent`, **không dùng `innerHTML`** (tránh XSS).
- Gọi API bằng `fetch()` với đường dẫn tương đối (`/api/tasks`), kiểm tra `response.ok` trước khi đọc JSON.

**Chung**

- Đặt tên biến/hàm bằng tiếng Anh; thông báo hiển thị cho người dùng bằng tiếng Việt.
- Thay đổi nhỏ, tập trung; không tự ý refactor hoặc thêm thư viện khi chưa được yêu cầu.

## 9. Cách giao tiếp với chủ repo

- Trả lời bằng **tiếng Việt**, dùng thuật ngữ chuyên ngành bình thường.
- Hướng dẫn **từng bước**, ngắn gọn, không lan man.
- Khi đưa code, **giải thích từng dòng/hàm** để làm gì ngay trong lúc đưa (comment trong code hoặc ghi chú đi kèm). Đây là project vừa làm vừa học.
- Nếu yêu cầu mơ hồ hoặc có lỗ hổng logic, **hỏi lại** để làm rõ thay vì tự suy đoán.

## 10. Trạng thái và lộ trình

- [x] Database `todo_db` + bảng `tasks`
- [x] Khởi tạo project (`npm init`, package, `.env`, `.gitignore`)
- [x] `config/db.js` (connection pool)
- [x] `GET /api/tasks`
- [x] `POST /api/tasks` (có validation)
- [x] `DELETE /api/tasks/:id` (đã viết, đang test)
- [x] Frontend: `index.html`, `style.css`, `script.js`
- [x] `PATCH /api/tasks/:id` (đánh dấu hoàn thành)
- [ ] Refactor thành `routes/` + `controllers/`
- [ ] Đẩy lên GitHub, viết README
- [ ] Viết test: Jest + Supertest (API), Selenium (UI)

## 11. Kiểm thử

Hiện test thủ công bằng Thunder Client (VS Code). Khi thêm test tự động, ưu tiên các ca biên:

- `title` rỗng, toàn khoảng trắng, thiếu `title`, dài hơn 255 ký tự
- `title` có tiếng Việt có dấu, emoji, ký tự đặc biệt / chuỗi giống HTML (`<script>`)
- `id` không tồn tại, `id` là chữ, `id` âm hoặc số thập phân
- Thao tác lặp lại (xóa cùng một id hai lần)

## 12. Không được làm

- Commit `.env` hoặc `node_modules`.
- Dùng `innerHTML` với dữ liệu người dùng.
- Nối chuỗi vào câu SQL.
- Trả `err.message` của DB cho client.
- Đổi sang ES Modules, TypeScript hay thêm framework frontend khi chưa được yêu cầu.
