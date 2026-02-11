// Утилиты для E2EE шифрования с использованием Web Crypto API

export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
  };
};

export const encryptMessage = async (text: string, publicKeyB64: string) => {
  const binaryDerString = atob(publicKeyB64);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const encodedText = new TextEncoder().encode(text);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedText
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const decryptMessage = async (encryptedB64: string, privateKeyB64: string) => {
  try {
    const binaryDerString = atob(privateKeyB64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["decrypt"]
    );

    const encryptedData = atob(encryptedB64);
    const encryptedBuffer = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      encryptedBuffer[i] = encryptedData.charCodeAt(i);
    }

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBuffer.buffer
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed", e);
    return "[Ошибка расшифровки]";
  }
};
