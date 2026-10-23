require("dotenv").config(); // nạp .env để lấy PORT

const app = require("./app"); // lấy app đã cấu hình sẵn
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
