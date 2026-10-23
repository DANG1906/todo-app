# AGENTS.md

Hướng dẫn cho AI coding agent làm việc trong repo này. Đọc kỹ trước khi sửa code.

## 1. Tổng quan

Website **Todo List full-stack** đơn giản: thêm, xem, sửa, xóa và đánh dấu hoàn thành công việc.
Đây là project học tập; chủ repo là sinh viên CNTT, ưu tiên **code dễ hiểu, đúng chuẩn** hơn là tối ưu sớm.

## 2. Tech stack

| Tầng      | Công nghệ                                                                      |
| --------- | ------------------------------------------------------------------------------ |
| Frontend  | HTML, CSS, JavaScript thuần (dùng `fetch()` gọi API), **không dùng framework** |
| Backend   | Node.js, Express, `dotenv`                                                     |
| Database  | MySQL (chạy qua XAMPP, quản lý bằng phpMyAdmin)                                |
| Driver DB | `mysql2/promise` (connection pool)                                             |
| Dev tool  | VS Code, `node --watch` (có sẵn trong Node.js)                                 |

Module system: **CommonJS** (`require` / `module.exports`), không dùng ES Modules.

> **Vì sao không dùng `nodemon`?** `nodemon` kéo theo `chokidar` → `braces` đang dính CVE-2026-93687 (high) và **chưa có bản vá**. `node --watch` có sẵn từ Node 18.11 nên thay thế được, không thêm dependency và `npm audit` sạch.

## 3. Cấu trúc thư mục

```
todo-app/
├── config/
│   └── db.js                  # Tạo connection pool MySQL, đọc cấu hình từ .env
├── controllers/
│   └── taskController.js      # Logic xử lý từng API (validate, truy vấn DB)
├── routes/
│   └── tasks.js               # Khai báo route, nối route với controller
├── database/
│   └── schema.sql             # Tạo database và bảng tasks
├── public/                    # Frontend, được Express phục vụ tĩnh
│   ├── index.html
│   ├── style.css
│   └── script.js
├── .env                       # Cấu hình cục bộ (KHÔNG commit)
├── .env.example               # Bản mẫu cấu hình (được commit)
├── .gitignore
├── package.json
├── server.js                  # Khởi tạo Express, middleware, gắn route, xử lý lỗi
├── app.js
├── tests
```

Đã tách `routes/tasks.js` + `controllers/taskController.js`. Giữ cấu trúc này, không gộp lại vào `server.js`.

## 4. Lệnh thường dùng

Luôn chạy từ thư mục gốc `todo-app/` (để `dotenv` tìm thấy `.env`).

```bash
npm install        # cài dependencies
npm run dev        # chạy server với node --watch (tự restart khi sửa file được import)
npm start          # chạy server bằng node (không tự restart)
```

Yêu cầu: **Node.js >= 18.11** (để dùng `node --watch`) và bật **MySQL** trong XAMPP Control Panel.
Server chạy tại `http://localhost:3000` (cổng lấy từ `PORT` trong `.env`).
Nếu MySQL chưa bật, server báo lỗi rõ ràng và dừng ngay khi khởi động.

## 5. Cấu hình môi trường (`.env`)

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=todo_db
```

- Tạo file `.env` từ bản mẫu: `copy .env.example .env` (Windows) hoặc `cp .env.example .env`.
- **Không bao giờ** commit `.env` hoặc hard-code thông tin kết nối trong code.
- Nếu thêm biến mới, cập nhật cả `.env.example` và mục này.
- `config/db.js` kiểm tra các biến bắt buộc (`DB_HOST`, `DB_USER`, `DB_NAME`) và báo lỗi ngay khi thiếu.

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
| PATCH  | `/api/tasks/:id` | Đổi `status` và/hoặc `title`         | 200               |

Mã lỗi dùng thống nhất:

- `400` dữ liệu hoặc id sai định dạng (kể cả JSON sai cú pháp)
- `404` đúng định dạng nhưng không tìm thấy tài nguyên
- `413` body vượt quá 10kb
- `500` lỗi server (trả thông báo chung, **không lộ** `err.message` của DB cho client)

Response lỗi có dạng `{ "message": "..." }`.

## 8. Quy ước code (bắt buộc)

**Backend**

- Mọi truy vấn có dữ liệu từ người dùng **phải dùng prepared statement** (`pool.execute(sql, [params])`). **Cấm** nối chuỗi vào câu SQL.
- Dùng `async/await` với `try/catch`; gọi `next(err)` để middleware xử lý lỗi tập trung ở `server.js` ghi log và trả `500`.
- Validate đầu vào ở server: `title` phải là **chuỗi**, bỏ khoảng trắng đầu/cuối (`trim()`), không rỗng, tối đa 255 ký tự; `id` phải khớp `/^\d+$/` và là số nguyên dương; `status` chỉ nhận `0`, `1`, `true`, `false`.
- Khi trả lỗi trong route handler phải có `return` để dừng hàm.
- Middleware `express.json()` phải đặt **trước** các route và nên đặt `limit` (hiện tại `10kb`).
- Dùng chung một pool từ `config/db.js`, không tạo kết nối mới ở nơi khác.
- Không bật CORS tràn lan (`cors()` không giới hạn origin): frontend do chính Express phục vụ nên cùng origin, không cần CORS.
- Chỉ `SELECT` các cột cần thiết, không dùng `SELECT *`, để tránh vô tình trả về cột nhạy cảm sau này.

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
- [x] Refactor thành `routes/` + `controllers/`
- [x] Đẩy lên GitHub, viết README
- [x] Vá cảnh báo `npm audit` (bỏ `nodemon`/`braces`, dùng `node --watch`)
- [x] Viết test: Jest + Supertest (API), Selenium (UI)

## 11. Kiểm thử

Hiện test thủ công bằng Thunder Client (VS Code). Khi thêm test tự động, ưu tiên các ca biên:

- `title` rỗng, toàn khoảng trắng, thiếu `title`, dài hơn 255 ký tự, `title` là số/object/array
- `title` có tiếng Việt có dấu, emoji, ký tự đặc biệt / chuỗi giống HTML (`<script>`)
- `id` không tồn tại, `id` là chữ, `id` âm, số thập phân (`1.5`) hoặc hex (`0x10`)
- `status` sai kiểu, body rỗng, JSON sai cú pháp, body quá lớn
- Thao tác lặp lại (xóa cùng một id hai lần, PATCH lại đúng giá trị cũ)

## 12. Không được làm

- Commit `.env` hoặc `node_modules`.
- Dùng `innerHTML` với dữ liệu người dùng.
- Nối chuỗi vào câu SQL.
- Trả `err.message` của DB cho client.
- Đổi sang ES Modules, TypeScript hay thêm framework frontend khi chưa được yêu cầu.
- Thêm lại `nodemon`/`braces` khi `npm audit` còn báo lỗi (hiện CVE-2026-93687 chưa có bản vá).
