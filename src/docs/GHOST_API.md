# GhostCrypt API Dokumentation

## `ghost()` - Hauptfunktion

Die zentrale Funktion für alle GhostCrypt-Operationen (Verschlüsselung, Entschlüsselung, Keyfile-Generierung).

---

## Syntax

```javascript
await ghost(options)
```

---

## Parameter

### `options` (Object) - Erforderlich

| Property | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| `action` | String | ✅ Ja | `'encrypt'` \| `'decrypt'` \| `'generate_keyfile'` |
| `file` | File \| ArrayBuffer | ⚠️ Für encrypt/decrypt | Datei zum Verschlüsseln/Entschlüsseln |
| `key_method` | String | ⚠️ Für encrypt/decrypt | `'password'` \| `'keyfile'` |
| `password` | String | ⚠️ Wenn key_method = password | Passwort für Ver-/Entschlüsselung |
| `keyfile` | ArrayBuffer | ⚠️ Für decrypt mit keyfile | Keyfile-Inhalt als ArrayBuffer |
| `on_progress` | Function | ❌ Optional | Callback für Fortschritts-Updates |
| `on_error` | Function | ❌ Optional | Callback für Fehler |
| `on_complete` | Function | ❌ Optional | Callback bei Abschluss |

---

## Rückgabewert

**Promise** → Löst auf mit Ergebnis-Objekt:

### Bei Erfolg:
```javascript
{
    success: true,
    action: 'encrypt' | 'decrypt' | 'generate_keyfile',
    message: 'Erfolgs-Nachricht',
    // ... weitere Details je nach Action
}
```

### Bei Fehler:
```javascript
{
    success: false,
    action: 'encrypt' | 'decrypt' | 'generate_keyfile',
    error: 'Fehlermeldung'
}
```

---

## Verwendungsbeispiele

### 1. Datei mit Passwort verschlüsseln

```javascript
const fileInput = document.querySelector('#file-input');
const file = fileInput.files[0];

await ghost({
    action: 'encrypt',
    file: file,
    key_method: 'password',
    password: 'MySecurePassword123',
    
    on_progress: (status, ui_status) => {
        console.log('Status:', ui_status);
        // Update UI hier
    },
    
    on_complete: (result) => {
        console.log('✅ Verschlüsselung abgeschlossen!');
        console.log('Original:', result.original_size, 'Bytes');
        console.log('Verschlüsselt:', result.encrypted_size, 'Bytes');
        alert('Datei erfolgreich verschlüsselt! 👻');
    },
    
    on_error: (error) => {
        console.error('❌ Fehler:', error);
        alert('Fehler: ' + error);
    }
});
```

---

### 2. Datei mit Passwort entschlüsseln

```javascript
const ghostFileInput = document.querySelector('#ghost-file-input');
const ghostFile = ghostFileInput.files[0];

await ghost({
    action: 'decrypt',
    file: ghostFile,
    key_method: 'password',
    password: 'MySecurePassword123',
    
    on_progress: (status, ui_status) => {
        document.querySelector('#status').textContent = ui_status;
    },
    
    on_complete: (result) => {
        console.log('✅ Entschlüsselung erfolgreich!');
        console.log('Datei:', result.original_filename);
        alert('Datei entschlüsselt! 🔓');
    },
    
    on_error: (error) => {
        alert('❌ Entschlüsselung fehlgeschlagen: ' + error);
    }
});
```

---

### 3. Keyfile generieren

```javascript
await ghost({
    action: 'generate_keyfile',
    
    on_complete: (result) => {
        console.log('✅ Keyfile generiert!');
        console.log('Fingerprint:', result.key_material);
        alert('Keyfile wurde heruntergeladen! 🔑');
    }
});
```

---

### 4. Mit Keyfile verschlüsseln

