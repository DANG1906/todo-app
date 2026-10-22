const express = require("express");
// Lấy 4 hàm từ controller bằng destructuring (tên phải khớp với module.exports bên trên)
const {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
} = require("../controllers/taskController");

// Router: một "mini app" chỉ chứa các route, sẽ được gắn vào app chính ở server.js
const router = express.Router();

// Đường dẫn ở đây là PHẦN ĐUÔI; tiền tố /api/tasks sẽ được gắn ở server.js
router.get("/", getTasks); // GET    /api/tasks
router.post("/", createTask); // POST   /api/tasks
router.delete("/:id", deleteTask); // DELETE /api/tasks/:id
router.patch("/:id", updateTask); // PATCH  /api/tasks/:id

module.exports = router;
