import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDocs, where, type Firestore } from 'firebase/firestore';
import axios from 'axios';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  name: string;
  balance: number;
  avatar: string;
  provider: string;
  createdAt: string;
  lastActivity: string;
  lastLogin?: string;
  loginCount: number;
  ipAddress: string;
  status?: string;
  password?: string;
  currentDeviceInfo?: any;
}

interface Notification {
  id?: string;
  type: string;
  title: string;
  message: string;
  user?: { email: string; name: string };
  admin?: { email: string; name: string; loginTime: string };
  timestamp: string;
  device: string;
  ip: string;
  read?: boolean;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: any;
let auth: Auth | null = null;
let db: Firestore | null = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !!db && !!auth;
};

// Generate unique user ID
const generateUniqueUserId = (): string => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// Get device info (client-side safe)
export const getDeviceInfo = (): { deviceType: string; browser: string; os: string } => {
  if (typeof navigator === 'undefined') {
    return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  }
  return {
    deviceType: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    browser: navigator.userAgent.split(')')[0].split(' ').pop() || 'Unknown',
    os: navigator.platform || 'Unknown',
  };
};

// Get IP address (client-side safe)
export const getIPAddress = async (): Promise<string> => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

// User management with comprehensive data synchronization
export const userManager = {
  setUser: async (user: UserData): Promise<void> => {
    console.log('🔄 userManager.setUser() called with:', {
      uid: user.uid,
      email: user.email,
      provider: user.provider,
      loginCount: user.loginCount
    });

    if (typeof window !== 'undefined') {
      // 1. Store current user session (primary)
      localStorage.setItem('qtusdev_user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // 2. Update global users list while maintaining independence
      const allUsers = getUserData();
      const existingUserIndex = allUsers.findIndex((u: any) => u.uid === user.uid);
      
      if (existingUserIndex >= 0) {
        // Update existing user without affecting others
        allUsers[existingUserIndex] = { ...allUsers[existingUserIndex], ...user };
      } else {
        // Add new user
        allUsers.push(user);
      }
      
      saveUserData(allUsers);
      window.dispatchEvent(new CustomEvent('usersChange', { detail: allUsers }));
    }
    
    // 3. Save to API endpoint (Prisma/MySQL)
    let apiSuccess = false;
    try {
      const response = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      apiSuccess = response.ok;
      console.log('✅ API save user:', apiSuccess ? 'Success' : 'Failed');
    } catch (error) {
      console.error('❌ API save user failed:', error);
    }
    
    // 4. Save to Firestore (if configured)
    let firestoreSuccess = false;
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db!, 'users', user.uid), {
          ...user,
          lastSync: new Date().toISOString(),
          syncStatus: 'synced'
        });
        firestoreSuccess = true;
        console.log('✅ Firestore user save: Success');
      } catch (error) {
        console.error('❌ Firestore user save failed:', error);
      }
    }
    
    // 5. Log comprehensive sync status
    console.log('📊 User Sync Status:', {
      '✅ UID': user.uid,
      '✅ Email': user.email,
      '✅ Provider': user.provider,
      '✅ IP': user.ipAddress,
      '✅ Lưu Firestore': firestoreSuccess ? 'Success' : 'Failed',
      '✅ Lưu localStorage': 'Success',
      '✅ LoginCount': user.loginCount,
      '✅ Tình trạng đồng bộ': apiSuccess && firestoreSuccess ? 'Fully Synced' : 'Partial Sync'
    });
    
    // 6. Warning if sync issues
    if (!apiSuccess || !firestoreSuccess) {
      console.warn('⚠️ User not synced between all sources:', {
        api: apiSuccess,
        firestore: firestoreSuccess,
        localStorage: true
      });
    }
  },

  getUser: async (): Promise<UserData | null> => {
    if (typeof window !== 'undefined') {
      // 1. Priority: Check localStorage first (fastest)
      const user = localStorage.getItem('qtusdev_user') || localStorage.getItem('currentUser');
      if (user) {
        console.log('✅ User found in localStorage');
        return JSON.parse(user);
      }
      
      // 2. Fallback: Try to fetch from Firestore if available
      if (isFirebaseConfigured()) {
        try {
          // This would require implementing a getDoc call
          console.log('🔄 Attempting to fetch user from Firestore...');
          // Note: This is a placeholder - would need to implement actual Firestore fetch
        } catch (error) {
          console.error('❌ Firestore fetch failed:', error);
        }
      }
    }
    return null;
  },

  removeUser: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qtusdev_user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
    }
  },

  updateBalance: async (newBalance: number): Promise<void> => {
    const user = await userManager.getUser();
    if (user) {
      const updatedUser = { ...user, balance: newBalance, lastActivity: new Date().toISOString() };
      await userManager.setUser(updatedUser);
    }
  },

  isLoggedIn: (): boolean => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  },
};

