let currentStudents = [];

// Kiểm tra quyền admin khi tải trang
document.addEventListener("DOMContentLoaded", () => {
    // Kiểm tra đăng nhập và quyền admin
    if (!checkAuth() || !checkAdmin()) {
        return; // Nếu không phải admin sẽ bị chuyển hướng bởi checkAdmin
    }

    // Load dữ liệu ban đầu
    fetchStudents();
});

// Lấy danh sách sinh viên
async function fetchStudents() {
    try {
        const response = await fetch(`${API_URL}/students`, {
            headers: getAuthHeader(),
        });

        // console.log(response);

        if (!response.ok) {
            throw new Error("Không có quyền truy cập");
        }

        const students = await response.json();
        currentStudents = students;
        displayStudents(students);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sinh viên:", error);
        showError("Đã xảy ra lỗi khi tải danh sách sinh viên");
    }
}

// Hiển thị sinh viên trong bảng
function displayStudents(students) {
    const tbody = document.querySelector("#studentsTable tbody");
    tbody.innerHTML = "";

    students.forEach((student) => {
        const tr = document.createElement("tr");

        // Format ngày sinh
        let birthDateStr = "";
        if (student.birthDate) {
            const birthDate = new Date(student.birthDate);
            birthDateStr = birthDate.toLocaleDateString("vi-VN");
        }

        tr.innerHTML = `
            <td>${student.studentId}</td>
            <td>${student.fullname}</td>
            <td>${student.email}</td>
            <td>${birthDateStr}</td>
            <td>${student.address || ""}</td>
            <td>${student.role === "admin" ? "Quản trị viên" : "Sinh viên"}</td>
            <td>
                <button class="btn btn-edit" onclick='editStudent(${JSON.stringify(
                    student
                ).replace(/'/g, "&#39;")})'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteStudent('${
                    student._id
                }')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Mở modal chỉnh sửa và điền thông tin sinh viên
function editStudent(student) {
    // Điền thông tin vào form
    document.getElementById("estudentId").value = student._id;
    document.getElementById("fullname").value = student.fullname;
    document.getElementById("email").value = student.email;
    document.getElementById("studentId").value = student.studentId;
    document.getElementById("role").value = student.role;
    document.getElementById("password").value = ""; // Reset password field

    // Điền thông tin mới
    if (student.birthDate) {
        const birthDate = new Date(student.birthDate);
        document.getElementById("birthDate").value = birthDate
            .toISOString()
            .split("T")[0];
    } else {
        document.getElementById("birthDate").value = "";
    }
    document.getElementById("address").value = student.address || "";

    // Hiển thị modal
    const modal = document.getElementById("editStudentModal");
    modal.style.display = "block";
}

// Cập nhật thông tin sinh viên
async function updateStudent(event) {
    event.preventDefault();

    const studentId = document.getElementById("estudentId").value;
    const formData = {
        fullname: document.getElementById("fullname").value,
        email: document.getElementById("email").value,
        studentId: document.getElementById("studentId").value,
        role: document.getElementById("role").value,
        birthDate: document.getElementById("birthDate").value || null,
        address: document.getElementById("address").value || "",
    };

    const password = document.getElementById("password").value;
    if (password.trim()) {
        formData.password = password;
    }

    try {
        const response = await fetch(`${API_URL}/students/${studentId}`, {
            method: "PUT",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(
                data.message || "Không thể cập nhật thông tin sinh viên"
            );
        }

        // Đóng modal và reload danh sách
        closeModal("editStudentModal");
        showSuccess("Cập nhật thông tin sinh viên thành công");
        fetchStudents();
    } catch (error) {
        console.error("Lỗi:", error);
        showError(error.message);
    }
}

// Xóa sinh viên
async function deleteStudent(studentId) {
    if (!confirm("Bạn có chắc chắn muốn xóa sinh viên này?")) return;

    try {
        const response = await fetch(`${API_URL}/students/${studentId}`, {
            method: "DELETE",
            headers: getAuthHeader(),
        });

        if (!response.ok) throw new Error("Không thể xóa sinh viên");

        showSuccess("Xóa sinh viên thành công");
        fetchStudents();
    } catch (error) {
        console.error("Lỗi:", error);
        showError("Không thể xóa sinh viên");
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

// Tìm kiếm sinh viên
function filterStudents() {
    const searchText = document
        .getElementById("searchStudent")
        .value.toLowerCase();
    const rows = document.querySelectorAll("#studentsTable tbody tr");

    rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? "" : "none";
    });
}

// Sắp xếp sinh viên
function sortStudents() {
    const sortBy = document.getElementById("sortStudents").value;
    if (!sortBy) return;

    const tbody = document.querySelector("#studentsTable tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        let aValue =
            a.cells[sortBy === "name" ? 1 : sortBy === "id" ? 0 : 5]
                .textContent;
        let bValue =
            b.cells[sortBy === "name" ? 1 : sortBy === "id" ? 0 : 5]
                .textContent;
        return aValue.localeCompare(bValue);
    });

    tbody.innerHTML = "";
    rows.forEach((row) => tbody.appendChild(row));
}

// Hiển thị thông báo lỗi
function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.classList.add("fade-out");
        setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
}

// Hiển thị thông báo thành công
function showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "alert alert-success";
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.classList.add("fade-out");
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
}

// Hiển thị modal thêm sinh viên
function showAddStudentModal() {
    document.getElementById("addStudentModal").style.display = "block";
    // Reset form
    document.getElementById("addStudentForm").reset();
}

// Thêm sinh viên mới
async function addStudent(event) {
    event.preventDefault();

    const formData = {
        fullname: document.getElementById("addFullname").value,
        email: document.getElementById("addEmail").value,
        studentId: document.getElementById("addStudentId").value,
        password: document.getElementById("addPassword").value,
        role: document.getElementById("addRole").value,
        address: document.getElementById("addAddress").value,
        birthDate: document.getElementById("addBirthDate").value,
    };

    try {
        const response = await fetch(`${API_URL}/students`, {
            method: "POST",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        console.log(response);

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Không thể thêm sinh viên");
        }

        // Đóng modal và refresh danh sách
        document.getElementById("addStudentModal").style.display = "none";
        document.getElementById("addStudentForm").reset();
        showSuccess("Thêm sinh viên thành công");
        fetchStudents();
    } catch (error) {
        console.error("Lỗi:", error);
        showError(error.message || "Không thể thêm sinh viên");
    }
}
