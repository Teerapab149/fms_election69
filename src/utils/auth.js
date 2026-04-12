import JSEncrypt from 'jsencrypt';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY
  ? process.env.NEXT_PUBLIC_ADMIN_PUBLIC_KEY.replace(/\\n/g, '\n')
  : null;

export const getEncryptedToken = () => {
  if (!PUBLIC_KEY) {
    console.error("Configuration Error: Public Key is missing.");
    return null;
  }

  const secretKey = process.env.NEXT_PUBLIC_ADMIN_AUTH_SECRET || "fallback_secret";

  const encryptor = new JSEncrypt(); 
  encryptor.setPublicKey(PUBLIC_KEY);
  
  const rawToken = `${secretKey}|${Date.now()}`;
  
  return encryptor.encrypt(rawToken);
};