// Cart management (per user)
export const cartManager = {
  getCart: (): number[] => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const cart = localStorage.getItem(`qtusdev_cart_${user.uid}`);
        return cart ? JSON.parse(cart) : [];
      }
    }
    return [];
  },

  setCart: (cart: number[]): void => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.setItem(`qtusdev_cart_${user.uid}`, JSON.stringify(cart));
      }
    }
  },

  addToCart: (productId: number): void => {
    const cart = cartManager.getCart();
    if (!cart.includes(productId)) {
      cart.push(productId);
      cartManager.setCart(cart);
    }
  },

  removeFromCart: (productId: number): void => {
    const cart = cartManager.getCart().filter((id) => id !== productId);
    cartManager.setCart(cart);
  },

  clearCart: (): void => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.removeItem(`qtusdev_cart_${user.uid}`);
      }
    }
  },
};

// Purchased products management (per user)
export const purchaseManager = {
  getPurchasedProducts: (): number[] => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const purchased = localStorage.getItem(`qtusdev_purchased_${user.uid}`);
        return purchased ? JSON.parse(purchased) : [];
      }
    }
    return [];
  },

  setPurchasedProducts: (products: number[]): void => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        localStorage.setItem(`qtusdev_purchased_${user.uid}`, JSON.stringify(products));
      }
    }
  },

  addPurchasedProduct: (productId: number): void => {
    const purchased = purchaseManager.getPurchasedProducts();
    if (!purchased.includes(productId)) {
      purchased.push(productId);
      purchaseManager.setPurchasedProducts(purchased);
    }
  },
};

// Global data management for admin
export const getUserData = () => {
  if (typeof window === 'undefined') {
    // Server-side: return empty array (not used in SSR)
    return [];
  }
  
  // Client-side: Comprehensive data merging from multiple sources
  try {
    // 1. Get users from localStorage (primary source)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const socialUsers = JSON.parse(localStorage.getItem('socialUsers') || '[]');
    
    // 2. Merge all sources, prioritizing registeredUsers, then socialUsers, then users
    const allUsers = [
      ...registeredUsers,
      ...socialUsers.filter((u: any) => !registeredUsers.find((ru: any) => ru.email === u.email)),
      ...users.filter((u: any) => 
        !registeredUsers.find((ru: any) => ru.email === u.email) &&
        !socialUsers.find((su: any) => su.email === u.email)
      )
    ];
    
    // 3. Remove duplicates based on email
    const uniqueUsers = allUsers.filter((user: any, index: number, self: any[]) => 
      index === self.findIndex((u: any) => u.email === user.email)
    );
    
    console.log('📊 getUserData - Sources merged:', {
      registeredUsers: registeredUsers.length,
      socialUsers: socialUsers.length,
      users: users.length,
      total: uniqueUsers.length
    });
    
    return uniqueUsers;
  } catch (error) {
    console.error('❌ Error in getUserData:', error);
    return [];
  }
};

export const saveUserData = (users: any[]) => {
  if (typeof window === 'undefined') return;
  // Save to both locations for compatibility
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('registeredUsers', JSON.stringify(users));
  window.dispatchEvent(new CustomEvent('usersChange', { detail: users }));
};

export const getDeposits = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('deposits') || '[]');
};

export const saveDeposit = (deposit: any) => {
  if (typeof window === 'undefined') return;
  const deposits = getDeposits();
  const existingIndex = deposits.findIndex((d: any) => d.id === deposit.id);
  
  if (existingIndex >= 0) {
    deposits[existingIndex] = deposit;
  } else {
    deposits.push(deposit);
  }
  
  localStorage.setItem('deposits', JSON.stringify(deposits));
  window.dispatchEvent(new CustomEvent('depositsChange', { detail: deposits }));
};

