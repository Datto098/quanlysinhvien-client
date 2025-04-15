// Hàm lấy danh sách bài viết chưa duyệt
async function getPendingPosts() {
	const pendingPosts = await fetch(`${API_URL}/forum/unapproved/all`, {
		headers: getAuthHeader(),
	});

	const posts = await pendingPosts.json();
	console.log(posts);
	const postList = document.getElementById('postsTable');
	postList.innerHTML = ''; // Xóa nội dung cũ

	if (posts.length === 0) {
		const noPostsMessage = document.createElement('p');
		noPostsMessage.textContent =
			'Hiện tại không có bài viết nào đang chờ duyệt.';
		noPostsMessage.classList.add('no-posts-message');
		postList.appendChild(noPostsMessage);
	} else {
		// Duyệt qua từng bài viết và tạo thẻ HTML tương ứng
		posts.forEach((post) => {
			const li = document.createElement('li');
			li.classList.add('post-item');

			// Tiêu đề bài viết
			const postTitle = document.createElement('h3');
			postTitle.textContent = post.title;

			// Thông tin tác giả
			const author = document.createElement('p');
			author.textContent = `Tác giả: ${post.author.fullname} (Mã sinh viên: ${post.author.studentId})`;

			// Thông tin danh mục
			const category = document.createElement('p');
			category.textContent = `Danh mục: ${post.category}`;

			// Thông tin ngày tạo
			const createdAt = document.createElement('p');
			createdAt.textContent = `Ngày tạo: ${new Date(post.createdAt).toLocaleString()}`;

			// Trạng thái bài viết
			const status = document.createElement('p');
			status.textContent = `Trạng thái: ${post.status === 'spending' ? 'Đang chờ duyệt' : 'Đã duyệt'}`;

			// Hiển thị ảnh thumbnail (nếu có)
			if (post.thumbnail) {
				const thumbnail = document.createElement('img');
				thumbnail.src = `${API_BASE_URL}${post.thumbnail}`; // Đảm bảo URL đúng
				thumbnail.alt = 'Thumbnail';
				thumbnail.classList.add('thumbnail-img'); // Thêm lớp CSS cho ảnh
				li.appendChild(thumbnail);
			}

			// Tạo các nút Duyệt và Từ chối
			const buttonsDiv = document.createElement('div');
			buttonsDiv.classList.add('buttons');

			const approveButton = document.createElement('button');
			approveButton.textContent = 'Duyệt bài';
			approveButton.classList.add('approve-btn');
			approveButton.onclick = () => approvePost(post._id);

			const rejectButton = document.createElement('button');
			rejectButton.textContent = 'Từ chối';
			rejectButton.classList.add('reject-btn');
			rejectButton.onclick = () => rejectPost(post._id);

			buttonsDiv.appendChild(approveButton);
			buttonsDiv.appendChild(rejectButton);

			// Chèn các thông tin và nút vào thẻ <li>
			li.appendChild(postTitle);
			li.appendChild(author);
			li.appendChild(category);
			li.appendChild(createdAt);
			li.appendChild(status);
			li.appendChild(buttonsDiv);

			// Thêm <li> vào bảng
			postList.appendChild(li);
		});
	}
}

// Hàm duyệt bài viết
async function approvePost(postId) {
	const response = await fetch(`${API_URL}/forum/approve/${postId}`, {
		method: 'POST',
		headers: getAuthHeader(),
	});
	if (response.ok) {
		alert('Bài viết đã được duyệt');
		getPendingPosts(); // Cập nhật lại danh sách bài viết
	} else {
		alert('Lỗi khi duyệt bài viết');
	}
}

// Hàm hủy duyệt bài viết
async function rejectPost(postId) {
	const response = await fetch(`${API_URL}/forum/reject/${postId}`, {
		method: 'POST',
		headers: getAuthHeader(),
	});
	if (response.ok) {
		alert('Bài viết đã bị hủy duyệt');
		getPendingPosts(); // Cập nhật lại danh sách bài viết
	} else {
		alert('Lỗi khi hủy duyệt bài viết');
	}
}

// Hàm khởi tạo
async function init() {
	await getPendingPosts();
}

// Gọi hàm khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', init);
