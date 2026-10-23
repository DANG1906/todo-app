// Nạp file .env vào process.env (phải gọi trước khi đọc process.env.*)
// Jest tự đặt NODE_ENV='test' khi chạy test → dùng .env.test; bình thường dùng .env
require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

// Dùng bản "promise" của mysql2 để viết được async/await thay vì callback
const mysql = require("mysql2/promise");

// Kiểm tra sớm các biến bắt buộc: thiếu cấu hình thì báo rõ ràng ngay khi khởi động,
// thay vì để MySQL trả lỗi khó hiểu ở request đầu tiên.
const REQUIRED_ENV = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(
    `Thiếu biến môi trường: ${missingEnv.join(", ")}. Hãy tạo file .env từ .env.example`,
  );
}

// Tạo pool: một "bể" kết nối được tái sử dụng, thay vì mở/đóng kết nối mỗi request
const pool = mysql.createPool({
  host: process.env.DB_HOST.trim(), // localhost
  port: Number(process.env.DB_PORT) || 3306, // cổng MySQL, mặc định 3306
  user: process.env.DB_USER.trim(), // root
  password: process.env.DB_PASS ?? "", // rỗng với XAMPP mặc định
  database: process.env.DB_NAME.trim(), // todo_db
  waitForConnections: true, // hết kết nối rảnh thì request xếp hàng chờ, không báo lỗi ngay
  connectionLimit: 10, // tối đa 10 kết nối cùng lúc
  queueLimit: 0, // 0 = hàng chờ không giới hạn
  charset: "utf8mb4", // khớp với charset của database, để tiếng Việt không lỗi
});

// Xuất pool ra để file khác (taskController.js, server.js) dùng
module.exports = pool;
