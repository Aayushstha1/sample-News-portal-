/**
 * UI rendering — connects mock DB to Bootstrap templates
 */

function formatDate(iso) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function createArticleCard(article) {
  const stats = DB.getStats(article.id);
  const bookmarked = DB.isBookmarked(CURRENT_USER_ID, article.id);
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';

  col.innerHTML = `
    <div class="card article-card shadow-sm h-100">
      <div class="card-img-wrap">
        <img src="${article.featured_image}" class="card-img-top" alt="${article.title}">
        ${article.is_breaking ? '<div class="breaking-overlay"><span class="badge-breaking">BREAKING</span></div>' : ''}
        <span class="badge views-badge position-absolute bottom-0 end-0 m-2">
          <i class="bi bi-eye me-1"></i>${stats.views_count}
        </span>
      </div>
      <div class="card-body d-flex flex-column">
        <span class="badge bg-light text-dark category-pill align-self-start mb-2">
          ${DB.getCategory(article.category_id).name}
        </span>
        <h5 class="card-title">
          <a href="article.html?slug=${article.slug}" class="text-decoration-none text-dark stretched-link">
            ${article.title}
          </a>
        </h5>
        <p class="card-text text-muted small flex-grow-1">${article.excerpt}</p>
        <div class="d-flex align-items-center justify-content-between mt-2 position-relative" style="z-index:2">
          <small class="text-muted">
            <i class="bi bi-person me-1"></i>${DB.getAuthorName(article.author_id)}
          </small>
          <button class="btn btn-sm bookmark-btn ${bookmarked ? 'bookmarked' : 'btn-outline-secondary'}"
                  data-article-id="${article.id}" onclick="handleCardBookmark(event, ${article.id})">
            <i class="bi bi-bookmark${bookmarked ? '-fill' : ''}"></i>
          </button>
        </div>
      </div>
    </div>`;
  return col;
}

function handleCardBookmark(event, articleId) {
  event.preventDefault();
  event.stopPropagation();
  toggleBookmarkUI(articleId, event.currentTarget);
}

function toggleBookmarkUI(articleId, btn) {
  const result = DB.toggleBookmark(CURRENT_USER_ID, articleId);
  const bookmarked = result.bookmarked;

  if (btn) {
    btn.classList.toggle('bookmarked', bookmarked);
    btn.classList.toggle('btn-outline-secondary', !bookmarked);
    const icon = btn.querySelector('i');
    icon.className = `bi bi-bookmark${bookmarked ? '-fill' : ''}`;
    const label = btn.querySelector('span');
    if (label) label.textContent = bookmarked ? 'Saved' : 'Bookmark';
  }

  showToast(bookmarked ? 'Article bookmarked!' : 'Bookmark removed.');
  return result;
}

function renderHomePage() {
  const published = DB.getPublishedArticles();
  const grid = document.getElementById('article-grid');
  const empty = document.getElementById('empty-state');
  const filter = document.getElementById('category-filter');

  // Populate category filter
  DB.getCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    filter.appendChild(opt);
  });

  function renderArticles(categoryId = '') {
    grid.innerHTML = '';
    let articles = published;
    if (categoryId) {
      articles = articles.filter(a => a.category_id === parseInt(categoryId));
    }

    if (articles.length === 0) {
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    articles.forEach(a => grid.appendChild(createArticleCard(a)));
  }

  filter.addEventListener('change', () => renderArticles(filter.value));
  renderArticles();

  // Breaking ticker
  const breaking = DB.getBreakingArticle();
  if (breaking) {
    document.getElementById('breaking-ticker').classList.remove('d-none');
    document.getElementById('breaking-text').textContent = breaking.title;
    document.getElementById('breaking-text').parentElement.style.cursor = 'pointer';
    document.getElementById('breaking-text').parentElement.onclick = () => {
      window.location.href = `article.html?slug=${breaking.slug}`;
    };
  }
}

