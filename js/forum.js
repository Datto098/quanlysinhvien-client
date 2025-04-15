let currentPosts = [];
let currentPost = null;

// Hiển thị thông báo lỗi
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

// Lấy danh sách bài viết
async function fetchPosts(category = null) {
	try {
		const response = await fetch(`${API_URL}/forum`);
		const posts = await response.json();

		console.log(posts);

		// Lọc posts theo category nếu có
		let filteredPosts = posts;
		if (category) {
			filteredPosts = posts.filter((post) => post.category === category);
		}

		currentPosts = filteredPosts; // Lưu lại để dùng cho chức năng search
		displayPosts(filteredPosts);

		// Cập nhật tiêu đề section nếu có category
		if (category) {
			const sectionTitle = document.querySelector('.section-title');
			if (sectionTitle) {
				sectionTitle.textContent = `Diễn đàn - ${getCategoryName(
					category
				)}`;
			}
		}
	} catch (error) {
		console.error('Lỗi khi lấy bài viết:', error);
		showError('Đã xảy ra lỗi khi tải bài viết');
	}
}

// Hiển thị danh sách bài viết
function displayPosts(posts) {
	const container = document.getElementById('posts');
	if (!container) {
		console.error('Không tìm thấy container posts');
		return;
	}

	// Xóa nội dung cũ
	container.innerHTML = '';

	if (!posts || posts.length === 0) {
		container.innerHTML = `
           <div class="no-posts">
               <i class="fas fa-inbox fa-3x"></i>
               <p>Chưa có bài viết nào</p>
           </div>
       `;
		return;
	}

	// Lấy template
	const template = document.getElementById('postTemplate');
	if (!template) {
		console.error('Không tìm thấy template bài viết');
		return;
	}

	// Hiển thị từng bài viết
	posts.forEach((post) => {
		try {
			// Clone template
			const postElement = document.importNode(template.content, true);
			const article = postElement.querySelector('.post');

			// Thêm ID cho bài viết
			article.dataset.id = post._id;

			// Cập nhật thông tin tác giả
			const authorName = article.querySelector('.author-name');
			const authorId = article.querySelector('.author-id');
			if (post.author) {
				authorName.textContent =
					post.author.fullname || 'Không xác định';
				authorId.textContent = post.author.studentId || '';
			} else {
				authorName.textContent = 'Người dùng không xác định';
				authorId.textContent = '';
			}

			// Cập nhật thời gian và loại bài viết
			article.querySelector('.post-time').textContent = formatDate(
				post.createdAt
			);
			article.querySelector('.post-type').textContent = getCategoryName(
				post.category
			);

			// Cập nhật nội dung bài viết
			article.querySelector('.post-title').textContent = post.title;
			article.querySelector('.post-text').textContent = post.content;

			// Cập nhật ảnh thumbnail (nếu có)
			const thumbnailContainer = document.createElement('div');
			thumbnailContainer.classList.add('post-thumbnail');
			if (post.thumbnail) {
				const thumbnailImage = document.createElement('img');
				thumbnailImage.src = `${post.thumbnail}`; // Đảm bảo URL đúng
				thumbnailImage.alt = 'Thumbnail';
				thumbnailImage.classList.add('thumbnail-img'); // Thêm lớp CSS cho ảnh
				thumbnailContainer.appendChild(thumbnailImage);
				article
					.querySelector('.post-content')
					.prepend(thumbnailContainer); // Đặt ảnh vào trước nội dung bài viết
			}

			// Cập nhật số lượt like và trạng thái like
			const likeButton = article.querySelector('.btn-like');
			const likeCount = likeButton.querySelector('.like-count');
			likeCount.textContent = post.likes ? post.likes.length : 0;

			// Thêm class active nếu người dùng đã like
			if (post.likes.includes(getCurrentUser().id)) {
				likeButton.classList.add('active');
			}

			// Cập nhật số comment
			article.querySelector('.comment-count').textContent = post.comments
				? post.comments.length
				: 0;

			// Thêm sự kiện cho các nút
			likeButton.onclick = () => toggleLike(post._id);
			article.querySelector('.btn-comment').onclick = () =>
				showPostDetail(post._id);

			// Hiển thị nút xóa nếu là tác giả hoặc admin
			const deleteButton = article.querySelector('.btn-delete');
			const currentUser = getCurrentUser();
			if (
				currentUser &&
				(currentUser._id === post.author?._id ||
					currentUser.role === 'admin')
			) {
				deleteButton.style.display = 'inline-flex';
				deleteButton.onclick = () => deletePost(post._id);
			}

			// Thêm bài viết vào container
			container.appendChild(postElement);
		} catch (error) {
			console.error('Lỗi khi hiển thị bài viết:', error);
		}
	});
}