export const getWithdrawals = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('withdrawals') || '[]');
};

export const saveWithdrawal = (withdrawal: any) => {
  if (typeof window === 'undefined') return;
  const withdrawals = getWithdrawals();
  const existingIndex = withdrawals.findIndex((w: any) => w.id === withdrawal.id);
  
  if (existingIndex >= 0) {
    withdrawals[existingIndex] = withdrawal;
  } else {
    withdrawals.push(withdrawal);
  }
  
  localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
  window.dispatchEvent(new CustomEvent('withdrawalsChange', { detail: withdrawals }));
};

export const getPurchases = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('purchases') || '[]');
};

export const savePurchase = (purchase: any) => {
  if (typeof window === 'undefined') return;
  const purchases = getPurchases();
  purchases.push({
    ...purchase,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('purchases', JSON.stringify(purchases));
  window.dispatchEvent(new CustomEvent('purchasesChange', { detail: purchases }));
};

export const getNotifications = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('notifications') || '[]');
};

export const saveNotification = (notification: any) => {
  if (typeof window === 'undefined') return;
  const notifications = getNotifications();
  notifications.push({
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('notifications', JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent('notificationsChange', { detail: notifications }));
};

// Event listeners for real-time updates
export const onUsersChange = (callback: (users: any[]) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: any) => {
    callback(event.detail);
  };
  
  // Initial load
  callback(getUserData());
  
  window.addEventListener('usersChange', handler);
  return () => window.removeEventListener('usersChange', handler);
};

export const onDepositsChange = (callback: (deposits: any[]) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: any) => {
    callback(event.detail);
  };
  
  // Initial load
  callback(getDeposits());
  
  window.addEventListener('depositsChange', handler);
  return () => window.removeEventListener('depositsChange', handler);
};

export const onWithdrawalsChange = (callback: (withdrawals: any[]) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: any) => {
    callback(event.detail);
  };
  
  // Initial load
  callback(getWithdrawals());
  
  window.addEventListener('withdrawalsChange', handler);
  return () => window.removeEventListener('withdrawalsChange', handler);
};

export const onPurchasesChange = (callback: (purchases: any[]) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const handler = (event: any) => {
    callback(event.detail);
  };
  
  // Initial load
  callback(getPurchases());
  
  window.addEventListener('purchasesChange', handler);
  return () => window.removeEventListener('purchasesChange', handler);
};

export const onNotificationsChange = (callback: (notifications: Notification[]) => void): (() => void) => {
  const loadFromStorage = () => {
    if (typeof window !== 'undefined') {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      callback(notifications);
    }
  };

  try {
    if (isFirebaseConfigured()) {
      const q = query(collection(db!, 'notifications'), orderBy('timestamp', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Notification));
        callback(notifications);
      });
    } else {
      loadFromStorage();
    }
  } catch (error) {
    console.error('Firestore notifications listener failed:', error);
    loadFromStorage();
  }

  return () => {};
};

