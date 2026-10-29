/**
 * Central configuration file for limits and roles.
 */

export const FREE_LIMIT_PER_CATEGORY = 100;

export const getAdminEmails = () => {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdmin = (email) => {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
};

