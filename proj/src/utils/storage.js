const PREFIX = 'ha_';

export function getItem(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { value, expireAt } = JSON.parse(raw);
    if (expireAt && Date.now() > expireAt) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setItem(key, value, ttlMs = 0) {
  const data = { value };
  if (ttlMs > 0) data.expireAt = Date.now() + ttlMs;
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function removeItem(key) {
  localStorage.removeItem(PREFIX + key);
}

export function getCommunityList() {
  return getItem('community_list') || [];
}

export function setCommunityList(list) {
  setItem('community_list', list, 24 * 60 * 60 * 1000);
}

export function getSearchHistory() {
  return getItem('search_history') || [];
}

export function addSearchHistory(keyword) {
  const history = getSearchHistory();
  const filtered = [keyword, ...history.filter((k) => k !== keyword)].slice(0, 20);
  setItem('search_history', filtered);
}

export function getRecentViews() {
  return getItem('recent_views') || [];
}

export function addRecentView(communityId, name) {
  const views = getRecentViews();
  const filtered = [{ communityId, name, viewedAt: new Date().toISOString() },
    ...views.filter((v) => v.communityId !== communityId)].slice(0, 10);
  setItem('recent_views', filtered);
}

export function getFavorites() {
  return getItem('favorites') || [];
}

export function addFavorite(communityId, name, avgPrice, district, subDistrict) {
  const favs = getFavorites();
  if (!favs.find((f) => f.communityId === communityId)) {
    favs.push({ communityId, name, avgPrice, district, subDistrict, savedAt: new Date().toISOString() });
    setItem('favorites', favs);
  }
}

export function removeFavorite(communityId) {
  const favs = getFavorites().filter((f) => f.communityId !== communityId);
  setItem('favorites', favs);
}