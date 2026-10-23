// Đường dẫn '../config/db': đi lên một cấp (ra khỏi controllers/) rồi vào config/
const pool = require("../config/db");

const MAX_TITLE_LENGTH = 255;

// Các cột được phép trả về client (không dùng SELECT * để tránh lộ cột thêm sau này)
const TASK_COLUMNS = "id, title, status, created_at";

// ---- Hàm dùng chung để kiểm tra dữ liệu đầu vào ----

// Đọc id từ URL: chỉ chấp nhận chuỗi toàn chữ số.
// Nhờ vậy "1.5", "0x10", " 1 " hay "abc" đều bị coi là sai định dạng.
function parseId(rawId) {
  if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Chuẩn hóa title: phải là chuỗi, trim, không rỗng, tối đa 255 ký tự.
// Trả về { value } nếu hợp lệ, { error } nếu không hợp lệ.
function validateTitle(rawTitle) {
  if (typeof rawTitle !== "string") {
    return { error: "Tiêu đề phải là chuỗi" };
  }

  const title = rawTitle.trim();
  if (!title) {
    return { error: "Tiêu đề không được để trống" };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Tiêu đề tối đa ${MAX_TITLE_LENGTH} ký tự` };
  }

  return { value: title };
}

// status chỉ nhận 0, 1 hoặc true/false; trả về null nếu sai.
function parseStatus(rawStatus) {
  if (rawStatus === 0 || rawStatus === 1) return rawStatus;
  if (typeof rawStatus === "boolean") return rawStatus ? 1 : 0;
  return null;
}

// ---- Lấy toàn bộ công việc ----
async function getTasks(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT ${TASK_COLUMNS} FROM tasks ORDER BY created_at DESC, id DESC`,
    );
    res.json(rows);
  } catch (err) {
    next(err); // chuyển lỗi cho middleware xử lý lỗi ở server.js
  }
}

// ---- Thêm công việc ----
async function createTask(req, res, next) {
  try {
    const { value: title, error } = validateTitle(req.body?.title);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const [result] = await pool.execute(
      "INSERT INTO tasks (title) VALUES (?)",
      [title],
    );
    const [rows] = await pool.execute(
      `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// ---- Xóa công việc ----
async function deleteTask(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const [result] = await pool.execute("DELETE FROM tasks WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    res.json({ message: "Đã xóa", id });
  } catch (err) {
    next(err);
  }
}

// ---- Cập nhật một phần công việc ----
async function updateTask(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const { title, status } = req.body ?? {};
    const fields = [];
    const values = [];

    if (title !== undefined) {
      const { value, error } = validateTitle(title);
      if (error) {
        return res.status(400).json({ message: error });
      }
      fields.push("title = ?");
      values.push(value);
    }

    if (status !== undefined) {
      const newStatus = parseStatus(status);
      if (newStatus === null) {
        return res.status(400).json({ message: "status chỉ nhận 0 hoặc 1" });
      }
      fields.push("status = ?");
      values.push(newStatus);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu để cập nhật" });
    }

    values.push(id);
    // fields.join(", ") chỉ ghép các tên cột cố định ở trên, KHÔNG ghép dữ liệu người dùng.
    await pool.execute(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    // Đọc lại sau khi cập nhật: vừa trả dữ liệu mới, vừa phát hiện id không tồn tại.
    // (Không dựa vào affectedRows vì MySQL trả 0 khi giá trị mới trùng giá trị cũ.)
    const [rows] = await pool.execute(
      `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// Xuất 4 hàm dưới dạng một object; file khác lấy bằng destructuring
module.exports = { getTasks, createTask, deleteTask, updateTask };
