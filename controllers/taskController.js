// Đường dẫn '../config/db': đi lên một cấp (ra khỏi controllers/) rồi vào config/
const pool = require("../config/db");

// ---- Lấy toàn bộ công việc ----
// Trước đây là callback của app.get(...); giờ tách thành hàm riêng có tên
async function getTasks(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC, id DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}

// ---- Thêm công việc ----
async function createTask(req, res) {
  try {
    const title = (req.body?.title ?? "").toString().trim();

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề không được để trống" });
    }
    if (title.length > 255) {
      return res.status(400).json({ message: "Tiêu đề tối đa 255 ký tự" });
    }

    const [result] = await pool.execute(
      "INSERT INTO tasks (title) VALUES (?)",
      [title],
    );
    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}

// ---- Xóa công việc ----
async function deleteTask(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    res.json({ message: "Đã xóa", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}

// ---- Cập nhật một phần công việc ----
async function updateTask(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const { title, status } = req.body ?? {};
    const fields = [];
    const values = [];

    if (title !== undefined) {
      const newTitle = String(title).trim();
      if (!newTitle) {
        return res.status(400).json({ message: "Tiêu đề không được để trống" });
      }
      if (newTitle.length > 255) {
        return res.status(400).json({ message: "Tiêu đề tối đa 255 ký tự" });
      }
      fields.push("title = ?");
      values.push(newTitle);
    }

    if (status !== undefined) {
      if (status !== 0 && status !== 1 && typeof status !== "boolean") {
        return res.status(400).json({ message: "status chỉ nhận 0 hoặc 1" });
      }
      fields.push("status = ?");
      values.push(status ? 1 : 0);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
}

// Xuất 4 hàm dưới dạng một object; file khác lấy bằng destructuring
module.exports = { getTasks, createTask, deleteTask, updateTask };
