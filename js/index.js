function goToForum(category) {
    window.location.href = `forum.html?category=${category}`;
}

const categories = {
    academic: [],
    questions: [],
    events: [],
    other: []
};