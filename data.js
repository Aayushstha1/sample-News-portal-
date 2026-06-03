/**
 * Mock database — mirrors your three Django tables:
 *   Articles, ArticleStats, Bookmarks
 *
 * In Django these live in PostgreSQL/SQLite.
 * Here we use JS objects + localStorage for persistence.
 */

const CURRENT_USER_ID = 1;

const CATEGORIES = {
  1: { id: 1, name: 'Politics' },
  2: { id: 2, name: 'Technology' },
  3: { id: 3, name: 'Sports' },
  4: { id: 4, name: 'World' },
};

const AUTHORS = {
  1: { id: 1, username: 'jane_editor' },
  2: { id: 2, username: 'mike_author' },
  // id 3 was deleted — article 4 has author_id = null (SET NULL)
};

/** Articles table */
const ARTICLES = [
  {
    id: 1,
    title: 'Breaking News Today',
    slug: 'breaking-news-today',
    excerpt: 'A major development shakes the political landscape as leaders respond to overnight events.',
    content: `<p>In an unprecedented turn of events, officials gathered for an emergency session late last night. Sources close to the matter say the decision could reshape policy for years to come.</p>
<p>Witnesses reported a tense atmosphere inside the chamber, with opposition leaders calling for immediate transparency. The public awaits an official statement expected within hours.</p>
<p>Analysts suggest this marks a pivotal moment in the ongoing debate, with implications reaching far beyond national borders.</p>`,
    featured_image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
    author_id: 1,
    category_id: 1,
    status: 'Published',
    is_breaking: true,
    created_at: '2026-06-01T08:00:00Z',
  },
  {
    id: 2,
    title: 'AI Revolution Changes How We Work',
    slug: 'ai-revolution-changes-how-we-work',
    excerpt: 'New tools are transforming offices worldwide — but not without growing pains.',
    content: `<p>Artificial intelligence has moved from science fiction to daily workflow in under two years. Companies report productivity gains of 30% or more in document-heavy roles.</p>
<p>However, workers express concern about job displacement and the need for retraining programs. Industry leaders are calling for balanced regulation.</p>`,
    featured_image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    author_id: 2,
    category_id: 2,
    status: 'Published',
    is_breaking: false,
    created_at: '2026-06-02T10:30:00Z',
  },
  {
    id: 3,
    title: 'Championship Final Ends in Dramatic Overtime',
    slug: 'championship-final-ends-in-dramatic-overtime',
    excerpt: 'The underdogs clinch victory with a last-second three-pointer.',
    content: `<p>Forty-eight minutes weren't enough as the championship game headed into double overtime. Fans erupted when the visiting team sank a buzzer-beater from beyond the arc.</p>
<p>The MVP finished with 42 points, etching his name into franchise history.</p>`,
    featured_image: 'https://images.unsplash.com/photo-1461896836934- voices?w=800&q=80',
    author_id: 2,
    category_id: 3,
    status: 'Published',
    is_breaking: false,
    created_at: '2026-06-02T22:00:00Z',
  },
  {
    id: 4,
    title: 'Global Summit Reaches Climate Agreement',
    slug: 'global-summit-reaches-climate-agreement',
    excerpt: 'Nations commit to ambitious emissions targets after marathon negotiations.',
    content: `<p>After three days of intense talks, delegates emerged with a framework that exceeds previous commitments. Environmental groups cautiously welcomed the deal while urging faster implementation.</p>
<p>The agreement includes funding mechanisms for developing nations and a review cycle every five years.</p>`,
    featured_image: 'https://images.unsplash.com/photo-1569163139591-7d772b282aeb?w=800&q=80',
    author_id: null, // deleted author — template shows "Staff Reporter"
    category_id: 4,
    status: 'Published',
    is_breaking: false,
    created_at: '2026-05-30T14:00:00Z',
  },
  {
    id: 5,
    title: 'Secret Draft Article — Should NOT Appear',
    slug: 'secret-draft-article',
    excerpt: 'This is a draft. Public users must never see this.',
    content: '<p>Draft content hidden from public.</p>',
    featured_image: 'https://images.unsplash.com/photo-1495020689067-6b7df6657950?w=800&q=80',
    author_id: 1,
    category_id: 1,
    status: 'Draft',
    is_breaking: false,
    created_at: '2026-06-03T09:00:00Z',
  },
  {
    id: 6,
    title: 'Pending Review: Upcoming Policy Change',
    slug: 'pending-review-upcoming-policy-change',
    excerpt: 'Waiting for editor approval before going live.',
    content: '<p>Pending article content.</p>',
    featured_image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    author_id: 2,
    category_id: 1,
    status: 'Pending',
    is_breaking: false,
    created_at: '2026-06-03T11:00:00Z',
  },
];

