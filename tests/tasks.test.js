const request = require("supertest"); // gửi request giả lập vào app
const app = require("../app");
const pool = require("../config/db");

// ---- Chạy một lần trước tất cả test: chốt an toàn ----
beforeAll(() => {
  // Nếu vì lý do gì đó đang trỏ nhầm vào DB thật thì dừng ngay, không để TRUNCATE xóa dữ liệu thật
  if (process.env.DB_NAME !== "todo_db_test") {
    throw new Error(
      "Test phải chạy trên todo_db_test, không phải " + process.env.DB_NAME,
    );
  }
});

// ---- Chạy trước MỖI test: đưa bảng về trạng thái rỗng ----
beforeEach(async () => {
  await pool.query("TRUNCATE TABLE tasks"); // xóa sạch dữ liệu và đặt lại AUTO_INCREMENT về 1
});

// ---- Chạy một lần sau tất cả test: đóng pool để Jest thoát được ----
afterAll(async () => {
  await pool.end();
});

// Hàm phụ: tạo nhanh một task qua API và trả về object task
async function createTask(title) {
  const res = await request(app).post("/api/tasks").send({ title });
  return res.body;
}

// ===================== GET =====================
describe("GET /api/tasks", () => {
  test("trả mảng rỗng khi chưa có task", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]); // toEqual: so sánh nội dung (mảng/object)
  });

  test("task mới nhất đứng đầu danh sách", async () => {
    await createTask("A");
    await createTask("B");
    const res = await request(app).get("/api/tasks");
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("B"); // toBe: so sánh giá trị nguyên thủy (số, chuỗi)
  });
});

// ===================== POST =====================
describe("POST /api/tasks", () => {
  test("201 và trả task mới khi dữ liệu hợp lệ", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Học Jest" });
    expect(res.status).toBe(201);
    // objectContaining: chỉ kiểm tra các trường liệt kê, bỏ qua created_at
    expect(res.body).toEqual(
      expect.objectContaining({ id: 1, title: "Học Jest", status: 0 }),
    );
  });

  test("cắt khoảng trắng hai đầu của title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "   Học   " });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Học");
  });

  test("nhận title dài đúng 255 ký tự (biên trên)", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "a".repeat(255) });
    expect(res.status).toBe(201);
  });

  test("400 khi title dài 256 ký tự (vượt biên)", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "a".repeat(256) });
    expect(res.status).toBe(400);
  });

  // test.each: chạy cùng một test với nhiều bộ dữ liệu đầu vào
  test.each([
    ["title rỗng", { title: "" }],
    ["title toàn khoảng trắng", { title: "   " }],
    ["thiếu title", {}],
  ])("400 khi %s", async (_ten, body) => {
    const res = await request(app).post("/api/tasks").send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined(); // response lỗi phải có message
  });

  test("lưu đúng tiếng Việt có dấu và emoji", async () => {
    const title = "Học tiếng Việt có dấu 😀";
    const res = await request(app).post("/api/tasks").send({ title });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(title);
  });

  test("lưu nguyên chuỗi giống HTML (việc escape do frontend lo)", async () => {
    const title = "<script>alert(1)</script>";
    const res = await request(app).post("/api/tasks").send({ title });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(title);
  });
});

// ===================== DELETE =====================
describe("DELETE /api/tasks/:id", () => {
  test("200 và task thật sự biến mất", async () => {
    const task = await createTask("Xóa tôi");
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(200);

    const list = await request(app).get("/api/tasks");
    expect(list.body).toHaveLength(0); // kiểm tra tác dụng thật, không chỉ nhìn status
  });

  test("xóa lần hai cùng một id thì 404", async () => {
    const task = await createTask("Xóa hai lần");
    await request(app).delete(`/api/tasks/${task.id}`);
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(404);
  });

  test("404 khi id không tồn tại", async () => {
    const res = await request(app).delete("/api/tasks/99999");
    expect(res.status).toBe(404);
  });

  test.each(["abc", "-1", "0", "1.5"])("400 khi id = %s", async (id) => {
    const res = await request(app).delete(`/api/tasks/${id}`);
    expect(res.status).toBe(400);
  });
});

// ===================== PATCH =====================
describe("PATCH /api/tasks/:id", () => {
  test("đánh dấu hoàn thành (status = 1)", async () => {
    const task = await createTask("Làm bài");
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 1 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(1);
  });

  test("nhận status dạng boolean true và chuyển về 1", async () => {
    const task = await createTask("Làm bài");
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: true });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(1);
  });

  test("gửi lặp lại cùng một status vẫn 200", async () => {
    const task = await createTask("Làm bài");
    await request(app).patch(`/api/tasks/${task.id}`).send({ status: 1 });
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 1 });
    expect(res.status).toBe(200);
  });

  test("chỉ đổi title thì status giữ nguyên", async () => {
    const task = await createTask("Tên cũ");
    await request(app).patch(`/api/tasks/${task.id}`).send({ status: 1 });
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ title: "Tên mới" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ title: "Tên mới", status: 1 }),
    );
  });

  test.each([
    ["status = 5", { status: 5 }],
    ['status = "abc"', { status: "abc" }],
    ["title toàn khoảng trắng", { title: "   " }],
    ["body rỗng", {}],
  ])("400 khi %s", async (_ten, body) => {
    const task = await createTask("Làm bài");
    const res = await request(app).patch(`/api/tasks/${task.id}`).send(body);
    expect(res.status).toBe(400);
  });

  test("404 khi id không tồn tại", async () => {
    const res = await request(app)
      .patch("/api/tasks/99999")
      .send({ status: 1 });
    expect(res.status).toBe(404);
  });

  test("400 khi id không hợp lệ", async () => {
    const res = await request(app).patch("/api/tasks/abc").send({ status: 1 });
    expect(res.status).toBe(400);
  });
});
