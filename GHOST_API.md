# 📖 GhostCrypt API Documentation

> **Quick Reference** | For details see [CODE_STRUCTURE.md](CODE_STRUCTURE.md)

---

## `ghost()` - Main Function

Central API for all GhostCrypt operations (encrypt, decrypt, keyfile generation).

### Syntax

```javascript
await ghost(options)
await ghost('upload')              // File upload
await ghost('upload', 'keyfile')   // Keyfile upload
await ghost('download')            // Download .ghost
await ghost('download', 'keyfile') // Download .gkey
await ghost('reset')               // Reset cache
```

---

## Parameters

### Configuration Object

```javascript
{
    action: 'encrypt' | 'decrypt',    // Required
    file: File | ArrayBuffer,         // Required
    keyMethod: 'password' | 'keyfile',// Required
    password: String,                 // If keyMethod='password'
    keyfile: ArrayBuffer              // If keyMethod='keyfile'
}
```

---

## Examples

### 1. Encrypt with Password

```javascript
const file = await ghost('upload');

await ghost({
    action: 'encrypt',
    file: file,
    keyMethod: 'password',
    password: 'MySecurePassword123'
});

ghost('download'); // .ghost file
```

### 2. Encrypt with Keyfile (Auto-Generated)

```javascript
const file = await ghost('upload');

await ghost({
    action: 'encrypt',
    file: file,
    keyMethod: 'keyfile'
    // Keyfile auto-generated
});

ghost('download', 'ghost');   // .ghost file
ghost('download', 'keyfile'); // .gkey file
```

### 3. Decrypt with Password

```javascript
const ghostFile = await ghost('upload');

await ghost({
    action: 'decrypt',
    file: ghostFile,
    keyMethod: 'password',
    password: 'MySecurePassword123'
});

ghost('download'); // Original file
```

### 4. Decrypt with Keyfile

```javascript
const ghostFile = await ghost('upload');
const keyfile = await ghost('upload', 'keyfile');

await ghost({
    action: 'decrypt',
    file: ghostFile,
    keyMethod: 'keyfile',
    keyfile: keyfile.content  // ArrayBuffer
});

ghost('download'); // Original file
```

### 5. String Encryption

```javascript
const textData = 'Secret message';

await ghost({
    action: 'encrypt',
    file: textData,
    keyMethod: 'password',
    password: 'password123'
});

ghost('download'); // .ghost file
```

---

## String Commands

### Upload Files

```javascript
// Regular file upload
const file = await ghost('upload');
// Returns: { name, type, size, lastModified, content: ArrayBuffer }

// Keyfile upload (.gkey)
const keyfile = await ghost('upload', 'keyfile');
// Returns: { name, type, size, lastModified, content: ArrayBuffer }
```

### Download Files

```javascript
// Download encrypted file
ghost('download');

// Download keyfile
ghost('download', 'keyfile');
```

### Reset Cache

```javascript
// Clear all cached data
ghost('reset');
// Returns: { success: true, action: 'reset', message: 'Cache cleared' }
```

---

## Return Values

### Success (Encrypt)

```javascript
{
    success: true,
    action: 'encrypt',
    return: ArrayBuffer,      // .ghost file
    keyfile: Uint8Array       // Only if keyMethod='keyfile'
}
```

### Success (Decrypt)

```javascript
{
    success: true,
    action: 'decrypt',
    return: ArrayBuffer       // Original file
}
```

### Error

```javascript
{
    success: false,
    action: 'encrypt' | 'decrypt',
    error: 'Error message'
}
```

---

## Installation

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

## Technical Details

### Security

- **KDF:** Argon2id (3 iter, 64 MB, 4 threads)
- **Encryption:** AES-256-CBC + ChaCha20
- **Integrity:** HMAC-SHA512 (64 bytes)
- **Quantum:** 128-bit resistance (~2040)

### Performance

| File Size | Time | RAM |
|-----------|------|-----|
| 1 MB | ~0.5s | ~5 MB |
| 10 MB | ~2s | ~20 MB |
| 100 MB | ~15s | ~200 MB |
| 1 GB | ~2m | ~2 GB |

### Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## Common Patterns

### Error Handling

```javascript
try {
    const file = await ghost('upload');
    
    const result = await ghost({
        action: 'encrypt',
        file: file,
        keyMethod: 'password',
        password: 'password123'
    });
    
    if (result.success) {
        ghost('download');
    }
} catch (error) {
    console.error('Encryption failed:', error);
}
```

### Batch Processing

```javascript
const files = await Promise.all([
    ghost('upload'),
    ghost('upload'),
    ghost('upload')
]);

for (const file of files) {
    await ghost({
        action: 'encrypt',
        file: file,
        keyMethod: 'password',
        password: 'password123'
    });
    ghost('download');
}
```

---

## Errors

### Common Error Messages

- `"No file provided"` → Missing file parameter
- `"Password is empty"` → Missing password with keyMethod='password'
- `"Invalid keyfile format"` → Keyfile magic number/version invalid
- `"HMAC verification failed"` → Wrong password/keyfile
- `"Invalid .ghost file"` → File corrupted or wrong format

---

## Best Practices

### Password Security

```javascript
// ✅ Good
password: 'MyS3cur3P@ssw0rd!2024'

// ❌ Bad
password: 'password'
password: '12345678'
```

### Keyfile Management

```javascript
// ✅ Store keyfile securely
const keyfile = await ghost('upload', 'keyfile');
// Save to offline storage (USB, external drive)

// ❌ Never
// - Email keyfiles
// - Upload to cloud without encryption
// - Store in same location as .ghost file
```

---

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>GhostCrypt Example</title>
    <script src="ghostcrypt-v1/ghostcrypt-v1-bundle.min.js"></script>
</head>
<body>
    <button onclick="encryptFile()">Encrypt File</button>
    <button onclick="decryptFile()">Decrypt File</button>

    <script>
        async function encryptFile() {
            try {
                const file = await ghost('upload');
                
                await ghost({
                    action: 'encrypt',
                    file: file,
                    keyMethod: 'password',
                    password: prompt('Enter password:')
                });
                
                ghost('download');
                alert('✅ File encrypted!');
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }
        
        async function decryptFile() {
            try {
                const file = await ghost('upload');
                
                await ghost({
                    action: 'decrypt',
                    file: file,
                    keyMethod: 'password',
                    password: prompt('Enter password:')
                });
                
                ghost('download');
                alert('✅ File decrypted!');
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }
    </script>
</body>
</html>
```

---

## License

**GhostCrypt v1.0** © 2025 Timon Shani  
All rights reserved. Proprietary software.

---

**Made with 🖤 in Germany 🇩🇪**

**GhostCrypt v1.0** - *Military-Grade Encryption* 👻🔒
