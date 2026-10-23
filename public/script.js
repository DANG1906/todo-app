// ---- 1. Lấy tham chiếu tới các phần tử HTML (tìm bằng id đã đặt trong index.html) ----
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const message = document.getElementById("message");

// Đường dẫn tương đối: trang và API cùng origin (cùng localhost:3000) nên không cần ghi đầy đủ
const API_URL = "/api/tasks";

// ---- 2. Hiển thị thông báo (lỗi) lên trang ----
function showMessage(text) {
  message.textContent = text; // textContent: chèn như chữ thuần, không diễn giải HTML
}

// ---- 3. Vẽ danh sách task ra giao diện ----
function renderTasks(tasks) {
  list.replaceChildren(); // xóa sạch các <li> cũ trước khi vẽ lại

  // Chưa có task nào thì hiện dòng thông báo rồi dừng
  if (tasks.length === 0) {
    const empty = document.createElement("li"); // tạo phần tử <li> mới trong bộ nhớ
    empty.className = "empty";
    empty.textContent = "Chưa có công việc nào";
    list.appendChild(empty); // gắn vào <ul> thì mới hiện lên trang
    return;
  }

  tasks.forEach((task) => {
    const li = document.createElement("li");
    // status = 1 thì thêm class "completed" (CSS sẽ gạch ngang chữ)
    li.className = "task-item" + (task.status ? " completed" : "");
    li.dataset.id = task.id; // lưu id vào thuộc tính data-id của <li> để lúc xóa còn biết task nào

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title; // QUAN TRỌNG: dùng textContent, không dùng innerHTML (chống XSS)

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Xóa";

    // Ô tick hoàn thành (MỚI)
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = Boolean(task.status); // status 1 → tick sẵn, 0 → không tick

    // append nhận nhiều phần tử một lúc: checkbox đứng đầu, rồi tiêu đề, rồi nút Xóa
    li.append(checkbox, title, deleteBtn);
    list.appendChild(li);
  });
}

// ---- 4. Lấy danh sách từ server (GET) ----
async function loadTasks() {
  try {
    const res = await fetch(API_URL); // mặc định là GET
    if (!res.ok) throw new Error("Không tải được danh sách"); // res.ok = true khi status 200–299
    const tasks = await res.json(); // đọc body và parse JSON thành mảng
    renderTasks(tasks);
    showMessage(""); // xóa thông báo lỗi cũ (nếu có)
  } catch (err) {
    showMessage(err.message); // lỗi mạng hoặc server tắt cũng rơi vào đây
  }
}

// ---- 5. Thêm task (POST) khi submit form ----
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // chặn hành vi mặc định: form sẽ tải lại cả trang

  const title = input.value.trim(); // lấy chữ trong ô nhập, bỏ khoảng trắng hai đầu
  if (!title) {
    showMessage("Tiêu đề không được để trống");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // báo server biết body là JSON
      body: JSON.stringify({ title }), // object → chuỗi JSON: {"title":"..."}
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Thêm thất bại"); // lấy message lỗi từ server (400...)

    input.value = ""; // xóa ô nhập
    input.focus(); // đưa con trỏ về ô nhập để gõ tiếp
    await loadTasks(); // tải lại danh sách để thấy task mới
  } catch (err) {
    showMessage(err.message);
  }
});

// ---- 6. Xóa task (DELETE) bằng event delegation ----
// Chỉ gắn MỘT listener cho <ul>, thay vì gắn cho từng nút "Xóa".
// Lý do: các <li> được tạo lại mỗi lần render, gắn listener từng nút sẽ phải làm lại liên tục.
list.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-btn"); // e.target = phần tử thật sự bị bấm; tìm nút Xóa gần nhất
  if (!btn) return; // bấm chỗ khác trong danh sách thì bỏ qua

  const id = btn.closest(".task-item").dataset.id; // từ nút lần ngược lên <li> rồi đọc data-id

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" }); // template string ghép id vào URL
    if (!res.ok && res.status !== 404) {
      // 404 = task đã không còn, coi như xóa xong
      throw new Error("Xóa thất bại");
    }
    await loadTasks();
  } catch (err) {
    showMessage(err.message);
  }
});
// ---- Đánh dấu hoàn thành (PATCH) ----
// Cũng dùng event delegation: một listener ở <ul> bắt thay đổi của mọi checkbox
list.addEventListener("change", async (e) => {
  const checkbox = e.target.closest(".task-checkbox"); // chỉ quan tâm checkbox, bỏ qua phần tử khác
  if (!checkbox) return;

  const id = checkbox.closest(".task-item").dataset.id; // lấy id task từ data-id của <li>

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: checkbox.checked ? 1 : 0 }), // tick → 1, bỏ tick → 0
    });
    if (!res.ok) throw new Error("Cập nhật thất bại");
    await loadTasks(); // vẽ lại để CSS gạch ngang theo dữ liệu mới
  } catch (err) {
    await loadTasks(); // lỗi thì tải lại để checkbox khớp với DB
    showMessage(err.message); // hiện lỗi SAU khi tải lại (loadTasks sẽ xóa thông báo cũ)
  }
});
// ---- 7. Chạy lần đầu khi trang vừa tải xong ----
loadTasks();
