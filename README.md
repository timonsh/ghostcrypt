# 👻 GhostCrypt v1

**5-Layer Hybrid Encryption Protocol for Client-Side File Encryption**

[![Military Grade](https://img.shields.io/badge/Military_Grade-Security-brightgreen)](CODE_STRUCTURE.md)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256%20%2B%20ChaCha20-blue)](GHOST_API.md)
[![Pure JS](https://img.shields.io/badge/Pure-JavaScript-yellow)](GHOST_API.md)
[![Protocol](https://img.shields.io/badge/Protocol-GHOST_1-blueviolet)](GHOST_API.md)

> **Zero-Knowledge · Client-Side Only · No Server · Military-Grade**

![GhostCrypt Application Screenshot](https://timonsh.github.io/ghostcrypt/src/assets/img/screenshot-preview.png)

---

## 🔒 Features

- ✅ **5-Layer Security** - Argon2id → AES-256 → ChaCha20 → HMAC → Binary
- ✅ **Double Encryption** - AES-256-CBC + ChaCha20 (Defense in Depth)
- ✅ **Military-Grade KDF** - Argon2id (64 MB, 3 iterations)
- ✅ **Zero-Knowledge** - 100% client-side, no server
- ✅ **Dual Auth** - Password OR Keyfile (.gkey)
- ✅ **Simple Implementation** - Single JS file, plug & play
- ❌ **File Support** - Up to 1 GB (hardware & browser dependent)

---

## 📦 Installation

### Option 1: Bundle (Recommended)
```html
<script src="ghostcrypt-v1/ghostcrypt-v1-bundle.min.js"></script>
```

### Option 2: Standalone
```html
<script src="ghostcrypt-dependencies/argon2.min.js"></script>
<script src="ghostcrypt-dependencies/crypto-js.min.js"></script>
<script src="ghostcrypt-dependencies/chacha20.min.js"></script>
<script src="ghostcrypt-v1/ghostcrypt-v1.min.js"></script>
```

---

## 🚀 Quick Start

### Encrypt with Password
```javascript
const file = await ghost('upload');
await ghost({
    action: 'encrypt',
    file: file,
    keyMethod: 'password',
    password: 'YourSecurePassword123!'
});
ghost('download');
```

### Encrypt with Keyfile
```javascript
const file = await ghost('upload');
await ghost({
    action: 'encrypt',
    file: file,
    keyMethod: 'keyfile'
});
ghost('download', 'ghost');
ghost('download', 'keyfile');
```

### Decrypt
```javascript
const ghostFile = await ghost('upload');
const keyfile = await ghost('upload', 'keyfile');
await ghost({
    action: 'decrypt',
    file: ghostFile,
    keyMethod: 'keyfile',
    keyfile: keyfile.content
});
ghost('download');
```

**📖 Full API:** [GHOST_API.md](GHOST_API.md)

---

## 🛡️ Security

### 5-Layer Architecture

| Layer | Algorithm | Purpose |
|-------|-----------|---------|
| **0** | Argon2id | Key derivation (64 MB, 3 iter) |
| **1** | AES-256-CBC | Primary encryption |
| **2** | ChaCha20 | Secondary encryption |
| **3** | HMAC-SHA512 | Authentication & integrity |
| **4** | Binary Format | .ghost container (130B overhead) |

### File Formats

#### .ghost (Encrypted Container)
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

#### .gkey (Keyfile)
```
[0-4]     Magic "GKEY!" (5 bytes)
[5]       Version (1 byte)
[6-69]    Key Material (64 bytes)
[70-101]  Fingerprint (32 bytes)

Total: 102 bytes | Entropy: 512 bits
```



---

## ⚡ Performance

| File Size | Encryption | RAM Usage |
|-----------|-----------|-----------|
| 1 MB      | ~0.5s     | ~5 MB     |
| 10 MB     | ~2s       | ~20 MB    |
| 100 MB    | ~15s      | ~200 MB   |
| 1 GB      | ~2m 20s   | ~2 GB     |

**Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+



---

## 🔐 Security

### ✅ Protections
- Brute-force resistance (Argon2id: ~500ms/attempt)
- Rainbow table resistance (unique salt)
- Padding oracle resistance (HMAC-first)
- Timing attack resistance (constant-time)
- File tampering detection (HMAC-SHA512)
- Quantum resistance (128-bit until ~2040)

### ⚠️ Limitations
- Requires strong passwords (12+ chars)
- Cannot protect against keyloggers
- Lost keyfiles = unrecoverable data
- Requires modern browser with Web Crypto API

**📖 Technical Details:** [CODE_STRUCTURE.md](CODE_STRUCTURE.md)

---

## 🤔 FAQ

**Q: Is my data sent to a server?**  
A: No! 100% client-side, nothing leaves your device.

**Q: Can you recover my files if I lose my password?**  
A: No! Zero-knowledge encryption means we cannot access your files.

**Q: How secure against quantum computers?**  
A: 128-bit post-quantum security (secure until ~2040-2050).

**Q: Why double encryption?**  
A: Defense in Depth. If one algorithm breaks, the other remains secure.

---

## 📜 License

**GhostCrypt v1.0** © 2025 WebByte Studio
**Open Source & Free to Use**

This software is free and open source. You are free to:
- ✅ Use it for personal or commercial projects
- ✅ Modify and adapt the code
- ✅ Distribute and share it
- ✅ Build upon it for your own projects

**No warranty provided. Use at your own risk.**

---

<div align="center">
  <img src="https://timonschroth.de/src/img/webbytestudio.svg" width="200" height="80">
</div>