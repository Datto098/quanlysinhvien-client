const API_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'http://localhost:5000'; // Địa chỉ API cơ bản

// Kiểm tra đăng nhập
function checkAuth() {
	const token = localStorage.getItem('token');
	const user = JSON.parse(localStorage.getItem('user'));
	const currentPath = window.location.pathname;

	// Các trang không cần đăng nhập
	const publicPages = ['/index.html', '/login.html', '/register.html', '/'];

	// Nếu đang ở trang công khai thì không cần check token
	if (publicPages.some((page) => currentPath.endsWith(page))) {
		// Nếu có user thì vẫn cập nhật UI
		if (user && token) {
			updateAuthUI(user);
		}
		return true;
	}

	if (!token || !user) {
		window.location.href = '/login.html';
		return false;
	}

	// Cập nhật UI dựa trên trạng thái đăng nhập
	updateAuthUI(user);
	return true;
}

// Kiểm tra quyền admin
function checkAdmin() {
	const user = JSON.parse(localStorage.getItem('user'));
	if (!user || user.role !== 'admin') {
		// Nếu không phải admin, chuyển về trang chủ
		window.location.href = '/index.html';
		return false;
	}
	return true;
}

// Kiểm tra role của user
function checkRole(requiredRole) {
	const user = JSON.parse(localStorage.getItem('user'));
	return user && user.role === requiredRole;
}

// Lấy thông tin user hiện tại
function getCurrentUser() {
	return JSON.parse(localStorage.getItem('user'));
}

// Cập nhật UI dựa trên trạng thái đăng nhập
function updateAuthUI(user) {
	const navLinks = document.querySelector('.nav-links');
	if (navLinks) {
		// Ẩn/hiện các nút dựa trên trạng thái đăng nhập
		const loginLink = document.getElementById('loginLink');
		const registerLink = document.getElementById('registerLink');
		const logoutLink = document.getElementById('logoutLink');
		const adminLinks = document.querySelectorAll('#adminLink');
		const profileLink = document.getElementById('profileLink');

		if (user) {
			// Đã đăng nhập
			if (loginLink) loginLink.style.display = 'none';
			if (registerLink) registerLink.style.display = 'none';
			if (logoutLink) logoutLink.style.display = 'block';
			if (profileLink) profileLink.style.display = 'block';
			if (adminLinks) {
				adminLinks.forEach((link) => {
					link.style.display =
						user.role === 'admin' ? 'block' : 'none';
				});
			}
		} else {
			// Chưa đăng nhập
			if (loginLink) loginLink.style.display = 'block';
			if (registerLink) registerLink.style.display = 'block';
			if (logoutLink) logoutLink.style.display = 'none';
			if (profileLink) profileLink.style.display = 'none';
			if (adminLinks) {
				adminLinks.forEach((link) => {
					link.style.display = 'none';
				});
			}
		}
	}
}

// Lấy header xác thực cho API calls
function getAuthHeader(contentType = 'application/json') {
	const token = localStorage.getItem('token');

	const headers = {
		Authorization: `Bearer ${token}`,
	};

	// Chỉ thêm Content-Type khi contentType khác "NONE"
	if (contentType !== 'NONE') {
		headers['Content-Type'] = contentType;
	}

	return headers;
}

// Đăng xuất
function logout() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	window.location.href = '/login.html';
}

