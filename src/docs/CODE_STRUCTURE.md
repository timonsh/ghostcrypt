# GhostCrypt - Code-Struktur

## 📊 Übersicht

**Naming Convention:** 100% snake_case  
**Sprache:** JavaScript (ES6+)  
**Architektur:** Funktional, Pipeline-basiert

---

## 📁 Dateistruktur

```
ghostcrypt/src/
├── js/main.js                    # Haupt-Engine (~1300 Zeilen)
├── import/crypt/
│   ├── argon2.min.js             # Argon2id KDF
│   ├── crypto-js.min.js          # AES-256 & HMAC
│   └── chacha20.min.js           # ChaCha20
└── docs/
    ├── GHOST_API.md              # API-Dokumentation
    └── CODE_STRUCTURE.md         # Diese Datei
```

---

## 🏗️ Haupt-Komponenten

### `ghost()` - Zentrale API
Hauptfunktion für alle Operationen: `encrypt`, `decrypt`, `generate_keyfile`

### Agents
- **`encryption_agent()`** - Pipeline-Controller für Verschlüsselung
- **`decryption_agent()`** - Pipeline-Controller für Entschlüsselung

### Cache
- **`ghost_cache`** - Globaler State-Container für alle Daten

### Status
- **`update_status()`** - Throttled UI-Updates (2s Minimum)

---

## 🔒 Verschlüsselungs-Pipeline

1. **Key Derivation** - Argon2id (3 iterations, 64 MB)
2. **IV Generation** - Random IVs für AES/ChaCha20
3. **Layer 1** - AES-256-CBC Verschlüsselung
4. **Layer 2** - ChaCha20 Verschlüsselung (double-encrypted)
5. **HMAC** - SHA512 Integrity Tag (64 bytes)
6. **Assembly** - Binary Ghost-Datei erstellen
7. **Download** - .ghost Datei ausgeben

---

## 🔓 Entschlüsselungs-Pipeline

1. **Parse** - Ghost-Datei analysieren
2. **Key Derivation** - Argon2id mit Salt aus Datei
3. **HMAC Verify** - Passwort/Keyfile validieren
4. **Layer 1** - ChaCha20 entschlüsseln
5. **Layer 2** - AES-256 entschlüsseln
6. **Download** - Original-Datei ausgeben

---

## 📄 Ghost-Dateiformat

```
[GHOST][version][salt 32B][aes_iv 16B][chacha_nonce 12B][encrypted_data][hmac 64B]
```

**Overhead:** ~130 bytes pro Datei

---

## 🔒 Sicherheit

- **AES-256-CBC** - NIST-approved, lattice-based
- **ChaCha20** - ARX cipher, andere mathematische Basis
- **Argon2id** - Memory-hard KDF (3 iter, 64 MB)
- **HMAC-SHA512** - 64-byte Integrity Tag
- **CSPRNG** - Web Crypto API für Randomness
- **Constant-Time** - HMAC-Vergleich gegen Timing-Attacks

---

## ⚡ Performance

| Dateigröße | Zeit | RAM |
|------------|------|-----|
| 1 MB | ~0.5s | ~5 MB |
| 10 MB | ~2s | ~20 MB |
| 100 MB | ~15s | ~200 MB |

---

## 📄 Lizenz

GhostCrypt © 2025 - Timon Shani  
Military-Grade Encryption - Made in Germany 🇩🇪👻

## 🔐 Sicherheitshinweise

⚠️ **WICHTIG:**

1. **Passwörter:** Mindestens 12 Zeichen empfohlen
2. **Keyfiles:** Sicher offline aufbewahren
3. **Backups:** Keyfile-Verlust = Datenverlust
4. **Updates:** Browser aktuell halten
5. **Memory:** Große Dateien benötigen viel RAM

---

## ✅ Code-Qualität

### Standards
- **Naming Convention:** 100% snake_case (alle eigenen Variablen/Funktionen)
- **Error-Handling:** Try-Catch mit Callbacks in allen kritischen Bereichen
- **Dokumentation:** JSDoc-Kommentare für alle öffentlichen Funktionen
- **Modularität:** Klare Trennung zwischen Encryption/Decryption/Helper

### Sicherheit
- **AES-256-CBC:** NIST-approved, lattice-based Verschlüsselung
- **ChaCha20:** ARX-Cipher mit unterschiedlicher mathematischer Basis
- **Argon2id:** Memory-hard KDF gegen Brute-Force
- **HMAC-SHA512:** Constant-time Vergleich gegen Timing-Attacks
- **CSPRNG:** Web Crypto API für kryptografisch sichere Zufallszahlen

### Performance-Optimierung
- **Throttling:** Status-Updates nur alle 2 Sekunden (UI-Performance)
- **Pipeline:** Effiziente Verkettung der Krypto-Operationen
- **Memory:** Direkter ArrayBuffer-Zugriff ohne unnötige Kopien