// Xóa bài viết
async function deletePost(postId) {
	try {
		const response = await fetch(`${API_URL}/forum/${postId}`, {
			method: 'DELETE',
			headers: getAuthHeader(),
		});

		if (response.ok) {
			showSuccess('Đã xóa bài viết thành công');
			fetchPosts();
		} else {
			showError('Không thể xóa bài viết');
		}
	} catch (error) {
		console.error('Lỗi khi xóa bài viết:', error);
		showError('Đã xảy ra lỗi khi xóa bài viết');
	}
}

// Hiển thị form tạo bài viết mới
function showNewPostForm() {
	if (!checkAuth()) {
		alert('Vui lòng đăng nhập để tạo bài viết');
		showLoginForm();
		return;
	}
	document.getElementById('createPostModal').style.display = 'block';
}

async function createPost(event) {
	event.preventDefault(); // Ngừng hành động mặc định (reload trang)

	// Kiểm tra xem người dùng có đăng nhập không
	if (!checkAuth()) {
		showError('Vui lòng đăng nhập để tạo bài viết');
		window.location.href = '/frontend/login.html';
		return;
	}

	const title = document.getElementById('postTitle').value.trim();
	const content = document.getElementById('postContent').value.trim();
	const category = document.getElementById('postCategory').value;
	const thumbnailFile = document.getElementById('thumbnail').files[0]; // Lấy ảnh thumbnail

	if (!title || !content || !category) {
		showError('Vui lòng điền đầy đủ thông tin bài viết');
		return;
	}

	const formData = new FormData();
	formData.append('title', title);
	formData.append('content', content);
	formData.append('category', category);
	formData.append('author', JSON.stringify(getCurrentUser())); // Thêm thông tin tác giả

	// console.log(getCurrentUser());

	if (thumbnailFile) {
		formData.append('thumbnail', thumbnailFile); // Thêm ảnh thumbnail nếu có
	}

	try {
		const response = await fetch(`${API_URL}/forum`, {
			method: 'POST',
			headers: getAuthHeader('NONE'), // Thêm header xác thực nếu cần
			body: formData, // Gửi FormData chứa dữ liệu và file
		});

		const data = await response.json();

		if (response.ok) {
			closeModal('createPostModal');
			document.getElementById('createPostForm').reset(); // Reset form sau khi tạo bài viết
			showSuccess('Đăng bài viết thành công');
			fetchPosts(); // Cập nhật danh sách bài viết
		} else {
			showError(data.message || 'Không thể tạo bài viết');
		}
	} catch (error) {
		console.error('Lỗi khi tạo bài viết:', error);
		showError('Đã xảy ra lỗi khi tạo bài viết');
	}
}

// Hiển thị chi tiết bài viết
async function showPostDetail(postId) {
	try {
		const response = await fetch(`${API_URL}/forum/${postId}`);
		const post = await response.json();

		// console.log(post.author.fullname);

		currentPost = post;

		const postDetail = document.getElementById('postDetail');
		postDetail.innerHTML = `

            <span class="post-category category-${
				post.category || 'general'
			}">${getCategoryName(post.category)}</span>
            <h2>${post.title}</h2>
            <div class="post-meta">
                <span><i class="fas fa-user"></i> ${post.author.fullname}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(
					post.createdAt
				)}</span>
                <span><i class="fas fa-comments"></i> ${
					post.comments.length
				} bình luận</span>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
        `;

		displayComments(post.comments);
		document.getElementById('postDetailModal').style.display = 'block';
	} catch (error) {
		console.error('Lỗi khi lấy chi tiết bài viết:', error);
		showError('Đã xảy ra lỗi khi tải chi tiết bài viết');
	}
}

