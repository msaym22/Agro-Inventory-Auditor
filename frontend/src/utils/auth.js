// frontend/src/utils/auth.js
import { jwtDecode } from 'jwt-decode'; // Corrected import syntax for jwt-decode

export const storeAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const isTokenValid = (token) => {
  if (!token) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);
    // Check if token is expired
    if (decodedToken.exp < Date.now() / 1000) {
      return false;
    }
    return true;
  } catch (e) {
    // Token is invalid (e.g., malformed)
    console.error("Invalid token:", e);
    return false;
  }
};

export const getUserRole = (token) => {
    if (!token) {
        return null;
    }
    try {
        const decodedToken = jwtDecode(token);
        return decodedToken.role; // Assuming your token contains a 'role' field
    } catch (e) {
        console.error("Failed to decode token for role:", e);
        return null;
    }
};

// You might also have a function to get the entire user object from the token
export const getUserFromToken = (token) => {
  if (!token) {
    return null;
  }
  try {
    const decodedToken = jwtDecode(token);
    // Return relevant user fields from the token payload
    return {
      id: decodedToken.id, // Assuming 'id' is in token
      username: decodedToken.username, // Assuming 'username' is in token
      role: decodedToken.role, // Assuming 'role' is in token
      // ...any other user data stored in the token
    };
  } catch (e) {
    console.error("Failed to decode token to get user info:", e);
    return null;
  }
};