```javascript
// Keyfile wird automatisch generiert beim Verschlüsseln
await ghost({
    action: 'encrypt',
    file: myFile,
    key_method: 'keyfile',
    // KEIN password nötig - Keyfile wird automatisch erstellt
    
    on_complete: (result) => {
        alert('Datei verschlüsselt! Keyfile wurde heruntergeladen.');
        console.log('Bewahre das Keyfile sicher auf!');
    }
});
```

---

### 5. Mit Keyfile entschlüsseln

```javascript
const ghostFile = ghostFileInput.files[0];
const keyfile = keyfileInput.files[0];

// Keyfile als ArrayBuffer laden
const keyfileArrayBuffer = await keyfile.arrayBuffer();

await ghost({
    action: 'decrypt',
    file: ghostFile,
    key_method: 'keyfile',
    keyfile: keyfile_array_buffer,
    
    on_complete: (result) => {
        alert('Mit Keyfile entschlüsselt! 🔓');
    },
    
    on_error: (error) => {
        alert('Falsches Keyfile oder beschädigte Datei!');
    }
});
```

---

### 6. Fortgeschrittenes Beispiel mit UI-Integration

```javascript
// HTML Button Handler
document.querySelector('#encrypt-btn').addEventListener('click', async () => {
    
    const file = document.querySelector('#file-input').files[0];
    const password = document.querySelector('#password-input').value;
    const progressBar = document.querySelector('#progress-bar');
    const statusText = document.querySelector('#status-text');
    
    if (!file) {
        alert('Bitte Datei auswählen!');
        return;
    }
    
    if (!password) {
        alert('Bitte Passwort eingeben!');
        return;
    }
    
    try {
        const result = await ghost({
            action: 'encrypt',
            file: file,
            key_method: 'password',
            password: password,
            
            on_progress: (technical_status, ui_status) => {
                statusText.textContent = ui_status;
                
                // Fortschrittsbalken updaten
                const progress_map = {
                    'KEY_DERIVATION': 20,
                    'GENERATING_IVS': 30,
                    'ENCRYPTING_AES': 50,
                    'ENCRYPTING_CHACHA': 70,
                    'CALCULATING_HMAC': 85,
                    'BUILDING_GHOST': 95,
                    'ENCRYPTION_COMPLETE': 100
                };
                
                const progress = progress_map[technical_status] || 0;
                progressBar.style.width = progress + '%';
            },
            
            on_complete: (result) => {
                statusText.textContent = '✅ Fertig!';
                progressBar.style.width = '100%';
                
                const size_reduction = ((result.encrypted_size / result.original_size) * 100).toFixed(1);
                
                alert(`Verschlüsselung erfolgreich!\n\nOriginal: ${formatBytes(result.original_size)}\nVerschlüsselt: ${formatBytes(result.encrypted_size)}\nRatio: ${size_reduction}%`);
            },
            
            on_error: (error) => {
                statusText.textContent = '❌ Fehler!';
                progressBar.style.width = '0%';
                alert('Fehler: ' + error);
            }
        });
        
    } catch (error) {
        alert('Unerwarteter Fehler: ' + error.message);
    }
    
});

// Helper Funktion
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

---

## Callbacks

### `on_progress(technical_status, ui_status)`

Wird während der Operation aufgerufen (throttled auf 2 Sekunden).

**Parameter:**
- `technical_status` (String): Technischer Status-Code (z.B. `'ENCRYPTING_AES'`)
- `ui_status` (String): Benutzerfreundliche Status-Nachricht (z.B. `'Geist entsteht...'`)

**Technische Status-Codes:**

**Verschlüsselung:**
- `KEY_DERIVATION` → "Schlüssel werden abgeleitet..."
- `GENERATING_IVS` → "Initialisierung..."
- `ENCRYPTING_AES` → "Geist entsteht..."
- `ENCRYPTING_CHACHA` → "Geist wird verstärkt..."
- `CALCULATING_HMAC` → "Geist wird versiegelt..."
- `BUILDING_GHOST` → "Geist materialisiert sich..."
- `ENCRYPTION_COMPLETE` → "Geist entfesselt! 👻"

**Entschlüsselung:**
- `PARSING_GHOST` → "Geist wird gelesen..."
- `DERIVING_KEYS_DECRYPT` → "Schlüssel werden geprüft..."
- `VERIFYING_HMAC` → "Siegel wird überprüft..."
- `DECRYPTING_CHACHA` → "Geist wird befreit..."
- `DECRYPTING_AES` → "Geist wird enthüllt..."
- `DECRYPTION_COMPLETE` → "Geist entschlüsselt! 🔓"

---

### `on_error(error_message)`

Wird bei Fehler aufgerufen.

**Parameter:**
- `error_message` (String): Fehlermeldung

**Mögliche Fehler:**
- `"Ungültige .ghost Datei"` - Magic bytes stimmen nicht
- `"Nicht unterstützte .ghost Version"` - Version ≠ 1
- `"Falsches Passwort oder Keyfile"` - HMAC-Verifikation fehlgeschlagen
- `"Ungültige .gkey Datei"` - Keyfile-Format ungültig
- `"Keyfile konnte nicht gelesen werden"` - JSON-Parse-Fehler

---

### `on_complete(result)`

Wird bei erfolgreichem Abschluss aufgerufen.

**Parameter:**
- `result` (Object): Ergebnis-Objekt mit Details

---

## Fehlerbehandlung

```javascript
try {
    const result = await ghost({
        action: 'decrypt',
        file: ghostFile,
        key_method: 'password',
        password: wrongPassword
    });
    
    if (!result.success) {
        console.error('Operation fehlgeschlagen:', result.error);
    }
    
} catch (error) {
    console.error('Exception:', error.message);
}
```

---

## Sicherheitshinweise

⚠️ **Wichtig:**

1. **Passwörter**: Mindestens 12 Zeichen, Sonderzeichen, Zahlen
2. **Keyfiles**: An sicherem Ort aufbewahren (offline!)
3. **Keyfile-Verlust**: Ohne Keyfile ist Entschlüsselung UNMÖGLICH
4. **Quantum-Sicher**: AES-256 + ChaCha20 = Post-Quantum Ready
5. **Memory**: Große Dateien (>1GB) benötigen viel RAM

---

## Browser-Kompatibilität

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

**Erforderliche APIs:**
- Web Crypto API (Browser-nativ)
- FileReader API (Browser-nativ)
- Blob/ArrayBuffer (Browser-nativ)

**Erforderliche Bibliotheken (aus `src/import/crypt/`):**
- `argon2.min.js` - Argon2 WebAssembly (v1.18.0+)
- `crypto-js.min.js` - CryptoJS für AES-256 & HMAC (v4.2.0+)
- `chacha20.min.js` - ChaCha20 Implementation (RFC 7539)

---

## Performance

| Dateigröße | Verschlüsselungszeit | RAM-Bedarf |
|------------|---------------------|------------|
| 1 MB | ~0.5s | ~5 MB |
| 10 MB | ~2s | ~20 MB |
| 100 MB | ~15s | ~200 MB |
| 1 GB | ~2min | ~2 GB |

**Argon2id-Parameter:**
- Iterationen: 3
- Memory: 64 MB
- Parallelism: 4

---

## Erforderliche HTML-Einbindung

Um GhostCrypt zu verwenden, müssen folgende Scripts in der HTML-Datei eingebunden werden:

```html
<!-- Krypto-Bibliotheken (in dieser Reihenfolge!) -->
<script src="src/import/crypt/argon2.min.js"></script>
<script src="src/import/crypt/crypto-js.min.js"></script>
<script src="src/import/crypt/chacha20.min.js"></script>

<!-- GhostCrypt Main -->
<script src="src/js/main.js"></script>
```

**Wichtig:** Die Bibliotheken müssen VOR `main.js` geladen werden!

---

## Lizenz

GhostCrypt © 2025 - WebByte Studio  
Military-Grade Encryption - Made in Germany 🇩🇪👻