// Hiển thị danh sách bình luận
function displayComments(comments) {
	const currentUser = getCurrentUser();
	const container = document.getElementById('comments-container');
	container.innerHTML = '';

	if (comments && comments.length > 0) {
		console.log(currentUser);
		comments.forEach((comment) => {
			// Kiểm tra nếu comment là của người dùng hiện tại
			let showActionComment = false;
			if (currentUser && currentUser.id === comment.author._id) {
				// commentElement.classList.add('current-user-comment');
				showActionComment = true;
			}

			// Kiểm tra nếu người dùng là admin
			if (currentUser && currentUser.role === 'admin') {
				// commentElement.classList.add('admin-comment');
				showActionComment = true;
			}

			const commentElement = document.createElement('div');
			commentElement.className = 'comment';
			if (showActionComment) {
				commentElement.innerHTML = `
                <div class="comment-meta">
                    <span><i class="fas fa-user"></i> ${
						comment.author.fullname
					}</span>
                    <span><i class="fas fa-clock"></i> ${formatDate(
						comment.createdAt
					)}</span>
                </div>
                <div class="comment-content">
                    ${comment.content}
                </div>
                <div class="comment-actions">
                    <button class="btn btn-delete" onclick="deleteComment('${
						comment._id
					}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
			} else {
				commentElement.innerHTML = `
                <div class="comment-meta">
                    <span><i class="fas fa-user"></i> ${
						comment.author.fullname
					}</span>
                    <span><i class="fas fa-clock"></i> ${formatDate(
						comment.createdAt
					)}</span>
                </div>
                <div class="comment-content">
                    ${comment.content}
                </div>
            `;
			}
			container.appendChild(commentElement);
		});
	} else {
		container.innerHTML = `
            <div class="no-comments">
                <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
            </div>
        `;
	}
}

// Thêm bình luận mới
async function addComment(event) {
	event.preventDefault();

	if (!checkAuth()) {
		alert('Vui lòng đăng nhập để bình luận');
		showLoginForm();
		return;
	}

	const content = document.getElementById('commentContent').value;

	if (!content.trim()) {
		showError('Vui lòng nhập nội dung bình luận');
		return;
	}

	try {
		const response = await fetch(
			`${API_URL}/forum/${currentPost._id}/comments`,
			{
				method: 'POST',
				headers: {
					...getAuthHeader(),
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content,
					author: getCurrentUser(),
				}),
			}
		);

		const data = await response.json();

		console.log(data);

		if (response.ok) {
			document.getElementById('commentContent').value = '';
			currentPost.comments.push(data);
			displayComments(currentPost.comments);
			// showSuccess("Đã thêm bình luận thành công");
			//showPostDetail(currentPost._id);
		} else {
			showError(data.message || 'Không thể thêm bình luận');
		}
	} catch (error) {
		console.error('Lỗi khi thêm bình luận:', error);
		showError('Đã xảy ra lỗi khi thêm bình luận');
	}
}

// Lọc bài viết
function filterPosts() {
	const searchTerm = document
		.getElementById('searchPosts')
		.value.toLowerCase();
	const urlParams = new URLSearchParams(window.location.search);
	const category = urlParams.get('category');

	let filteredPosts = currentPosts.filter(
		(post) =>
			post.title.toLowerCase().includes(searchTerm) ||
			post.content.toLowerCase().includes(searchTerm)
	);

	// Lọc theo category nếu có
	if (category) {
		filteredPosts = filteredPosts.filter(
			(post) => post.category === category
		);
	}

	displayPosts(filteredPosts);
}

// Sắp xếp bài viết
function sortPosts() {
	const sortBy = document.getElementById('sortPosts').value;
	const urlParams = new URLSearchParams(window.location.search);
	const category = urlParams.get('category');

	let sortedPosts = [...currentPosts];

	// Lọc theo category nếu có
	if (category) {
		sortedPosts = sortedPosts.filter((post) => post.category === category);
	}

	switch (sortBy) {
		case 'newest':
			sortedPosts.sort(
				(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
			);
			break;
		case 'oldest':
			sortedPosts.sort(
				(a, b) => new Date(a.createdAt) - new Date(b.createdAt)
			);
			break;
		case 'mostComments':
			sortedPosts.sort((a, b) => b.comments.length - a.comments.length);
			break;
	}

	displayPosts(sortedPosts);
}

// Đóng modal
function closeModal(modalId) {
	document.getElementById(modalId).style.display = 'none';
}

// Tải danh sách bài viết khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
	// Lấy category từ URL nếu có
	const urlParams = new URLSearchParams(window.location.search);
	const category = urlParams.get('category');

	if (category) {
		// Nếu có category, cập nhật select box
		const sortSelect = document.getElementById('sortPosts');
		if (sortSelect) {
			sortSelect.value = category;
		}
		// Lọc bài viết theo category
		fetchPosts(category);
	} else {
		// Nếu không có category, lấy tất cả bài viết
		fetchPosts();
	}
});

// Hàm format ngày tháng
function formatDate(dateString) {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
}

// Hàm lấy tên category
function getCategoryName(category) {
	const categories = {
		academic: 'Học tập',
		questions: 'Hỏi đáp',
		events: 'Sự kiện',
		other: 'Khác',
	};
	return categories[category] || 'Khác';
}

// Tạo HTML cho bài viết
function createPostElement(post) {
	const template = document.getElementById('postTemplate');
	const postElement = template.content.cloneNode(true);
	const postDiv = postElement.querySelector('.post');

	// Set post ID
	postDiv.dataset.id = post._id;

	// Điền thông tin tác giả
	postDiv.querySelector('.author-name').textContent = post.author.fullname;
	postDiv.querySelector('.author-id').textContent = post.author.studentId;

	// Điền thông tin bài viết
	postDiv.querySelector('.post-title').textContent = post.title;
	postDiv.querySelector('.post-text').textContent = post.content;

	// Định dạng thời gian
	const postTime = new Date(post.createdAt);
	postDiv.querySelector('.post-time').textContent =
		postTime.toLocaleDateString('vi-VN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	// Hiển thị loại bài viết
	const typeText = {
		discussion: 'Thảo luận',
		question: 'Câu hỏi',
		announcement: 'Thông báo',
	};
	postDiv.querySelector('.post-type').textContent =
		typeText[post.type] || 'Thảo luận';

	// Cập nhật số like và trạng thái
	const likeBtn = postDiv.querySelector('.btn-like');
	const likeCount = likeBtn.querySelector('.like-count');
	likeCount.textContent = post.likeCount || 0;

	if (post.isLiked) {
		likeBtn.classList.add('active');
	}

	// Cập nhật số comment
	const commentCount = postDiv.querySelector('.comment-count');
	commentCount.textContent = post.comments ? post.comments.length : 0;

	// Thêm sự kiện cho nút like
	likeBtn.addEventListener('click', () => toggleLike(post._id));

	// Thêm sự kiện cho nút comment
	const commentBtn = postDiv.querySelector('.btn-comment');
	const commentsSection = postDiv.querySelector('.comments-section');
	commentBtn.addEventListener('click', () => {
		commentsSection.style.display =
			commentsSection.style.display === 'none' ? 'block' : 'none';
	});

	// Hiển thị comments
	const commentsList = postDiv.querySelector('.comments-list');
	if (post.comments && post.comments.length > 0) {
		post.comments.forEach((comment) => {
			const commentDiv = document.createElement('div');
			commentDiv.className = 'comment';
			commentDiv.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${
						comment.author.fullname
					}</span>
                    <span class="comment-time">${new Date(
						comment.createdAt
					).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
            `;
			commentsList.appendChild(commentDiv);
		});
	}

	// Xử lý form comment
	const commentForm = postDiv.querySelector('.comment-form');
	commentForm.addEventListener('submit', (e) => {
		e.preventDefault();
		const input = commentForm.querySelector('input');
		addComment(post._id, input.value);
		input.value = '';
	});

	const deleteBtn = postDiv.querySelector('.btn-delete');
	deleteBtn.style.display = 'none';

	// Hiển thị nút xóa nếu là tác giả
	// const currentUser = getCurrentUser();
	// if (
	//     currentUser &&
	//     (currentUser.id === post.author._id || currentUser.role === "admin")
	// ) {
	//     const deleteBtn = postDiv.querySelector(".btn-delete");
	//     deleteBtn.style.display = "none";
	//     console.log(deleteBtn);
	//     deleteBtn.style.display = "flex";
	//     deleteBtn.addEventListener("click", () => deletePost(post._id));
	// }

	return postDiv;
}

// Like/Unlike bài viết
async function toggleLike(postId) {
	if (!checkAuth()) {
		showError('Vui lòng đăng nhập để thực hiện thao tác này');
		return;
	}

	try {
		const response = await fetch(`${API_URL}/forum/${postId}/like`, {
			method: 'POST',
			headers: getAuthHeader(),
		});

		if (!response.ok) {
			throw new Error('Không thể thực hiện thao tác');
		}

		const data = await response.json();

		// Cập nhật UI
		const post = document.querySelector(`[data-id="${postId}"]`);
		if (!post) return;

		const likeBtn = post.querySelector('.btn-like');
		const likeCount = likeBtn.querySelector('.like-count');

		likeCount.textContent = data.likes.length;

		if (data.isLiked) {
			likeBtn.classList.add('active');
		} else {
			likeBtn.classList.remove('active');
		}
	} catch (error) {
		console.error('Lỗi:', error);
		showError('Không thể thực hiện thao tác');
	}
}

// Xóa bình luận
async function deleteComment(commentId) {
	if (!checkAuth()) {
		showError('Vui lòng đăng nhập để thực hiện thao tác này');
		return;
	}

	if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

	try {
		const response = await fetch(
			`${API_URL}/forum/${currentPost._id}/comments/${commentId}`,
			{
				method: 'DELETE',
				headers: getAuthHeader(),
			}
		);

		if (response.ok) {
			currentPost.comments = currentPost.comments.filter(
				(comment) => comment._id !== commentId
			);
			displayComments(currentPost.comments);
			showSuccess('Đã xóa bình luận thành công');
		} else {
			showError('Không thể xóa bình luận');
		}
	} catch (error) {
		console.error('Lỗi khi xóa bình luận:', error);
		showError('Đã xảy ra lỗi khi xóa bình luận');
	}
}
