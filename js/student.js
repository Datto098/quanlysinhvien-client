document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;
    loadProfile();
});

// Tải thông tin sinh viên
async function loadProfile() {
    try {
        const user = getCurrentUser();
        if (!user) return;

        // Lấy thông tin chi tiết từ API
        const response = await fetch(`${API_URL}/students/profile`, {
            headers: getAuthHeader(),
        });

        if (!response.ok) {
            throw new Error("Không thể tải thông tin sinh viên");
        }

        const student = await response.json();

        // Điền thông tin vào form
        document.getElementById("fullname").value = student.fullname;
        document.getElementById("email").value = student.email;
        document.getElementById("studentId").value = student.studentId;
        document.getElementById("role").value =
            student.role === "admin" ? "Quản trị viên" : "Sinh viên";

        // Điền thông tin mới
        if (student.birthDate) {
            // Chuyển đổi ngày sang định dạng YYYY-MM-DD cho input type="date"
            const birthDate = new Date(student.birthDate);
            document.getElementById("birthDate").value = birthDate
                .toISOString()
                .split("T")[0];
        }
        document.getElementById("address").value = student.address || "";
    } catch (error) {
        console.error("Lỗi:", error);
        showError("Không thể tải thông tin sinh viên");
    }
}

// Cập nhật thông tin sinh viên
async function updateProfile(event) {
    event.preventDefault();

    const formData = {
        fullname: document.getElementById("fullname").value,
        email: document.getElementById("email").value,
        birthDate: document.getElementById("birthDate").value || null,
        address: document.getElementById("address").value || "",
    };

    const newPassword = document.getElementById("newPassword").value;
    if (newPassword.trim()) {
        formData.password = newPassword;
    }

    try {
        const user = getCurrentUser();
        const response = await fetch(`${API_URL}/students/profile`, {
            method: "PUT",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Không thể cập nhật thông tin");
        }

        const updatedUser = await response.json();

        // Cập nhật thông tin trong localStorage
        localStorage.setItem(
            "user",
            JSON.stringify({
                ...user,
                fullname: updatedUser.fullname,
                email: updatedUser.email,
            })
        );

        showSuccess("Cập nhật thông tin thành công");

        // Reset mật khẩu mới
        document.getElementById("newPassword").value = "";

        // Reload thông tin
        loadProfile();
    } catch (error) {
        console.error("Lỗi:", error);
        showError(error.message || "Không thể cập nhật thông tin");
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type =
        input.getAttribute("type") === "password" ? "text" : "password";
    input.setAttribute("type", type);

    const icon = input.nextElementSibling;
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
}