// Firebase Auth functions with independent account management
export const signInWithEmail = async (
  email: string,
  password: string,
  options: { deviceInfo: { deviceType: string; browser: string; os: string }; ipAddress: string; rememberMe: boolean }
): Promise<{ user: User | null; error: string | null }> => {
  console.log('🔐 signInWithEmail called for:', email);
  
  try {
    if (isFirebaseConfigured()) {
      const result = await signInWithEmailAndPassword(auth!, email, password);
      const user = result.user;
      const userData: UserData = {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        name: user.displayName || email.split('@')[0],
        balance: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || email.split('@')[0])}&background=random`,
        provider: 'email',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        loginCount: 1,
        ipAddress: options.ipAddress,
        status: 'active',
      };
      await userManager.setUser(userData);
      return { user, error: null };
    }
  } catch (error: any) {
    console.error('Firebase auth failed:', error);
  }

  // Fallback to localStorage with comprehensive offline support
  try {
    console.log('🔄 Fallback to localStorage authentication');
    
    // Check if user exists in localStorage
    const allUsers = getUserData();
    console.log('📊 getUserData returned:', allUsers.length, 'users');
    
    const existingUser = allUsers.find((u: any) => u.email === email);
    console.log('🔍 User lookup:', existingUser ? 'Found' : 'Not found');
    
    if (existingUser) {
      console.log('🔐 Password verification:', existingUser.password ? 'Stored' : 'Missing', 'vs', password ? 'Provided' : 'Empty');
      
      if (existingUser.password === password) {
        // Update login info with comprehensive data
        const updatedUser = {
          ...existingUser,
          lastActivity: new Date().toISOString(),
          loginCount: (existingUser.loginCount || 0) + 1,
          ipAddress: options.ipAddress,
          currentDeviceInfo: options.deviceInfo,
          lastLogin: new Date().toISOString(),
          // Ensure all required fields are present
          uid: existingUser.uid || `user_${Date.now()}`,
          provider: existingUser.provider || 'email',
          status: existingUser.status || 'active'
        };
        
        // Save updated user to all sources
        const updatedUsers = allUsers.map((u: any) => u.uid === existingUser.uid ? updatedUser : u);
        saveUserData(updatedUsers);
        
        // Call userManager.setUser for comprehensive sync
        await userManager.setUser(updatedUser);
        
        console.log('✅ Login successful via localStorage fallback');
        return { 
          user: { 
            uid: updatedUser.uid, 
            email: updatedUser.email, 
            name: updatedUser.name, 
            balance: updatedUser.balance 
          } as any, 
          error: null 
        };
      } else {
        console.log('❌ Password mismatch');
        return { user: null, error: 'Email hoặc mật khẩu không chính xác!' };
      }
    }
    
    console.log('❌ User not found in localStorage');
    return { user: null, error: 'Email hoặc mật khẩu không chính xác!' };
  } catch (error: any) {
    console.error('❌ Fallback auth failed:', error);
    return { user: null, error: 'Email hoặc mật khẩu không chính xác!' };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: { name: string },
  options: { deviceInfo: { deviceType: string; browser: string; os: string }; ipAddress: string }
): Promise<{ user: User | null; error: string | null }> => {
  console.log('📝 signUpWithEmail called for:', email);
  
  try {
    if (isFirebaseConfigured()) {
      const result = await createUserWithEmailAndPassword(auth!, email, password);
      await updateProfile(result.user, { displayName: userData.name });
      const fullUserData: UserData = {
        uid: result.user.uid,
        email,
        displayName: userData.name,
        name: userData.name,
        balance: 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        provider: 'email',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        loginCount: 1,
        ipAddress: options.ipAddress,
        status: 'active',
      };
      await userManager.setUser(fullUserData);
      console.log('✅ Firebase signup successful');
      return { user: result.user, error: null };
    }
  } catch (error: any) {
    console.error('❌ Firebase signup failed:', error);
    return { user: null, error: error.message || 'Không thể đăng ký tài khoản!' };
  }

  // Fallback to localStorage with comprehensive account creation
  try {
    console.log('🔄 Fallback to localStorage signup');
    
    const allUsers = getUserData();
    
    // Check if email already exists
    if (allUsers.some((u: any) => u.email === email)) {
      console.log('❌ Email already exists');
      return { user: null, error: 'Email đã được sử dụng!' };
    }
    
    // Create new comprehensive user account
    const newUser: UserData = {
      uid: generateUniqueUserId(),
      email,
      displayName: userData.name,
      name: userData.name,
      balance: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
      provider: 'email',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      loginCount: 1,
      ipAddress: options.ipAddress,
      status: 'active',
      password: password, // Store password for demo purposes
      lastLogin: new Date().toISOString(),
      currentDeviceInfo: options.deviceInfo
    };
    
    // Save to localStorage and sync with userManager
    const existingUsers = getUserData();
    existingUsers.push(newUser);
    saveUserData(existingUsers);
    
    // Call userManager.setUser for comprehensive sync
    await userManager.setUser(newUser);
    
    console.log('✅ Signup successful via localStorage fallback');
    return { 
      user: { uid: newUser.uid, email: newUser.email, name: newUser.name, balance: newUser.balance } as any, 
      error: null 
    };
  } catch (error: any) {
    console.error('❌ Fallback signup failed:', error);
    return { user: null, error: 'Không thể đăng ký tài khoản!' };
  }
};

export const signInWithSocialProvider = async (
  providerType: 'google' | 'facebook' | 'github',
  options: { deviceInfo: { deviceType: string; browser: string; os: string }; ipAddress: string }
): Promise<{ user: User | null; error: string | null }> => {
  console.log(`🔐 signInWithSocialProvider called for: ${providerType}`);
  
  let provider;
  switch (providerType) {
    case 'google':
      provider = new GoogleAuthProvider();
      break;
    case 'facebook':
      provider = new FacebookAuthProvider();
      break;
    case 'github':
      provider = new GithubAuthProvider();
      break;
    default:
      return { user: null, error: 'Invalid provider' };
  }

  try {
    if (isFirebaseConfigured()) {
      const result = await signInWithPopup(auth!, provider);
      const user = result.user;
      const userData: UserData = {
        uid: user.uid,
        email: user.email || `${user.uid}@${providerType}.com`,
        displayName: user.displayName || user.email?.split('@')[0] || `User-${user.uid}`,
        name: user.displayName || user.email?.split('@')[0] || `User-${user.uid}`,
        balance: 0,
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email?.split('@')[0] || `User-${user.uid}`)}&background=random`,
        provider: providerType,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        loginCount: 1,
        ipAddress: options.ipAddress,
        status: 'active',
      };
      await userManager.setUser(userData);
      console.log(`✅ ${providerType} login successful via Firebase`);
      return { user, error: null };
    }
  } catch (error: any) {
    console.error(`❌ Firebase ${providerType} auth failed:`, error);
    return { user: null, error: `Không thể đăng nhập bằng ${providerType}!` };
  }

  // Enhanced fallback for social login with localStorage support
  try {
    console.log(`🔄 Fallback to localStorage for ${providerType}`);
    
    // Create a mock user for offline social login
    const mockUserData: UserData = {
      uid: `social_${providerType}_${Date.now()}`,
      email: `user@${providerType}.com`,
      displayName: `${providerType} User`,
      name: `${providerType} User`,
      balance: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${providerType} User`)}&background=random`,
      provider: providerType,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      loginCount: 1,
      ipAddress: options.ipAddress,
      status: 'active',
      lastLogin: new Date().toISOString(),
      currentDeviceInfo: options.deviceInfo
    };
    
    // Save to localStorage and sync
    await userManager.setUser(mockUserData);
    
    console.log(`✅ ${providerType} login successful via localStorage fallback`);
    return { 
      user: { 
        uid: mockUserData.uid, 
        email: mockUserData.email, 
        name: mockUserData.name, 
        balance: mockUserData.balance 
      } as any, 
      error: null 
    };
  } catch (error: any) {
    console.error(`❌ ${providerType} fallback failed:`, error);
    return { user: null, error: `Đăng nhập ${providerType} chưa được hỗ trợ trong chế độ offline!` };
  }
};

