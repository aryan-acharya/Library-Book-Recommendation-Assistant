// Authentication Store for LibraAI
// Client-side session and account manager with SHA-256 password hashing.
// Never stores plaintext passwords in localStorage.

const AUTH_USER_KEY = 'libraai_auth_user';
const USERS_DB_KEY = 'libraai_users_db';
const AUTH_EVENT = 'libraai_auth_update';

// Configured test demo account
export const DEMO_CREDENTIALS = {
  email: 'reader@libraai.org',
  password: 'ReaderDemo2025!',
  name: 'Elena Rostova',
  role: 'Patron Reader',
};

// SHA-256 hash helper using Web Crypto API
export async function hashPassword(plainText) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple fallback hash for non-crypto contexts
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    hash = (hash << 5) - hash + plainText.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

// Initialize seed demo account into database if not present
async function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    let users = raw ? JSON.parse(raw) : [];

    // Ensure demo user exists
    const demoExists = users.some(
      (u) => u.email.toLowerCase() === DEMO_CREDENTIALS.email.toLowerCase()
    );
    if (!demoExists) {
      const demoHash = await hashPassword(DEMO_CREDENTIALS.password);
      users.push({
        id: 'user_demo_1',
        name: DEMO_CREDENTIALS.name,
        email: DEMO_CREDENTIALS.email,
        passwordHash: demoHash,
        role: DEMO_CREDENTIALS.role,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }
    return users;
  } catch (e) {
    console.error('Error reading users DB:', e);
    return [];
  }
}

export function getCurrentUser() {
  try {
    // Check localStorage (remembered) first, then sessionStorage
    const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function loginUser(email, password, rememberMe = true) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  const users = await getStoredUsers();
  const inputHash = await hashPassword(password);
  const foundUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!foundUser) {
    return {
      success: false,
      error: 'No account found with this email. Please check your credentials or create an account.',
    };
  }

  if (foundUser.passwordHash !== inputHash) {
    return {
      success: false,
      error: 'Incorrect password. Please verify your credentials and try again.',
    };
  }

  const sessionUser = {
    id: foundUser.id,
    name: foundUser.name,
    email: foundUser.email,
    role: foundUser.role || 'Reader',
    loggedInAt: new Date().toISOString(),
  };

  try {
    if (rememberMe) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
      sessionStorage.removeItem(AUTH_USER_KEY);
    } else {
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to store session:', e);
  }

  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: sessionUser } }));
  return { success: true, user: sessionUser };
}

export async function registerUser({ name, email, password }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = await getStoredUsers();
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash,
    role: 'Patron Reader',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

  const sessionUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: sessionUser } }));
  return { success: true, user: sessionUser };
}

export function logoutUser() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {
    console.error('Logout error:', e);
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: null } }));
}

export async function resetPasswordRequest(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  const users = await getStoredUsers();
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (!exists) {
    return {
      success: false,
      error: 'We could not find an account associated with this email address.',
    };
  }
  return {
    success: true,
    message: `Password reset instructions have been dispatched to ${cleanEmail}. Check your inbox.`,
  };
}

export function getDemoCredentials() {
  return DEMO_CREDENTIALS;
}
