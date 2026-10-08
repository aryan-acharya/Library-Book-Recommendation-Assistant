// Real client-side persistence and analytics tracking for LibraAI

const FAVORITES_KEY = 'libraai_favorites';
const RECENT_KEY = 'libraai_recent';
const STUDY_KEY = 'libraai_study_plans';
const ACTIVITY_KEY = 'libraai_activity_log';
const NOTIFICATIONS_KEY = 'libraai_notifications';

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('libraai_store_update', { detail: { key } }));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

/* ================= Notifications ================= */
export function getNotifications() {
  const notifs = safeGet(NOTIFICATIONS_KEY, [
    {
      id: 'init-1',
      title: 'Knowledge Base Loaded',
      message: '10,538 books loaded with rule-based reasoning and Hill Climbing optimization.',
      time: 'Just now',
      read: false,
    },
    {
      id: 'init-2',
      title: 'Welcome to LibraAI',
      message: 'Explore recommendations, search the catalog, or inspect AI reasoning.',
      time: 'Just now',
      read: false,
    },
  ]);
  return notifs;
}

export function addNotification(title, message) {
  const notifs = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}`,
    title,
    message,
    time: 'Just now',
    read: false,
  };
  safeSet(NOTIFICATIONS_KEY, [newNotif, ...notifs.slice(0, 19)]);
}

export function markNotificationsRead() {
  const notifs = getNotifications().map((n) => ({ ...n, read: true }));
  safeSet(NOTIFICATIONS_KEY, notifs);
}

/* ================= Favorites ================= */
export function getFavorites() {
  return safeGet(FAVORITES_KEY, []);
}

export function isFavorite(bookId) {
  const favs = getFavorites();
  return favs.some((b) => b.id === bookId);
}

export function toggleFavorite(book) {
  if (!book || !book.id) return false;
  const favs = getFavorites();
  const exists = favs.some((b) => b.id === book.id);
  let updated;
  if (exists) {
    updated = favs.filter((b) => b.id !== book.id);
    trackActivity('favorite_removed', { bookId: book.id, title: book.title });
  } else {
    updated = [book, ...favs];
    trackActivity('favorite_added', {
      bookId: book.id,
      title: book.title,
      genre: book.genre,
      mood: book.mood,
      score: book.score,
    });
    addNotification('Added to Favorites', `“${book.title}” was added to your favorites.`);
  }
  safeSet(FAVORITES_KEY, updated);
  return !exists;
}

export function removeFavorite(bookId) {
  const favs = getFavorites();
  const updated = favs.filter((b) => b.id !== bookId);
  safeSet(FAVORITES_KEY, updated);
  trackActivity('favorite_removed', { bookId });
}

/* ================= Recently Viewed ================= */
export function getRecentlyViewed() {
  return safeGet(RECENT_KEY, []);
}

export function addRecentlyViewed(book) {
  if (!book || !book.id) return;
  const list = getRecentlyViewed().filter((b) => b.id !== book.id);
  const updated = [book, ...list].slice(0, 20);
  safeSet(RECENT_KEY, updated);
  trackActivity('book_viewed', {
    bookId: book.id,
    title: book.title,
    genre: book.genre,
    mood: book.mood,
  });
}

/* ================= Study Companion Plans ================= */
export function getStudyPlans() {
  return safeGet(STUDY_KEY, []);
}

export function saveStudyPlan(plan) {
  const plans = getStudyPlans().filter((p) => p.bookId !== plan.bookId);
  safeSet(STUDY_KEY, [plan, ...plans]);
  trackActivity('study_plan_created', { bookId: plan.bookId, title: plan.title, days: plan.days });
  addNotification('Study Plan Created', `Reading schedule created for “${plan.title}”.`);
}

export function toggleStudyDay(bookId, dayNum) {
  const plans = getStudyPlans();
  const updated = plans.map((p) => {
    if (p.bookId !== bookId) return p;
    const completedDays = new Set(p.completedDays || []);
    if (completedDays.has(dayNum)) {
      completedDays.delete(dayNum);
    } else {
      completedDays.add(dayNum);
    }
    return {
      ...p,
      completedDays: Array.from(completedDays),
      lastUpdated: new Date().toISOString(),
    };
  });
  safeSet(STUDY_KEY, updated);
}

export function deleteStudyPlan(bookId) {
  const plans = getStudyPlans().filter((p) => p.bookId !== bookId);
  safeSet(STUDY_KEY, plans);
}

/* ================= Reading Shelves (Currently Reading & Completed) ================= */
const SHELVED_BOOKS_KEY = 'libraai_shelved_books';

export function getShelvedBooks() {
  return safeGet(SHELVED_BOOKS_KEY, []);
}

export function setBookShelf(book, shelf) {
  if (!book || !book.id) return;
  const list = getShelvedBooks().filter((item) => item.bookId !== book.id);
  if (shelf === 'reading' || shelf === 'completed') {
    list.unshift({
      bookId: book.id,
      book,
      shelf,
      updatedAt: new Date().toISOString(),
    });
    addNotification('Library Updated', `“${book.title}” moved to ${shelf === 'reading' ? 'Currently Reading' : 'Completed'}.`);
  }
  safeSet(SHELVED_BOOKS_KEY, list);
}

export function removeBookShelf(bookId) {
  const list = getShelvedBooks().filter((item) => item.bookId !== bookId);
  safeSet(SHELVED_BOOKS_KEY, list);
}

export function getCurrentlyReading() {
  const shelved = getShelvedBooks()
    .filter((s) => s.shelf === 'reading')
    .map((s) => s.book);

  // Derive from active study plans
  const studyPlans = getStudyPlans();
  const fromPlans = studyPlans
    .filter((p) => (p.completedDays || []).length < (p.days || 1))
    .map((p) => ({
      id: p.bookId,
      title: p.title,
      author: p.author,
      image: p.image,
      genre: p.genre,
      readingLevel: 'Intermediate',
      availability: 'Available',
      score: 4.2,
      studyPlan: p,
    }));

  // Deduplicate
  const map = new Map();
  [...fromPlans, ...shelved].forEach((b) => {
    if (b && b.id && !map.has(b.id)) map.set(b.id, b);
  });
  return Array.from(map.values());
}

export function getCompletedBooks() {
  const shelved = getShelvedBooks()
    .filter((s) => s.shelf === 'completed')
    .map((s) => s.book);

  // Derive from finished study plans
  const studyPlans = getStudyPlans();
  const fromPlans = studyPlans
    .filter((p) => p.days > 0 && (p.completedDays || []).length >= p.days)
    .map((p) => ({
      id: p.bookId,
      title: p.title,
      author: p.author,
      image: p.image,
      genre: p.genre,
      readingLevel: 'Intermediate',
      availability: 'Available',
      score: 4.5,
      studyPlan: p,
    }));

  const map = new Map();
  [...fromPlans, ...shelved].forEach((b) => {
    if (b && b.id && !map.has(b.id)) map.set(b.id, b);
  });
  return Array.from(map.values());
}

export function isCurrentlyReading(bookId) {
  return getCurrentlyReading().some((b) => b.id === bookId);
}

export function isCompleted(bookId) {
  return getCompletedBooks().some((b) => b.id === bookId);
}

/* ================= Activity Tracking & Real Analytics ================= */
export function trackActivity(type, data = {}) {
  const log = safeGet(ACTIVITY_KEY, []);
  const entry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
  };
  safeSet(ACTIVITY_KEY, [entry, ...log.slice(0, 150)]);
}

export function getAnalytics() {
  const log = safeGet(ACTIVITY_KEY, []);
  const favorites = getFavorites();
  const studyPlans = getStudyPlans();
  const recent = getRecentlyViewed();

  const recEvents = log.filter((e) => e.type === 'recommendations_generated');
  const viewEvents = log.filter((e) => e.type === 'book_viewed');
  const searchEvents = log.filter((e) => e.type === 'search_performed');

  const hasActivity =
    log.length > 0 || favorites.length > 0 || recent.length > 0 || studyPlans.length > 0;

  // Genre breakdown from favorites & viewed books
  const genreCounts = {};
  [...favorites, ...recent].forEach((b) => {
    if (b.genre && b.genre !== 'Unknown') {
      genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
    }
  });

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({ genre, count }));

  // Mood breakdown
  const moodCounts = {};
  [...favorites, ...recent].forEach((b) => {
    if (b.mood && b.mood !== 'Neutral') {
      moodCounts[b.mood] = (moodCounts[b.mood] || 0) + 1;
    }
  });

  const sortedMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));

  // Average saved rating
  let avgRating = 0;
  if (favorites.length > 0) {
    const total = favorites.reduce((sum, b) => sum + (Number(b.score) || 0), 0);
    avgRating = Number((total / favorites.length).toFixed(2));
  }

  // Study plans overall progress
  let totalTargetDays = 0;
  let totalCompletedDays = 0;
  studyPlans.forEach((p) => {
    totalTargetDays += p.days || 1;
    totalCompletedDays += (p.completedDays || []).length;
  });

  const readingProgressPct =
    totalTargetDays > 0 ? Math.round((totalCompletedDays / totalTargetDays) * 100) : 0;

  return {
    hasActivity,
    totalRecommendations: recEvents.length,
    booksViewed: Math.max(recent.length, viewEvents.length),
    favoritesCount: favorites.length,
    searchesPerformed: searchEvents.length,
    favoriteGenres: sortedGenres,
    favoriteMoods: sortedMoods,
    averageSavedRating: avgRating,
    studyPlansCount: studyPlans.length,
    readingProgressPct,
    totalCompletedDays,
    totalTargetDays,
  };
}
