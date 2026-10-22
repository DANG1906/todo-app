// Nạp file .env vào process.env (phải gọi trước khi đọc process.env.*)
require("dotenv").config();

// Dùng bản "promise" của mysql2 để viết được async/await thay vì callback
const mysql = require("mysql2/promise");

// Tạo pool: một "bể" kết nối được tái sử dụng, thay vì mở/đóng kết nối mỗi request
const pool = mysql.createPool({
  host: process.env.DB_HOST, // localhost
  user: process.env.DB_USER, // root
  password: process.env.DB_PASS, // rỗng với XAMPP mặc định
  database: process.env.DB_NAME, // todo_db
  waitForConnections: true, // hết kết nối rảnh thì request xếp hàng chờ, không báo lỗi ngay
  connectionLimit: 10, // tối đa 10 kết nối cùng lúc
  queueLimit: 0, // 0 = hàng chờ không giới hạn
  charset: "utf8mb4", // khớp với charset của database, để tiếng Việt không lỗi
});

// Xuất pool ra để file khác (server.js) dùng bằng require('./config/db')
module.exports = pool;
