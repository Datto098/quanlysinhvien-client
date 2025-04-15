// Thêm loading bar vào DOM
document.body.insertAdjacentHTML(
    "afterbegin",
    '<div class="loading-bar"></div>'
);
const loadingBar = document.querySelector(".loading-bar");

// Hiển thị loading
function showLoading() {
    loadingBar.classList.add("active");
}

// Ẩn loading
function hideLoading() {
    loadingBar.classList.remove("active");
}

// Thêm loading cho tất cả các request fetch
const originalFetch = window.fetch;
window.fetch = async function (...args) {
    showLoading();
    try {
        const response = await originalFetch(...args);
        hideLoading();
        return response;
    } catch (error) {
        hideLoading();
        throw error;
    }
};
