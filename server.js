require("dotenv").config();

const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/tasks"); // nạp router vừa tạo

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ---- Gắn router: mọi route trong tasks.js sẽ có thêm tiền tố /api/tasks ----
app.use("/api/tasks", taskRoutes);

// ---- Khởi động server ----
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
