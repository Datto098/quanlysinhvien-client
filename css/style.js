const API_URL = "http://localhost:5000/api";

// Định nghĩa các endpoints
const ENDPOINTS = {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    // ... các endpoints khác
};

// Ví dụ gọi API để lấy danh sách sinh viên
async function fetchStudents() {
    try {
        const res = await fetch("http://localhost:3000/api/students");
        const data = await res.json();
        console.log(data);
        // Xử lý hiển thị lên HTML...
    } catch (err) {
        console.error(err);
    }
}

// Ví dụ gọi khi trang load
document.addEventListener("DOMContentLoaded", () => {
    fetchStudents();
});
