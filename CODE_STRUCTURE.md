# 📘 GhostCrypt v1.0 - Code Structure

> **Version:** 1.0 Production | **Maintainer:** Timon Shani | **License:** Proprietary

## 📊 Overview

- **Architecture:** 5-Layer Security Pipeline
- **Language:** JavaScript ES6+ (camelCase)
- **Total Lines:** 1,750 (1610 core + 140 UI)

---

## 📁 Project Structure

```
ghostcrypt/
├── ghostcrypt-v1/                    # Production Release
│   ├── ghostcrypt-v1.js             (1610 lines readable)
│   ├── ghostcrypt-v1.min.js         (24 KB standalone)
│   └── ghostcrypt-v1-bundle.min.js  (132 KB with deps)
├── ghostcrypt-dependencies/          # External Libraries
│   ├── argon2.min.js                (45 KB)
│   ├── crypto-js.min.js             (60 KB)
│   └── chacha20.min.js              (2 KB)
└── *src/js/                          # Development Source
    └── main.js                       (140 lines UI)
```

---

## 🏗️ Core Components

### Main API (`ghostcrypt-v1.js`)

```javascript
ghost(action, ...args)           // Main entry point
encryptionAgent(config)          // Encryption pipeline
decryptionAgent(config)          // Decryption pipeline
generateKeyfile()                // Keyfile generator
```

### Cache System

```javascript
ghostCache = {
    uploadedFile: null,
    uploadedKeyfile: null,
    encryptedData: null,
    decryptedData: null,
    generatedKeyfile: null
}
```

---

## 🔒 Encryption Pipeline

```
Input File
    ↓
Argon2id (Password → 3x 256-bit keys) [~500ms]
    ↓
AES-256-CBC (Layer 1)
    ↓
ChaCha20 (Layer 2)
    ↓
HMAC-SHA512 (Integrity)
    ↓
.ghost File
```

---

## 🔓 Decryption Pipeline

```
.ghost File
    ↓
Parse & Validate
    ↓
Argon2id (Password + Salt → Keys) [~500ms]
    ↓
HMAC Verify (Wrong password = fail here)
    ↓
ChaCha20 Decrypt (Layer 1)
    ↓
AES-256-CBC Decrypt (Layer 2)
    ↓
Original File
```

---

## 📄 Binary Formats

### .ghost (Encrypted Container)

```
[0-4]     Magic "GHOST" (5 bytes)
[5]       Version (1 byte)
[6-37]    Salt (32 bytes)
[38-53]   AES IV (16 bytes)
[54-65]   ChaCha Nonce (12 bytes)
[66-N]    Encrypted Data (N bytes)
[N+1-END] HMAC Tag (64 bytes)

Total Overhead: 130 bytes
```

### .gkey (Keyfile)

```
[0-4]     Magic "GKEY!" (5 bytes)
[5]       Version (1 byte)
[6-69]    Key Material (64 bytes)
[70-101]  Fingerprint (32 bytes)

Total: 102 bytes | Entropy: 512 bits
```

---

## 🔒 Security

### Cryptographic Stack

| Layer | Algorithm | Parameters |
|-------|-----------|------------|
| **0** | Argon2id | 64 MB, 3 iter, 4 threads |
| **1** | AES-256-CBC | 256-bit key, 128-bit IV |
| **2** | ChaCha20 | 256-bit key, 96-bit nonce |
| **3** | HMAC-SHA512 | 256-bit key, 64-byte tag |
| **4** | Binary Format | .ghost (130B overhead) |

### Key Features

- **Brute-Force Resistance:** Argon2id (~500ms/attempt)
- **Memory-Hard KDF:** 64 MB prevents GPU/ASIC
- **Double Encryption:** AES + ChaCha (Defense in Depth)
- **Constant-Time HMAC:** Timing attack prevention
- **Quantum Resistance:** 128-bit (secure until ~2040)

---

## ⚡ Performance

| File Size | Time | RAM Usage |
|-----------|------|-----------|
| 1 MB      | ~0.5s | ~5 MB    |
| 10 MB     | ~2s   | ~20 MB   |
| 100 MB    | ~15s  | ~200 MB  |
| 1 GB      | ~2m   | ~2 GB    |

**Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 📚 Dependencies

### 1. Argon2.js (45 KB)
- **Purpose:** Password-based key derivation
- **Standard:** Winner of Password Hashing Competition 2015
- **License:** MIT / Apache 2.0

### 2. CryptoJS (60 KB)
- **Purpose:** AES-256-CBC & HMAC-SHA512
- **Standard:** NIST FIPS 197 (AES), FIPS 198-1 (HMAC)
- **License:** MIT

### 3. ChaCha20 (2 KB)
- **Purpose:** Stream cipher (second encryption layer)
- **Standard:** RFC 7539 (IETF)
- **License:** Public Domain / MIT

---

## 🚀 Integration

### Bundle (Recommended)
```html
<script src="ghostcrypt-v1/ghostcrypt-v1-bundle.min.js"></script>
```

### Standalone
```html
<script src="ghostcrypt-dependencies/argon2.min.js"></script>
<script src="ghostcrypt-dependencies/crypto-js.min.js"></script>
<script src="ghostcrypt-dependencies/chacha20.min.js"></script>
<script src="ghostcrypt-v1/ghostcrypt-v1.min.js"></script>
```

---

## 📝 License

**GhostCrypt v1.0** © 2025 Timon Shani  
All rights reserved. Proprietary software.

**Third-Party:**
- Argon2: CC0 / Apache 2.0
- CryptoJS: MIT
- ChaCha20: Public Domain

---

## 👨‍💻 Author

**Timon Shani** - Security Engineer

- 🌐 GitHub: [@timon-sh](https://github.com/timon-sh)
- 🇩🇪 Made in Germany

---

**Made with 🖤 in Germany 🇩🇪**

**GhostCrypt v1.0** - *Military-Grade Encryption* 👻🔒