function renderArticlePage(slug) {
  const article = DB.getArticleBySlug(slug);
  const notFound = document.getElementById('not-found');
  const content = document.getElementById('article-content');

  if (!article) {
    notFound.classList.remove('d-none');
    return;
  }

  content.classList.remove('d-none');
  document.title = `${article.title} — NewsHub`;

  // Increment views (F('views_count') + 1)
  const stats = DB.incrementViews(article.id);

  document.getElementById('article-title').textContent = article.title;
  document.getElementById('article-author').textContent = DB.getAuthorName(article.author_id);
  document.getElementById('article-category').textContent = DB.getCategory(article.category_id).name;
  document.getElementById('breadcrumb-category').textContent = DB.getCategory(article.category_id).name;
  document.getElementById('breadcrumb-title').textContent = article.title;
  document.getElementById('article-views').textContent = stats.views_count;
  document.getElementById('article-last-viewed').textContent = `Last viewed: ${formatDate(stats.last_viewed_at)}`;
  document.getElementById('article-image').src = article.featured_image;
  document.getElementById('article-image').alt = article.title;
  document.getElementById('article-excerpt').textContent = article.excerpt;
  document.getElementById('article-body').innerHTML = article.content;

  document.getElementById('stat-article-id').textContent = stats.article_id;
  document.getElementById('stat-views').textContent = stats.views_count;
  document.getElementById('stat-last-viewed').textContent = formatDate(stats.last_viewed_at);

  if (article.is_breaking) {
    document.getElementById('breaking-badge').classList.remove('d-none');
  }

  const btn = document.getElementById('bookmark-btn');
  btn.dataset.articleId = article.id;
  const bookmarked = DB.isBookmarked(CURRENT_USER_ID, article.id);
  updateBookmarkButton(btn, bookmarked);
  btn.onclick = () => {
    const result = toggleBookmarkUI(article.id, btn);
    updateBookmarkButton(btn, result.bookmarked);
  };
}

function updateBookmarkButton(btn, bookmarked) {
  btn.classList.toggle('bookmarked', bookmarked);
  btn.classList.toggle('btn-outline-secondary', !bookmarked);
  btn.querySelector('i').className = `bi bi-bookmark${bookmarked ? '-fill' : ''}`;
  btn.querySelector('span').textContent = bookmarked ? 'Saved' : 'Bookmark';
}

function renderBookmarksPage() {
  const bookmarks = DB.getUserBookmarks(CURRENT_USER_ID);
  const list = document.getElementById('bookmarks-list');
  const empty = document.getElementById('bookmarks-empty');
  const count = document.getElementById('bookmark-count');

  count.textContent = `${bookmarks.length} saved`;

  if (bookmarks.length === 0) {
    empty.classList.remove('d-none');
    return;
  }

  empty.classList.add('d-none');
  list.innerHTML = bookmarks.map(b => `
    <div class="card border-0 shadow-sm mb-3 bookmark-item">
      <div class="card-body d-flex align-items-center gap-3">
        <img src="${b.article.featured_image}" alt="">
        <div class="flex-grow-1">
          <span class="badge bg-light text-dark category-pill">${b.category.name}</span>
          <h5 class="mb-1 mt-1">
            <a href="article.html?slug=${b.article.slug}" class="text-decoration-none">${b.article.title}</a>
          </h5>
          <small class="text-muted">
            <i class="bi bi-person me-1"></i>${b.author_name}
            &nbsp;&middot;&nbsp;
            Saved ${formatDate(b.created_at)}
          </small>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeBookmark(${b.article_id}, this)">
          <i class="bi bi-trash"></i> Remove
        </button>
      </div>
    </div>
  `).join('');
}

function removeBookmark(articleId, btn) {
  DB.toggleBookmark(CURRENT_USER_ID, articleId);
  btn.closest('.bookmark-item').remove();
  const remaining = DB.getUserBookmarks(CURRENT_USER_ID).length;
  document.getElementById('bookmark-count').textContent = `${remaining} saved`;
  if (remaining === 0) {
    document.getElementById('bookmarks-empty').classList.remove('d-none');
  }
  showToast('Bookmark removed.', 'secondary');
}