// Xử lý form đăng nhập và đăng ký
document.addEventListener('DOMContentLoaded', () => {
	// Kiểm tra auth trên mọi trang trừ login và register
	if (
		!window.location.pathname.includes('login.html') &&
		!window.location.pathname.includes('register.html')
	) {
		checkAuth();
	}

	// Toggle password visibility
	const togglePasswordButtons = document.querySelectorAll('.toggle-password');
	togglePasswordButtons.forEach((button) => {
		button.addEventListener('click', function () {
			const input = this.previousElementSibling;
			const type =
				input.getAttribute('type') === 'password' ? 'text' : 'password';
			input.setAttribute('type', type);
			this.classList.toggle('fa-eye');
			this.classList.toggle('fa-eye-slash');
		});
	});

	// Form đăng nhập
	const loginForm = document.getElementById('loginForm');
	if (loginForm) {
		loginForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			// Reset previous errors
			clearErrors();

			const email = document.getElementById('email').value;
			const password = document.getElementById('password').value;
			const remember = document.querySelector(
				'input[name="remember"]'
			).checked;

			try {
				const response = await fetch(`${API_URL}/auth/login`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ email, password, remember }),
				});

				const data = await response.json();

				if (!response.ok) {
					showErrorInput('email', 'Đăng nhập thất bại');
					throw new Error(data.message || 'Đăng nhập thất bại');
				}

				// Lưu thông tin đăng nhập
				localStorage.setItem('token', data.token);
				localStorage.setItem('user', JSON.stringify(data.student));

				// Chuyển hướng về trang chủ
				window.location.href = '/index.html';
			} catch (error) {
				showErrorInput('email', error.message);
			}
		});
	}

	// Form đăng ký
	const registerForm = document.getElementById('registerForm');
	//  console.log(registerForm);

	if (registerForm) {
		registerForm.addEventListener('submit', async (e) => {
			// console.log("REGISTER");
			e.preventDefault();

			// Reset previous errors
			clearErrors();

			const fullname = document.getElementById('fullname').value;
			const email = document.getElementById('email').value;
			const password = document.getElementById('password').value;
			const confirmPassword =
				document.getElementById('confirmPassword').value;
			const terms = document.querySelector('input[name="terms"]').checked;
			const studentId = document.getElementById('studentId').value;
			// Validate password match
			if (password !== confirmPassword) {
				showErrorInput(
					'confirmPassword',
					'Mật khẩu xác nhận không khớp'
				);
				return;
			}

			// Validate terms
			if (!terms) {
				showErrorInput(
					'terms',
					'Bạn phải đồng ý với điều khoản sử dụng'
				);
				return;
			}

			try {
				const response = await fetch(`${API_URL}/auth/register`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						fullname,
						email,
						password,
						studentId,
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					showErrorInput('email', 'Đăng ký thất bại');
					throw new Error(data.message || 'Đăng ký thất bại');
				}

				// Hiển thị thông báo thành công
				showSuccess('Đăng ký thành công! Đang chuyển hướng...');

				// Chuyển về trang đăng nhập sau 2 giây
				setTimeout(() => {
					window.location.href = '/login.html';
				}, 2000);
			} catch (error) {
				showErrorInput('email', error.message);
			}
		});
	}
});

// Helper functions
function showErrorInput(inputId, message) {
	const input = document.getElementById(inputId);
	const inputGroup = input.closest('.input-group');
	inputGroup.classList.add('error');

	// Create error message element if it doesn't exist
	if (!inputGroup.nextElementSibling?.classList.contains('error-message')) {
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i>${message}`;
		inputGroup.parentNode.insertBefore(errorDiv, inputGroup.nextSibling);
	}
}

function clearErrors() {
	document.querySelectorAll('.input-group').forEach((group) => {
		group.classList.remove('error');
	});
	document.querySelectorAll('.error-message').forEach((error) => {
		error.remove();
	});
}

function showSuccess(message) {
	const successDiv = document.createElement('div');
	successDiv.className = 'alert alert-success';
	successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
	document.body.appendChild(successDiv);

	setTimeout(() => {
		successDiv.classList.add('fade-out');
		setTimeout(() => successDiv.remove(), 300);
	}, 3000);
}

function showError(message) {
	const errorDiv = document.createElement('div');
	errorDiv.className = 'alert alert-danger';
	errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
	document.body.appendChild(errorDiv);

	setTimeout(() => {
		errorDiv.classList.add('fade-out');
		setTimeout(() => errorDiv.remove(), 300);
	}, 3000);
}

// Add loading animation to forms
document.querySelectorAll('form').forEach((form) => {
	form.addEventListener('submit', function (e) {
		const submitButton = this.querySelector('button[type="submit"]');
		if (!submitButton) return;

		const originalText = submitButton.innerHTML;
		submitButton.innerHTML =
			'<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
		submitButton.disabled = true;

		// Reset button after 3 seconds if API hasn't responded
		setTimeout(() => {
			if (submitButton.disabled) {
				submitButton.innerHTML = originalText;
				submitButton.disabled = false;
			}
		}, 1000);
	});
});

// Export các hàm cần thiết cho các file khác sử dụng
window.getAuthHeader = getAuthHeader;
window.checkAuth = checkAuth;
window.checkAdmin = checkAdmin;
window.checkRole = checkRole;
window.getCurrentUser = getCurrentUser;
window.logout = logout;

// Helper functions
function generateStudentId() {
	const year = new Date().getFullYear();
	const randomNum = Math.floor(Math.random() * 10000)
		.toString()
		.padStart(4, '0');
	return `SV${year}${randomNum}`;
}
