const AUTH_STORAGE_KEY = 'amazona_auth_user';

// Credenciales protegidas mediante resumen criptográfico SHA-256 (nunca texto plano)
const AUTHORIZED_USERS = [
  {
    email: 'ehyenma.nft@gmail.com',
    hash: '2fb7f3d3c6c5a42aa30f2ac122c5fde889e3fe844c9ce2198702f2845cdc2358',
    name: 'Ehyenma (Head Coach)',
    role: 'Administrador Principal'
  },
  {
    email: 'reverandgil@gmail.com',
    hash: 'be9b9e280895c51ee5aa1db09547b42f72d762f577cf8883c21386f0b550d29d',
    name: 'Gil Reverand',
    role: 'Administrador / Entrenador'
  }
];

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export async function loginUser(email, password) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  const user = AUTHORIZED_USERS.find(
    u => u.email.toLowerCase() === cleanEmail
  );

  if (!user) {
    return {
      success: false,
      message: 'Usuario no autorizado.'
    };
  }

  const passHash = await sha256(cleanPass);
  if (passHash === user.hash) {
    const userSession = {
      email: user.email,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
    return { success: true, user: userSession };
  }

  return {
    success: false,
    message: 'Contraseña incorrecta. Por favor verifica tus credenciales.'
  };
}

export function logoutUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