// Fix sports image URL (typo in unsplash id)
ARTICLES[2].featured_image = 'https://images.unsplash.com/photo-1461896836934-ffe607ba7951?w=800&q=80';

/** ArticleStats table — one row per article (created on first save) */
function getDefaultStats() {
  const stats = {};
  ARTICLES.forEach(a => {
    stats[a.id] = {
      article_id: a.id,
      views_count: Math.floor(Math.random() * 500) + 50,
      last_viewed_at: null,
    };
  });
  return stats;
}

/** Bookmarks table — unique (user_id, article_id) */
function getDefaultBookmarks() {
  return [
    { id: 1, user_id: 1, article_id: 2, created_at: '2026-06-02T15:00:00Z' },
  ];
}

// Persistence layer (simulates DB)
const Storage = {
  STATS_KEY: 'newshub_stats',
  BOOKMARKS_KEY: 'newshub_bookmarks',

  getStats() {
    const raw = localStorage.getItem(this.STATS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults = getDefaultStats();
    this.saveStats(defaults);
    return defaults;
  },

  saveStats(stats) {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  },

  getBookmarks() {
    const raw = localStorage.getItem(this.BOOKMARKS_KEY);
    if (raw) return JSON.parse(raw);
    const defaults = getDefaultBookmarks();
    this.saveBookmarks(defaults);
    return defaults;
  },

  saveBookmarks(bookmarks) {
    localStorage.setItem(this.BOOKMARKS_KEY, JSON.stringify(bookmarks));
  },
};

// Helpers — mirror Django ORM patterns
const DB = {
  getPublishedArticles() {
    return ARTICLES.filter(a => a.status === 'Published');
  },

  getArticleBySlug(slug) {
    return ARTICLES.find(a => a.slug === slug && a.status === 'Published') || null;
  },

  getAuthorName(authorId) {
    if (!authorId) return 'Staff Reporter';
    return AUTHORS[authorId]?.username || 'Staff Reporter';
  },

  getCategory(categoryId) {
    return CATEGORIES[categoryId] || { name: 'Uncategorized' };
  },

  getStats(articleId) {
    const stats = Storage.getStats();
    return stats[articleId] || { article_id: articleId, views_count: 0, last_viewed_at: null };
  },

  /** Simulates F('views_count') + 1 at DB level */
  incrementViews(articleId) {
    const stats = Storage.getStats();
    if (!stats[articleId]) {
      stats[articleId] = { article_id: articleId, views_count: 0, last_viewed_at: null };
    }
    stats[articleId].views_count += 1;
    stats[articleId].last_viewed_at = new Date().toISOString();
    Storage.saveStats(stats);
    return stats[articleId];
  },

  /** get_or_create toggle for bookmarks */
  toggleBookmark(userId, articleId) {
    let bookmarks = Storage.getBookmarks();
    const existing = bookmarks.find(b => b.user_id === userId && b.article_id === articleId);

    if (existing) {
      bookmarks = bookmarks.filter(b => b.id !== existing.id);
      Storage.saveBookmarks(bookmarks);
      return { bookmarked: false, created: false };
    }

    const newBookmark = {
      id: Date.now(),
      user_id: userId,
      article_id: articleId,
      created_at: new Date().toISOString(),
    };
    bookmarks.push(newBookmark);
    Storage.saveBookmarks(bookmarks);
    return { bookmarked: true, created: true };
  },

  isBookmarked(userId, articleId) {
    return Storage.getBookmarks().some(b => b.user_id === userId && b.article_id === articleId);
  },

  /** select_related('article', 'article__author', 'article__category') */
  getUserBookmarks(userId) {
    return Storage.getBookmarks()
      .filter(b => b.user_id === userId)
      .map(b => {
        const article = ARTICLES.find(a => a.id === b.article_id);
        if (!article || article.status !== 'Published') return null;
        return {
          ...b,
          article,
          author_name: this.getAuthorName(article.author_id),
          category: this.getCategory(article.category_id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getBreakingArticle() {
    return this.getPublishedArticles().find(a => a.is_breaking) || null;
  },

  getCategories() {
    return Object.values(CATEGORIES);
  },
};