export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    if (isFirebaseConfigured()) {
      await signOut(auth!);
    }
    await userManager.removeUser();
    return { error: null };
  } catch (error: any) {
    console.error('Sign out failed:', error);
    return { error: error.message || 'Không thể đăng xuất!' };
  }
};

// Admin functions
export const adminLogin = async (
  email: string,
  password: string,
  options: { deviceInfo: { deviceType: string; browser: string; os: string }; ipAddress: string }
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...options }),
    });
    const result = await response.json();
    
    if (result.success && typeof window !== 'undefined') {
      localStorage.setItem('adminAuth', 'true');
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          email: email,
          name: 'Admin',
          role: 'admin',
          loginTime: new Date().toISOString(),
        })
      );
    }
    
    return result;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { success: false, error: 'Thông tin đăng nhập không chính xác!' };
  }
};

export const adminLogout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
  }
};

export const getAdminUser = (): { email: string; name: string; role: string; loginTime: string } | null => {
  if (typeof window !== 'undefined') {
    const admin = localStorage.getItem('adminUser');
    return admin ? JSON.parse(admin) : null;
  }
  return null;
};

export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('adminAuth') === 'true';
};

// Compatibility exports
export const getCurrentUser = userManager.getUser;
export const isAuthenticated = userManager.isLoggedIn;

// Additional functions needed by the application
export const requestPasswordReset = async (email: string) => {
  // Placeholder for password reset functionality
  console.log('Password reset requested for:', email);
  return { success: true, message: 'Password reset email sent' };
};

export const changePassword = async (userId: string, newPassword: string) => {
  // Placeholder for password change functionality
  console.log('Changing password for user:', userId);
  return { success: true };
};

// Export Firebase auth providers
export { signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider };
