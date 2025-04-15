// Khởi tạo Quill editor
const quill = new Quill('#commentEditor', {
	theme: 'snow', // Bạn có thể thay đổi thành 'bubble' nếu thích
	modules: {
		toolbar: [
			[{ header: '1' }, { header: '2' }, { font: [] }],
			[{ list: 'ordered' }, { list: 'bullet' }],
			[{ align: [] }],
			['bold', 'italic', 'underline'],
			['link'],
			['image'], // Cho phép chèn ảnh vào bình luận
		],
	},
	placeholder: 'Viết bình luận...',
});

// Hàm xử lý upload ảnh từ Quill editor
function uploadImageToServer(file) {
	console.log(file);
	const formData = new FormData();
	formData.append('image', file);
	formData.append('type', file.type); // Thêm loại ảnh vào formData
	formData.append('size', file.size); // Thêm kích thước ảnh vào formData
	formData.append('name', file.name); // Thêm tên ảnh vào formData

	return fetch(`${API_URL}/upload/image`, {
		method: 'POST',
		headers: getAuthHeader('NONE'), // Không cần 'Content-Type' cho FormData
		body: formData,
	})
		.then((response) => response.json())
		.then((data) => {
			if (data && data.url) {
				return data.url; // Trả về URL ảnh đã upload
			} else {
				throw new Error('Lỗi khi upload ảnh');
			}
		});
}

// Lắng nghe sự kiện khi ảnh được chọn trong Quill editor
const toolbar = quill.getModule('toolbar');
toolbar.addHandler('image', function () {
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.setAttribute('accept', 'image/*');
	input.setAttribute('style', 'display: none;'); // Ẩn input file

	input.click(); // Mở hộp thoại chọn file

	input.onchange = function () {
		const file = input.files[0]; // Lấy tệp ảnh đã chọn
		if (file) {
			uploadImageToServer(file)
				.then((url) => {
					const range = quill.getSelection();
					quill.insertEmbed(range.index, 'image', API_BASE_URL + url); // Chèn ảnh vào vị trí con trỏ
				})
				.catch((error) => {
					console.error('Lỗi khi upload ảnh:', error);
					showError('Đã xảy ra lỗi khi upload ảnh');
				});
		}
	};
});

// Lắng nghe sự kiện submit từ form
const commentForm = document.querySelector('.comment-form');
commentForm.addEventListener('submit', function (event) {
	event.preventDefault(); // Ngừng việc submit form mặc định

	// Lấy nội dung từ Quill editor (HTML nội dung của bình luận)
	const commentContent = quill.root.innerHTML;

	if (commentContent.trim() === '') {
		alert('Vui lòng nhập bình luận');
		return;
	}

	// Gửi bình luận lên server
	fetch(`${API_URL}/forum/${currentPost._id}/comments`, {
		method: 'POST',
		headers: getAuthHeader(),
		body: JSON.stringify({
			content: commentContent, // Nội dung bình luận với ảnh đã chèn
			author: getCurrentUser(),
		}),
	})
		.then((response) => response.json())
		.then((data) => {
			console.log('Bình luận đã được gửi:', data);
			// Cập nhật UI sau khi gửi bình luận thành công
			currentPost.comments.push(data); // Thêm bình luận mới vào danh sách
			displayComments(currentPost.comments); // Hiển thị bình luận
			quill.setText(''); // Xóa nội dung trong Quill editor
			// Reset lại nội dung Quill editor
			quill.root.innerHTML = ''; // Xóa nội dung trong Quill editor
			// Hiển thị thông báo thành công
			showSuccess('Bình luận đã được gửi thành công');
		})
		.catch((error) => {
			console.error('Lỗi khi gửi bình luận:', error);
			showError('Đã xảy ra lỗi khi gửi bình luận');
		});
});
