// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const booksContainer = document.getElementById('books-container');
const loadingElement = document.getElementById('loading');
const noResultsElement = document.getElementById('no-results');
const categoryItems = document.querySelectorAll('.categories li');
const bookModal = document.getElementById('book-modal');
const modalBookCover = document.getElementById('modal-book-cover');
const modalBookTitle = document.getElementById('modal-book-title');
const modalBookAuthors = document.getElementById('modal-book-authors');
const modalBookPublished = document.getElementById('modal-book-published');
const modalBookPages = document.getElementById('modal-book-pages');
const modalBookRating = document.getElementById('modal-book-rating');
const modalBookDescription = document.getElementById('modal-book-description');
const previewLink = document.getElementById('preview-link');
const addToReadingListBtn = document.getElementById('add-to-reading-list');
const readingListBtn = document.getElementById('reading-list-btn');
const readingListCount = document.getElementById('reading-list-count');
const readingListModal = document.getElementById('reading-list-modal');
const readingListContainer = document.getElementById('reading-list-container');
const emptyReadingList = document.getElementById('empty-reading-list');
const closeButtons = document.querySelectorAll('.close');
const themeToggle = document.getElementById('checkbox');

// Variables
let currentCategory = 'fiction';
let currentSearch = '';
let selectedBook = null;
let readingList = JSON.parse(localStorage.getItem('readingList')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.checked = true;
        }
    }

    // Load initial books
    fetchBooks(currentCategory);
    
    // Update reading list count
    updateReadingListCount();
});

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

categoryItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update active category
        categoryItems.forEach(cat => cat.classList.remove('active'));
        item.classList.add('active');
        
        // Fetch books for the selected category
        currentCategory = item.getAttribute('data-category');
        currentSearch = '';
        searchInput.value = '';
        fetchBooks(currentCategory);
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        bookModal.classList.remove('show');
        readingListModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === bookModal || e.target === readingListModal) {
        bookModal.classList.remove('show');
        readingListModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

addToReadingListBtn.addEventListener('click', () => {
    if (selectedBook) {
        // Check if book is already in reading list
        const isInList = readingList.some(book => book.id === selectedBook.id);
        
        if (!isInList) {
            readingList.push(selectedBook);
            localStorage.setItem('readingList', JSON.stringify(readingList));
            updateReadingListCount();
            
            // Update button text
            addToReadingListBtn.innerHTML = '<i class="fas fa-check"></i> Added to Reading List';
            setTimeout(() => {
                addToReadingListBtn.innerHTML = '<i class="fas fa-bookmark"></i> Add to Reading List';
            }, 2000);
        } else {
            addToReadingListBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Already in Reading List';
            setTimeout(() => {
                addToReadingListBtn.innerHTML = '<i class="fas fa-bookmark"></i> Add to Reading List';
            }, 2000);
        }
    }
});

readingListBtn.addEventListener('click', () => {
    renderReadingList();
    readingListModal.classList.add('show');
    document.body.style.overflow = 'hidden';
});

themeToggle.addEventListener('change', function(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Functions
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        currentSearch = query;
        fetchBooks(currentCategory, query);
    }
}

function fetchBooks(category, query = '') {
    // Show loading
    booksContainer.innerHTML = '';
    loadingElement.classList.remove('hidden');
    noResultsElement.classList.add('hidden');
    
    // Construct API URL
    let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=`;
    
    if (query) {
        apiUrl += `${encodeURIComponent(query)}`;
    } else {
        apiUrl += `subject:${encodeURIComponent(category)}`;
    }
    
    apiUrl += `&maxResults=40`;
    
    // Fetch books
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Hide loading
            loadingElement.classList.add('hidden');
            
            if (data.items && data.items.length > 0) {
                renderBooks(data.items);
            } else {
                noResultsElement.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error fetching books:', error);
            loadingElement.classList.add('hidden');
            noResultsElement.classList.remove('hidden');
        });
}

function renderBooks(books) {
    booksContainer.innerHTML = '';
    
    books.forEach(book => {
        const bookInfo = book.volumeInfo;
        const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const title = bookInfo.title || 'Unknown Title';
        const authors = bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author';
        const rating = bookInfo.averageRating || 0;
        
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.innerHTML = `
            <div class="book-cover">
                <img src="${thumbnail}" alt="${title}">
            </div>
            <div class="book-info">
                <h3 class="book-title">${title}</h3>
                <p class="book-author">${authors}</p>
                <div class="book-rating">
                    <div class="stars">
                        ${generateStars(rating)}
                    </div>
                    <span>${rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
                </div>
            </div>
        `;
        
        bookCard.addEventListener('click', () => {
            openBookModal(book);
        });
        
        booksContainer.appendChild(bookCard);
    });
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star star"></i>';
        } else if (i === fullStars && halfStar) {
            stars += '<i class="fas fa-star-half-alt star"></i>';
        } else {
            stars += '<i class="far fa-star star"></i>';
        }
    }
    
    return stars;
}

function openBookModal(book) {
    selectedBook = book;
    const bookInfo = book.volumeInfo;
    
    // Set modal content
    modalBookCover.src = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
    modalBookTitle.textContent = bookInfo.title || 'Unknown Title';
    modalBookAuthors.textContent = bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author';
    modalBookPublished.textContent = `Published: ${bookInfo.publishedDate || 'Unknown'}`;
    modalBookPages.textContent = bookInfo.pageCount ? `${bookInfo.pageCount} pages` : '';
    
    // Rating
    const rating = bookInfo.averageRating || 0;
    modalBookRating.textContent = rating > 0 ? `${rating.toFixed(1)}/5` : 'No rating';
    document.querySelector('.stars').innerHTML = generateStars(rating);
    
    // Description
    modalBookDescription.innerHTML = bookInfo.description || 'No description available.';
    
    // Preview link
    if (bookInfo.previewLink) {
        previewLink.href = bookInfo.previewLink;
        previewLink.classList.remove('hidden');
    } else {
        previewLink.classList.add('hidden');
    }
    
    // Check if book is in reading list
    const isInList = readingList.some(item => item.id === book.id);
    if (isInList) {
        addToReadingListBtn.innerHTML = '<i class="fas fa-bookmark"></i> Already in Reading List';
    } else {
        addToReadingListBtn.innerHTML = '<i class="fas fa-bookmark"></i> Add to Reading List';
    }
    
    // Show modal
    bookModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function renderReadingList() {
    readingListContainer.innerHTML = '';
    
    if (readingList.length === 0) {
        emptyReadingList.classList.remove('hidden');
        return;
    }
    
    emptyReadingList.classList.add('hidden');
    
    readingList.forEach(book => {
        const bookInfo = book.volumeInfo;
        const thumbnail = bookInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover';
        const title = bookInfo.title || 'Unknown Title';
        const authors = bookInfo.authors ? bookInfo.authors.join(', ') : 'Unknown Author';
        
        const listItem = document.createElement('div');
        listItem.className = 'reading-list-item';
        listItem.innerHTML = `
            <img src="${thumbnail}" alt="${title}">
            <div class="reading-list-info">
                <h4 class="reading-list-title">${title}</h4>
                <p class="reading-list-author">${authors}</p>
                <div class="remove-from-list" data-id="${book.id}">
                    <i class="fas fa-trash-alt"></i> Remove
                </div>
            </div>
        `;
        
        readingListContainer.appendChild(listItem);
        
        // Add event listener to remove button
        const removeBtn = listItem.querySelector('.remove-from-list');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = removeBtn.getAttribute('data-id');
            removeFromReadingList(bookId);
        });
        
        // Add event listener to open book modal when clicking on the item
        listItem.addEventListener('click', () => {
            bookModal.classList.add('show');
            readingListModal.classList.remove('show');
            openBookModal(book);
        });
    });
}

function removeFromReadingList(bookId) {
    readingList = readingList.filter(book => book.id !== bookId);
    localStorage.setItem('readingList', JSON.stringify(readingList));
    updateReadingListCount();
    renderReadingList();
}

function updateReadingListCount() {
    readingListCount.textContent = readingList.length;
}

