/* ███████████████████████████████████████████████████████████████████████████████████████████████
   █                                                                                             █
   █     ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗ ██████╗██████╗ ██╗   ██╗██████╗ ████████╗    █
   █    ██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝    █
   █    ██║  ███╗███████║██║   ██║███████╗   ██║   ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║       █
   █    ██║   ██║██╔══██║██║   ██║╚════██║   ██║   ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║       █
   █    ╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ╚██████╗██║  ██║   ██║   ██║        ██║       █
   █     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝       █
   █                                                                                             █
   █                               👻 High-level encryption protocol 🔐                          █
   █                                                                                             █
   █                                            Version: 1.0                                     █
   █                                    Crafted by WEBBYTE STUDIO                                █
   █                        View GitHub: https://github.com/timonsh/ghostcrypt                   █
   █                                                                                             █
   █                           AES-256-CBC + ChaCha20 + Argon2id + HMAC-SHA512                   █
   █                                                                                             █
   ███████████████████████████████████████████████████████████████████████████████████████████████ */

   /*
   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
   │  GHOSTCRYPT STANDALONE                                                                      │
   │                                                                                             │
   │  This is the original standalone version requiring external dependencies:                   │
   │  • Argon2id - Password hashing (argon2.min.js)                                              │
   │  • ChaCha20 - Stream cipher (chacha20.min.js)                                               │
   │  • CryptoJS - AES-256 + HMAC (crypto-js.min.js)                                             │
   │                                                                                             │
   │  Documentation & setup guide:                                                               │
   │  → https://github.com/timonsh/ghostcrypt                                                    │
   │                                                                                             │
   │  For plug-and-play usage without external dependencies:                                     │
   │  → Use ghostcrypt-v1-bundle.min.js (all libraries included)                                 │
   └─────────────────────────────────────────────────────────────────────────────────────────────┘
   */



"use strict";


/* =================================================== */
/* =============== MAIN GHOST FUNCTION =============== */
/* =================================================== */


/**
 * GhostCrypt - Main encryption/decryption function
 * 
 * @param {Object|string} options - Configuration object OR string command ('reset', 'upload')
 * @param {string} options.action - 'encrypt' | 'decrypt' | 'generateKeyfile'
 * @param {File|ArrayBuffer} options.file - File to encrypt/decrypt (optional for generateKeyfile)
 * @param {string} options.keyMethod - 'password' | 'keyfile'
 * @param {string} options.password - Password for encryption/decryption (required if keyMethod = 'password')
 * @param {ArrayBuffer} options.keyfile - Keyfile content for decryption (required if keyMethod = 'keyfile' and action = 'decrypt')
 * @param {Function} options.onProgress - Callback for progress updates (receives: status, uiStatus)
 * @param {Function} options.onError - Callback for errors (receives: error message)
 * @param {Function} options.onComplete - Callback when done (receives: result object)
 * 
 * @returns {Promise<Object>} Result object with status and data
 * 
 * @example
 * // Encrypt with password
 * await ghost({
 *   action: 'encrypt',
 *   file: uploadedFile,
 *   keyMethod: 'password',
 *   password: 'MySecurePassword123',
 *   onProgress: (status, uiStatus) => console.log(uiStatus),
 *   onComplete: (result) => console.log('Done!', result)
 * });
 * 
 * @example
 * // Decrypt with keyfile
 * await ghost({
 *   action: 'decrypt',
 *   file: ghostFile,
 *   keyMethod: 'keyfile',
 *   keyfile: keyfileArrayBuffer,
 *   onError: (error) => alert(error)
 * });
 * 
 * @example
 * // Generate keyfile
 * await ghost({
 *   action: 'generateKeyfile',
 *   onComplete: (result) => console.log('Keyfile generated:', result.fingerprint)
 * });
 * 
 * @example
 * // Reset/initialize
 * ghost('reset');
 * 
 * @example
 * // Upload file with dialog
 * const file = await ghost('upload');
 */


async function ghost(options, type) {

    // Handle string commands
    if (typeof options === 'string') {

        const command = options.toLowerCase();

        // Reset command
        if (command === 'reset') {
            encryptionAgent('initialize');
            return {
                success: true,
                action: 'reset',
                message: 'Cache has been reset'
            };
        }

        // Upload command
        if (command === 'upload') {
            const uploadType = type || 'file';  // Default: file
            
            if (uploadType === 'keyfile') {
                // Upload keyfile (.gkey)
                return await ghostcryptUploadKeyfile();
            } else {
                // Upload regular file
                return await ghostcryptUploadFile();
            }
        }

        // Download command
        if (command === 'download') {
            
            const downloadType = type || 'ghost';  // Default: ghost
            
            if (downloadType === 'keyfile') {
                // Download keyfile (binary format)
                if (ghostCache.generatedKeyfile) {
                    // Generate filename from original file name
                    const baseFilename = ghostCache.uploadedFile?.name 
                        ? ghostCache.uploadedFile.name 
                        : 'ghostcrypt-key';
                    const keyfileName = baseFilename + '.gkey';
                    
                    downloadFile(ghostCache.generatedKeyfile, keyfileName);
                    return {
                        success: true,
                        action: 'download',
                        type: 'keyfile',
                        filename: keyfileName,
                        message: 'Keyfile downloaded'
                    };
                } else {
                    throw new Error('GhostCrypt: No keyfile in cache to download');
                }
            }
            
            // Download ghost or decrypted file
            if (ghostCache.ghost) {
                // Encryption result exists
                const filename = ghostCache.uploadedFile?.name 
                    ? ghostCache.uploadedFile.name + '.ghost' 
                    : 'GhostCryptRaw.ghost';
                
                downloadFile(ghostCache.ghost, filename);
                
                return {
                    success: true,
                    action: 'download',
                    type: 'ghost',
                    filename: filename,
                    size: ghostCache.ghost.byteLength,
                    message: 'Download successful'
                };
                
            } else if (ghostCache.decryptedLayer2) {
                // Decryption result exists
                let filename = ghostCache.uploadedFile?.name || 'GhostCryptRaw';
                if (filename.endsWith('.ghost')) {
                    filename = filename.slice(0, -6);
                }
                
                downloadFile(ghostCache.decryptedLayer2, filename);
                
                return {
                    success: true,
                    action: 'download',
                    type: 'file',
                    filename: filename,
                    size: ghostCache.decryptedLayer2.byteLength,
                    message: 'Download successful'
                };
                
            } else {
                throw new Error('GhostCrypt: Nothing to download in cache');
            }
        }

        throw new Error(`GhostCrypt: Unknown command "${options}". Use 'reset', 'upload', or 'download'`);
    }

    // Validate options object
    if (!options || typeof options !== 'object') {
        throw new Error('GhostCrypt: Options must be an object or string command');
    }

    const {
        action,
        file,
        content,
        keyMethod,
        password,
        keyfile,
        onProgress,
        onError,
        onComplete
    } = options;

    // Validate action
    if (!['encrypt', 'decrypt', 'generateKeyfile'].includes(action)) {
        throw new Error(`GhostCrypt: Invalid action "${action}". Use 'encrypt', 'decrypt', or 'generateKeyfile'`);
    }

    // Initialize fresh cache
    encryptionAgent('initialize');

    // Store original updateStatus function
    const originalUpdateStatus = updateStatus;

    // Setup progress callback wrapper
    if (onProgress) {
        window.updateStatus = function (technicalStatus, uiStatusText) {
            originalUpdateStatus(technicalStatus, uiStatusText);
            onProgress(technicalStatus, uiStatusText);
        };
    }

    try {

        // ===== GENERATE KEYFILE =====
        
        if (action === 'generateKeyfile') {

            const success = encryptionAgent('generateKeyfile');

            if (success) {
                const result = {
                    success: true,
                    action: 'generateKeyfile',
                    return: ghostCache.rawKey
                };

                if (onComplete) onComplete(result);
                return result;
            }

        }

        // ===== ENCRYPTION =====

        if (action === 'encrypt') {

            // Validate inputs
            if (!file && !content) {
                throw new Error('GhostCrypt: File or content required for encryption');
            }
            if (!keyMethod || !['password', 'keyfile'].includes(keyMethod)) {
                throw new Error('GhostCrypt: Valid keyMethod required (password or keyfile)');
            }
            if (keyMethod === 'password' && !password) {
                throw new Error('GhostCrypt: Password required when keyMethod is "password"');
            }

            // Process file or content
            let fileContent;
            
            if (content) {
                // Content mode: Convert string to ArrayBuffer
                const encoder = new TextEncoder();
                const encoded = encoder.encode(content);
                ghostCache.uploadedFile = {
                    name: null,
                    type: 'text/plain',
                    size: encoded.byteLength,
                    lastModified: Date.now(),
                    content: encoded.buffer
                };
            }
            // Check if it's the object returned from ghost('upload')
            else if (file && typeof file === 'object' && file.content instanceof ArrayBuffer) {
                ghostCache.uploadedFile = {
                    name: file.name || 'file',
                    type: file.type || 'application/octet-stream',
                    size: file.size || file.content.byteLength,
                    lastModified: file.lastModified || Date.now(),
                    content: file.content
                };
            } 
            // Native File object
            else if (file instanceof File) {
                fileContent = await readFileAsArrayBuffer(file);
                ghostCache.uploadedFile = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    content: fileContent
                };
            } 
            // Pure ArrayBuffer
            else if (file instanceof ArrayBuffer) {
                ghostCache.uploadedFile = {
                    name: 'file',
                    type: 'application/octet-stream',
                    size: file.byteLength,
                    lastModified: Date.now(),
                    content: file
                };
            } 
            else {
                throw new Error('GhostCrypt: File must be File object, ArrayBuffer, or ghost upload result');
            }

            // Set key method
            encryptionAgent('setKeyMethod', keyMethod === 'password' ? 0 : 1);

            // Set key/password or keyfile
            if (keyMethod === 'password') {
                ghostCache.rawKey = password;
            } else if (keyMethod === 'keyfile') {
                if (keyfile) {
                    // Use provided keyfile for encryption
                    ghostCache.keyfileContent = keyfile;
                    // Load and parse keyfile (sets enteredKey)
                    const keyfileLoaded = decryptionAgent('loadKeyfile');
                    if (!keyfileLoaded) {
                        throw new Error('GhostCrypt: Invalid keyfile format');
                    }
                    // Copy to rawKey for encryption pipeline
                    ghostCache.rawKey = ghostCache.enteredKey;
                } else {
                    // Generate new keyfile
                    encryptionAgent('generateKeyfile');
                }
            }

            // Run encryption pipeline (without download)
            await encryptionAgent('keyDerivation');
            encryptionAgent('generateIvs');
            encryptionAgent('encryptAes');
            encryptionAgent('encryptChacha');
            encryptionAgent('calculateHmac');
            encryptionAgent('buildGhost');

            // Convert Uint8Array to ArrayBuffer for consistency
            const encryptedBuffer = ghostCache.ghost.buffer.slice(
                ghostCache.ghost.byteOffset,
                ghostCache.ghost.byteOffset + ghostCache.ghost.byteLength
            );

            // Build simple result
            const result = {
                success: true,
                action: 'encrypt',
                return: encryptedBuffer
            };

            // If keyfile was used, include it in result
            if (keyMethod === 'keyfile' && ghostCache.generatedKeyfile) {
                result.keyfile = ghostCache.generatedKeyfile;
            }

            if (onComplete) onComplete(result);
            return result;

        }

        // ===== DECRYPTION =====

        if (action === 'decrypt') {

            // Validate inputs
            if (!file && !content) {
                throw new Error('GhostCrypt: File or content required for decryption');
            }
            if (!keyMethod || !['password', 'keyfile'].includes(keyMethod)) {
                throw new Error('GhostCrypt: Valid keyMethod required (password or keyfile)');
            }
            if (keyMethod === 'password' && !password) {
                throw new Error('GhostCrypt: Password required when keyMethod is "password"');
            }
            if (keyMethod === 'keyfile' && !keyfile) {
                throw new Error('GhostCrypt: Keyfile required when keyMethod is "keyfile"');
            }

            // Track if this is content mode
            const isContentMode = !!content;

            // Process ghost file or content
            let fileContent;
            
            if (content) {
                // Content mode: content should be ArrayBuffer
                if (!(content instanceof ArrayBuffer)) {
                    throw new Error('GhostCrypt: Content for decryption must be ArrayBuffer');
                }
                ghostCache.uploadedFile = {
                    name: null,
                    type: 'application/octet-stream',
                    size: content.byteLength,
                    lastModified: Date.now(),
                    content: content
                };
            }
            // Check if it's the object returned from ghost('upload')
            else if (file && typeof file === 'object' && file.content instanceof ArrayBuffer) {
                ghostCache.uploadedFile = {
                    name: file.name || 'file.ghost',
                    type: file.type || 'application/octet-stream',
                    size: file.size || file.content.byteLength,
                    lastModified: file.lastModified || Date.now(),
                    content: file.content
                };
            }
            // Native File object
            else if (file instanceof File) {
                fileContent = await readFileAsArrayBuffer(file);
                ghostCache.uploadedFile = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    content: fileContent
                };
            } 
            // Pure ArrayBuffer
            else if (file instanceof ArrayBuffer) {
                ghostCache.uploadedFile = {
                    name: 'file.ghost',
                    type: 'application/octet-stream',
                    size: file.byteLength,
                    lastModified: Date.now(),
                    content: file
                };
            } 
            else {
                throw new Error('GhostCrypt: File must be File object, ArrayBuffer, or ghost upload result');
            }

            // Set key method
            encryptionAgent('setKeyMethod', keyMethod === 'password' ? 0 : 1);

            // Parse ghost file
            if (!decryptionAgent('parseGhost')) {
                throw new Error(ghostCache.error || 'Ghost file could not be read');
            }

            // Load keyfile if needed
            if (keyMethod === 'keyfile') {
                ghostCache.keyfileContent = keyfile;
                if (!decryptionAgent('loadKeyfile')) {
                    throw new Error(ghostCache.error || 'Keyfile could not be loaded');
                }
            } else {
                ghostCache.enteredKey = password;
            }

            // Derive keys
            await decryptionAgent('deriveKeys');

            // Verify HMAC (detects wrong password/keyfile)
            if (!decryptionAgent('verifyHmac')) {
                throw new Error(ghostCache.error || 'Wrong password or keyfile');
            }

            // Decrypt layers (without download)
            decryptionAgent('decryptChacha');
            decryptionAgent('decryptAes');

            // Determine return value based on mode
            let returnValue;
            
            if (isContentMode) {
                // Content mode: Return decrypted string
                const decoder = new TextDecoder();
                returnValue = decoder.decode(ghostCache.decryptedLayer2);
            } else {
                // File mode: Return ArrayBuffer
                const decryptedBuffer = ghostCache.decryptedLayer2.buffer.slice(
                    ghostCache.decryptedLayer2.byteOffset,
                    ghostCache.decryptedLayer2.byteOffset + ghostCache.decryptedLayer2.byteLength
                );
                returnValue = decryptedBuffer;
            }

            // Build simple result
            const result = {
                success: true,
                action: 'decrypt',
                return: returnValue
            };

            if (onComplete) onComplete(result);
            return result;

        }

    } catch (error) {

        // Error handling
        const errorMessage = error.message || 'Unknown error';
        ghostCache.error = errorMessage;

        if (onError) {
            onError(errorMessage);
        }

        return {
            success: false,
            action: action,
            error: errorMessage
        };

    } finally {
        
        // Restore original updateStatus function
        if (onProgress) {
            window.updateStatus = originalUpdateStatus;
        }

    }

}


/**
 * Helper function to read File as ArrayBuffer
 */

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}


/**
 * Helper function to download ArrayBuffer as file
 */

function downloadFile(arrayBuffer, filename) {
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}


/* =================================================== */
/* ========== TEMPORARY FILE AND DATA CACHE ========== */
/* =================================================== */


let ghostCache = {
    status: 'RESET',                    // Technical status for system (always updated)
    uiStatus: 'Ready',                  // User-friendly status for UI (throttled updates)
    lastUiUpdate: 0,                    // Timestamp of last UI status update (for throttling)
    error: null,                        // Error message if something goes wrong (null = no error)
    uploadedFile: null,                 // Uploaded file object with content as ArrayBuffer
    uploadedKeyfile: null,              // Uploaded keyfile object with content as ArrayBuffer
    cryptAction: null,                  // Current action: 'encrypt' or 'decrypt'
    chosenKeyMethod: null,              // Authentication method: 'password' or 'keyfile'
    rawKey: null,                       // Raw key from UI for encryption
    enteredKey: null,                   // Entered password/key for decryption
    keyfileContent: null,               // Uploaded .gkey file content for decryption
    generatedKeyfile: null,             // Generated keyfile object (for encryption)
    derivedKeys: null,                  // Derived encryption keys: aesKey, chachaKey, hmacKey, salt
    ivs: null,                         // Initialization vectors: aesIv, chachaNonce
    encryptedLayer1: null,             // AES-256 encrypted data (first layer)
    encryptedLayer2: null,             // ChaCha20 encrypted data (second layer, double encrypted)
    decryptedLayer1: null,             // ChaCha20 decrypted data (first decryption step)
    decryptedLayer2: null,             // AES-256 decrypted data (final, original file)
    hmac: null,                        // HMAC-SHA512 integrity tag
    ghost: null,                       // Final assembled .ghost file (binary)
    ghostParsed: null                  // Parsed ghost file structure (for decryption)
}


/* =================================================== */
/* ============== STATUS UPDATE SYSTEM =============== */
/* =================================================== */


function updateStatus(technicalStatus, uiStatusText) {

    // Always update technical status
    ghostCache.status = technicalStatus;

    // Update UI status only if 2 seconds have passed since last update
    const now = Date.now();
    const timeSinceLastUpdate = now - ghostCache.lastUiUpdate;

    if (timeSinceLastUpdate >= 2000) {
        ghostCache.uiStatus = uiStatusText;
        ghostCache.lastUiUpdate = now;
    }

}


/* =================================================== */
/* =================== FILE UPLOAD =================== */
/* =================================================== */


function ghostcryptUploadFile() {

    return new Promise((resolve, reject) => {

        let createFileInput = document.createElement('input');
        createFileInput.type = 'file';

        createFileInput.onchange = function (upload) {

            const file = upload.target.files[0];

            if (file) {

                const reader = new FileReader();

                reader.onload = function (event) {

                    ghostCache.uploadedFile = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        content: event.target.result
                    };

                    processFile();

                    // Resolve promise with uploaded file
                    resolve(ghostCache.uploadedFile);

                };

                reader.onerror = function (error) {
                    // Reject promise on read error
                    reject(new Error('File read error: ' + error));
                };

                reader.readAsArrayBuffer(file);

            } else {
                // User cancelled file selection
                reject(new Error('No file selected'));
            }
        };

        createFileInput.click();

    });

}

function ghostcryptUploadKeyfile() {

    return new Promise((resolve, reject) => {

        let createFileInput = document.createElement('input');
        createFileInput.type = 'file';
        createFileInput.accept = '.gkey';  // Only accept .gkey files

        createFileInput.onchange = function (upload) {

            const file = upload.target.files[0];

            if (file) {

                // Validate file extension
                if (!file.name.endsWith('.gkey')) {
                    reject(new Error('Invalid file type. Please select a .gkey file'));
                    return;
                }

                const reader = new FileReader();

                reader.onload = function (event) {

                    // Return keyfile as simple object with ArrayBuffer content
                    const keyfileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        content: event.target.result  // ArrayBuffer
                    };

                    // Store in cache
                    ghostCache.uploadedKeyfile = keyfileData;

                    // Resolve promise with keyfile data
                    resolve(keyfileData);

                };

                reader.onerror = function (error) {
                    // Reject promise on read error
                    reject(new Error('Keyfile read error: ' + error));
                };

                reader.readAsArrayBuffer(file);

            } else {
                // User cancelled file selection
                reject(new Error('No keyfile selected'));
            }
        };

        createFileInput.click();

    });

}

function processFile() {

    if (ghostCache.uploadedFile.name.endsWith('.ghost')) {
        ghostCache.cryptAction = 'decrypt';
    } else {
        ghostCache.cryptAction = 'encrypt';
    }

}


/* =================================================== */
/* ============== CRYPT HELP FUNCTIONS =============== */
/* =================================================== */


function generateRandomBytes(length) {

    return crypto.getRandomValues(new Uint8Array(length));

}

function wordArrayToUint8(wordArray) {

    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const u8 = new Uint8Array(sigBytes);

    for (let i = 0; i < sigBytes; i++) {
        u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return u8;

}


/* =================================================== */
/* =================== ENCRYPTION ==================== */
/* =================================================== */


const keyMethods = ['password', 'keyfile'];

function encryptionAgent(action, value) {

    if (action === 'initialize') {

        // Initialize new process and clear cache
        ghostCache = {
            status: 'RESET',
            uiStatus: 'Ready',
            lastUiUpdate: 0,
            error: null,
            uploadedFile: null,
            uploadedKeyfile: null,
            cryptAction: null,
            chosenKeyMethod: null,
            rawKey: null,
            enteredKey: null,
            keyfileContent: null,
            derivedKeys: null,
            ivs: null,
            encryptedLayer1: null,
            encryptedLayer2: null,
            decryptedLayer1: null,
            decryptedLayer2: null,
            hmac: null,
            ghost: null,
            ghostParsed: null
        }

        return true;

    }

    if (action === 'uploadFile') {

        // Call file upload function
        ghostcryptUploadFile();
        return true;

    }

    if (action === 'setKeyMethod') {

        // Set key method from keyMethods array
        ghostCache.chosenKeyMethod = keyMethods[value];
        return true;

    }

    if (action === 'generateKeyfile') {
        return generateKeyfile();
    }

    if (action === 'keyDerivation') {
        return keyDerivation();
    }

    if (action === 'generateIvs') {
        return generateIvs();
    }

    if (action === 'encryptAes') {
        return encryptAes();
    }

    if (action === 'encryptChacha') {
        return encryptChacha();
    }

    if (action === 'calculateHmac') {
        return calculateHmac();
    }

    if (action === 'buildGhost') {
        return buildGhost();
    }

    if (action === 'downloadGhost') {
        return downloadGhost();
    }

    // ===== DECRYPTION ACTIONS =====

    if (action === 'parseGhost') {
        return parseGhost();
    }

    if (action === 'loadKeyfile') {
        return loadKeyfile();
    }

    if (action === 'deriveKeysDecrypt') {
        return deriveKeysDecrypt();
    }

    if (action === 'verifyHmac') {
        return verifyHmac();
    }

    if (action === 'decryptChacha') {
        return decryptChacha();
    }

    if (action === 'decryptAes') {
        return decryptAes();
    }

    if (action === 'downloadDecrypted') {
        return downloadDecrypted();
    }

}


/* ****** KEYFILE GENERATION ****** */


function generateKeyfile() {

    // Generate 512-bit (64 bytes) random key material
    const keyMaterial = generateRandomBytes(64);

    // Convert to Base64 for storage in cache
    const keyBase64 = btoa(String.fromCharCode(...keyMaterial));

    // Calculate SHA-256 fingerprint (32 bytes) for verification
    const fingerprintWordArray = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(keyMaterial));
    const fingerprintHex = fingerprintWordArray.toString(CryptoJS.enc.Hex);
    
    // Convert hex fingerprint to bytes
    const fingerprintBytes = new Uint8Array(fingerprintHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

    // Build binary keyfile format (102 bytes total):
    // [0-4]   GKEY Magic Number (71, 75, 69, 89, 33) = "GKEY!"
    // [5]     Version (1)
    // [6-69]  Key Material (64 bytes)
    // [70-101] SHA-256 Fingerprint (32 bytes)
    
    const magic = new Uint8Array([71, 75, 69, 89, 33]); // "GKEY!"
    const version = new Uint8Array([1]);
    
    const keyfileBinary = new Uint8Array(102);
    keyfileBinary.set(magic, 0);              // Bytes 0-4: Magic
    keyfileBinary.set(version, 5);            // Byte 5: Version
    keyfileBinary.set(keyMaterial, 6);        // Bytes 6-69: Key (64 bytes)
    keyfileBinary.set(fingerprintBytes, 70);  // Bytes 70-101: Fingerprint (32 bytes)

    // Store binary keyfile in cache
    ghostCache.generatedKeyfile = keyfileBinary;
    
    // Store key material in cache for encryption
    ghostCache.rawKey = keyBase64;

    return true;

}


/* ****** KEY DERIVATION ****** */


async function keyDerivation() {

    updateStatus('KEY_DERIVATION', 'Deriving keys...');

    // Validate input material exists
    if (!ghostCache.rawKey || ghostCache.rawKey.length === 0) {
        ghostCache.status = 'INVALID_KEY';
        ghostCache.error = 'Password or keyfile is empty';
        throw new Error('Password or keyfile is empty');
    }

    // Generate salt for Argon2id
    const salt = generateRandomBytes(32);

    // Get input material (password or keyfile)
    const inputMaterial = ghostCache.rawKey;

    // Derive keys with Argon2id
    const result = await argon2.hash({
        pass: inputMaterial,
        salt: salt,
        time: 3,              // 3 iterations
        mem: 65536,           // 64 MB memory
        hashLen: 96,          // 96 bytes = 3 keys à 32 bytes
        parallelism: 4,
        type: argon2.ArgonType.Argon2id
    });

    const masterKey = result.hash;  // Uint8Array with 96 bytes

    // Split into 3 separate keys
    const derivedKeys = {
        aesKey: masterKey.slice(0, 32),       // First 32 bytes for AES
        chachaKey: masterKey.slice(32, 64),   // Next 32 bytes for ChaCha20
        hmacKey: masterKey.slice(64, 96),     // Last 32 bytes for HMAC
        salt: salt                               // Save salt (needed for decryption!)
    };

    // Store in cache
    ghostCache.derivedKeys = derivedKeys;

    updateStatus('KEYS_DERIVED', 'Keys ready');

    return true;

}


/* ****** GENERATE IVs / NONCES ****** */


function generateIvs() {

    updateStatus('GENERATING_IVS', 'Initializing...');

    // Generate random IVs/Nonces for each encryption layer
    const ivs = {
        aesIv: generateRandomBytes(16),        // AES-256 needs 16 bytes (128-bit)
        chachaNonce: generateRandomBytes(12)   // ChaCha20 needs 12 bytes (96-bit)
    };

    // Store in cache
    ghostCache.ivs = ivs;

    updateStatus('IVS_GENERATED', 'Initialization complete');

    return true;

}


/* ****** ENCRYPTION LAYER 1: AES-256-CBC ****** */


function encryptAes() {

    updateStatus('ENCRYPTING_AES', 'Ghost is emerging...');

    // Validate file data exists
    if (!ghostCache.uploadedFile || !ghostCache.uploadedFile.content) {
        throw new Error('No file content to encrypt');
    }

    // Validate keys and IVs exist
    if (!ghostCache.derivedKeys || !ghostCache.ivs) {
        throw new Error('Keys or IVs not initialized');
    }

    // Get file data
    const fileData = new Uint8Array(ghostCache.uploadedFile.content);

    // Convert to CryptoJS WordArray
    const fileWordArray = CryptoJS.lib.WordArray.create(fileData);

    // Convert key and IV to WordArray
    const aesKeyWordArray = CryptoJS.lib.WordArray.create(ghostCache.derivedKeys.aesKey);
    const aesIvWordArray = CryptoJS.lib.WordArray.create(ghostCache.ivs.aesIv);

    // Encrypt with AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(fileWordArray, aesKeyWordArray, {
        iv: aesIvWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert encrypted ciphertext back to Uint8Array
    const encryptedBytes = wordArrayToUint8(encrypted.ciphertext);

    // Store in cache for next layer
    ghostCache.encryptedLayer1 = encryptedBytes;

    updateStatus('AES_ENCRYPTED', 'Ghost is getting stronger...');

    return true;

}


/* ****** ENCRYPTION LAYER 2: ChaCha20 ****** */


function encryptChacha() {

    updateStatus('ENCRYPTING_CHACHA', 'Ghost is being reinforced...');

    // Validate Layer 1 data exists
    if (!ghostCache.encryptedLayer1) {
        throw new Error('Layer 1 encryption not completed');
    }

    // Get AES encrypted data from layer 1
    const layer1Data = ghostCache.encryptedLayer1;

    // Get key and nonce (already Uint8Array)
    const chachaKey = ghostCache.derivedKeys.chachaKey;
    const chachaNonce = ghostCache.ivs.chachaNonce;

    // Encrypt with ChaCha20
    const encryptedBytes = ChaCha20.encrypt(chachaKey, chachaNonce, layer1Data);

    // Store in cache (double encrypted now!)
    ghostCache.encryptedLayer2 = encryptedBytes;

    updateStatus('CHACHA_ENCRYPTED', 'Ghost is protected');

    return true;

}


/* ****** HMAC INTEGRITY CHECK ****** */


function calculateHmac() {

    updateStatus('CALCULATING_HMAC', 'Ghost is being sealed...');

    // Collect all data that needs to be authenticated
    const saltWordArray = CryptoJS.lib.WordArray.create(ghostCache.derivedKeys.salt);
    const aesIvWordArray = CryptoJS.lib.WordArray.create(ghostCache.ivs.aesIv);
    const chachaNonceWordArray = CryptoJS.lib.WordArray.create(ghostCache.ivs.chachaNonce);
    const encryptedDataWordArray = CryptoJS.lib.WordArray.create(ghostCache.encryptedLayer2);

    // Concatenate all data
    const dataToAuthenticate = CryptoJS.lib.WordArray.create()
        .concat(saltWordArray)
        .concat(aesIvWordArray)
        .concat(chachaNonceWordArray)
        .concat(encryptedDataWordArray);

    // Convert HMAC key to WordArray
    const hmacKeyWordArray = CryptoJS.lib.WordArray.create(ghostCache.derivedKeys.hmacKey);

    // Calculate HMAC-SHA512
    const hmac = CryptoJS.HmacSHA512(dataToAuthenticate, hmacKeyWordArray);

    // Convert to Uint8Array
    const hmacBytes = wordArrayToUint8(hmac);

    // Store in cache
    ghostCache.hmac = hmacBytes;

    updateStatus('HMAC_CALCULATED', 'Ghost sealed');

    return true;

}


/* ****** BUILD GHOST FILE ****** */


function buildGhost() {

    updateStatus('BUILDING_GHOST', 'Ghost is materializing...');

    // Binary .ghost file structure:
    // [0-4]     GHOST Magic Number (71, 72, 79, 83, 84)
    // [5]       Version (1)
    // [6-37]    Salt (32 bytes)
    // [38-53]   AES IV (16 bytes)
    // [54-65]   ChaCha20 Nonce (12 bytes)
    // [66-N]    Encrypted Data (variable)
    // [N+1-N+64] HMAC-SHA512 (64 bytes)

    const magicBytes = new Uint8Array([71, 72, 79, 83, 84]); // "GHOST"
    const version = new Uint8Array([1]);

    const salt = ghostCache.derivedKeys.salt;
    const aesIv = ghostCache.ivs.aesIv;
    const chachaNonce = ghostCache.ivs.chachaNonce;
    const encryptedData = ghostCache.encryptedLayer2;
    const hmac = ghostCache.hmac;

    const totalSize =
        magicBytes.length +    // 5 bytes
        version.length +        // 1 byte
        salt.length +           // 32 bytes
        aesIv.length +         // 16 bytes
        chachaNonce.length +   // 12 bytes
        encryptedData.length + // variable
        hmac.length;            // 64 bytes

    // Create ghost file
    const ghost = new Uint8Array(totalSize);

    let offset = 0;

    // Assemble the ghost file structure
    ghost.set(magicBytes, offset); offset += magicBytes.length;
    ghost.set(version, offset); offset += version.length;
    ghost.set(salt, offset); offset += salt.length;
    ghost.set(aesIv, offset); offset += aesIv.length;
    ghost.set(chachaNonce, offset); offset += chachaNonce.length;
    ghost.set(encryptedData, offset); offset += encryptedData.length;
    ghost.set(hmac, offset);

    // Store the ghost in cache
    ghostCache.ghost = ghost;

    updateStatus('GHOST_BUILT', 'Ghost is ready');

    return true;

}


/* ****** DOWNLOAD GHOST FILE ****** */


function downloadGhost() {

    updateStatus('DOWNLOADING_GHOST', 'Ghost is being released...');

    // Create blob from ghost bytes
    const blob = new Blob([ghostCache.ghost], { type: 'application/octet-stream' });

    // Generate filename
    const originalName = ghostCache.uploadedFile.name;
    const ghostFilename = originalName + '.ghost';

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ghostFilename;

    // Trigger download
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    updateStatus('ENCRYPTION_COMPLETE', 'Ghost unleashed! 👻');

    return true;

}


/* =================================================== */
/* =================== DECRYPTION ==================== */
/* =================================================== */


function decryptionAgent(action) {

    if (action === 'parseGhost') {
        return parseGhost();
    }

    if (action === 'loadKeyfile') {
        return loadKeyfile();
    }

    if (action === 'deriveKeys') {
        return deriveKeysDecrypt();
    }

    if (action === 'verifyHmac') {
        // Verify HMAC integrity - detects wrong password/keyfile
        const valid = verifyHmac();
        
        if (!valid) {
            ghostCache.status = 'WRONG_KEY';
            ghostCache.error = 'Wrong password or keyfile';
            return false;
        }
        
        return true;
    }

    if (action === 'decryptChacha') {
        return decryptChacha();
    }

    if (action === 'decryptAes') {
        return decryptAes();
    }

    if (action === 'download') {
        return downloadDecrypted();
    }

}


/* ****** PARSE GHOST FILE ****** */


function parseGhost() {

    updateStatus('PARSING_GHOST', 'Reading ghost...');

    // Parse binary .ghost file structure:
    // [0-4]     GHOST Magic Number (5 bytes)
    // [5]       Version (1 byte)
    // [6-37]    Salt (32 bytes)
    // [38-53]   AES IV (16 bytes)
    // [54-65]   ChaCha20 Nonce (12 bytes)
    // [66-N]    Encrypted Data (variable)
    // [N+1-N+64] HMAC-SHA512 (64 bytes)

    const ghostBytes = new Uint8Array(ghostCache.uploadedFile.content);

    // Minimum valid ghost file size: 5 + 1 + 32 + 16 + 12 + 1 + 64 = 131 bytes
    if (ghostBytes.length < 131) {
        ghostCache.status = 'INVALID_FILE';
        ghostCache.error = 'File too small to be a valid .ghost file';
        return false;
    }

    let offset = 0;

    // Parse and validate magic bytes "GHOST"
    const magicBytes = ghostBytes.slice(offset, offset + 5);
    offset += 5;
    const magicString = String.fromCharCode(...magicBytes);

    if (magicString !== "GHOST") {
        ghostCache.status = 'INVALID_FILE';
        ghostCache.error = 'Invalid .ghost file - wrong magic number';
        return false;
    }

    // Parse and validate version
    const version = ghostBytes[offset];
    offset += 1;

    if (version !== 1) {
        ghostCache.status = 'UNSUPPORTED_VERSION';
        ghostCache.error = `Unsupported .ghost version ${version}`;
        return false;
    }

    // Parse salt (32 bytes)
    const salt = ghostBytes.slice(offset, offset + 32);
    offset += 32;

    // Parse AES IV (16 bytes)
    const aesIv = ghostBytes.slice(offset, offset + 16);
    offset += 16;

    // Parse ChaCha20 nonce (12 bytes)
    const chachaNonce = ghostBytes.slice(offset, offset + 12);
    offset += 12;

    // Parse encrypted data (everything except last 64 bytes which is HMAC)
    const encryptedDataLength = ghostBytes.length - offset - 64;
    
    if (encryptedDataLength < 1) {
        ghostCache.status = 'INVALID_FILE';
        ghostCache.error = 'Invalid .ghost file - no encrypted data';
        return false;
    }

    const encryptedData = ghostBytes.slice(offset, offset + encryptedDataLength);
    offset += encryptedDataLength;

    // Parse HMAC (64 bytes)
    const hmac = ghostBytes.slice(offset, offset + 64);

    // Validate HMAC was fully extracted
    if (hmac.length !== 64) {
        ghostCache.status = 'INVALID_FILE';
        ghostCache.error = 'Invalid .ghost file - incomplete HMAC';
        return false;
    }

    // Store parsed data
    ghostCache.ghostParsed = {
        magic: magicString,
        version: version,
        salt: salt,
        aesIv: aesIv,
        chachaNonce: chachaNonce,
        encryptedData: encryptedData,
        hmac: hmac
    };

    ghostCache.status = 'GHOST_PARSED';
    return true;

}


/* ****** LOAD KEYFILE ****** */


function loadKeyfile() {

    try {
        // Parse binary keyfile format (102 bytes total):
        // [0-4]   GKEY Magic Number (71, 75, 69, 89, 33) = "GKEY!"
        // [5]     Version (1)
        // [6-69]  Key Material (64 bytes)
        // [70-101] SHA-256 Fingerprint (32 bytes)
        
        const keyfileBytes = new Uint8Array(ghostCache.keyfileContent);

        // Validate minimum size
        if (keyfileBytes.length < 102) {
            ghostCache.status = 'INVALID_KEYFILE';
            ghostCache.error = 'Invalid .gkey file: file too small';
            return false;
        }

        // Validate magic number "GKEY!" (71, 75, 69, 89, 33)
        if (keyfileBytes[0] !== 71 || keyfileBytes[1] !== 75 || 
            keyfileBytes[2] !== 69 || keyfileBytes[3] !== 89 || keyfileBytes[4] !== 33) {
            ghostCache.status = 'INVALID_KEYFILE';
            ghostCache.error = 'Invalid .gkey file: wrong file format';
            return false;
        }

        // Check version (currently only version 1 is supported)
        const version = keyfileBytes[5];
        if (version !== 1) {
            ghostCache.status = 'INVALID_KEYFILE';
            ghostCache.error = `Invalid .gkey file: unsupported version ${version}`;
            return false;
        }

        // Extract key material (64 bytes at position 6-69)
        const keyMaterial = keyfileBytes.slice(6, 70);
        
        // Convert to Base64 for compatibility with existing key derivation
        const keyMaterialBase64 = btoa(String.fromCharCode(...keyMaterial));

        // Store key material
        ghostCache.enteredKey = keyMaterialBase64;
        ghostCache.status = 'KEYFILE_LOADED';
        return true;

    } catch (error) {
        ghostCache.status = 'KEYFILE_PARSE_ERROR';
        ghostCache.error = 'Keyfile could not be read';
        return false;
    }

}


/* ****** KEY DERIVATION FOR DECRYPTION ****** */


async function deriveKeysDecrypt() {

    updateStatus('DERIVING_KEYS_DECRYPT', 'Verifying keys...');

    // Validate input material exists
    if (!ghostCache.enteredKey || ghostCache.enteredKey.length === 0) {
        ghostCache.status = 'INVALID_KEY';
        ghostCache.error = 'Password or keyfile is empty';
        throw new Error('Password or keyfile is empty');
    }

    // Get salt from parsed ghost file
    const salt = ghostCache.ghostParsed.salt;

    // Get input material (password or keyfile - both stored in enteredKey)
    const inputMaterial = ghostCache.enteredKey;

    // Derive keys with Argon2id (same as encryption)
    const result = await argon2.hash({
        pass: inputMaterial,
        salt: salt,
        time: 3,
        mem: 65536,
        hashLen: 96,
        parallelism: 4,
        type: argon2.ArgonType.Argon2id
    });

    const masterKey = result.hash;

    // Split into 3 separate keys
    const derivedKeys = {
        aesKey: masterKey.slice(0, 32),
        chachaKey: masterKey.slice(32, 64),
        hmacKey: masterKey.slice(64, 96),
        salt: salt
    };

    // Store in cache
    ghostCache.derivedKeys = derivedKeys;

    // Also store IVs from ghost file
    ghostCache.ivs = {
        aesIv: ghostCache.ghostParsed.aesIv,
        chachaNonce: ghostCache.ghostParsed.chachaNonce
    };

    ghostCache.status = 'KEYS_DERIVED';
    return true;

}


/* ****** VERIFY HMAC INTEGRITY ****** */


function verifyHmac() {

    updateStatus('VERIFYING_HMAC', 'Verifying seal...');

    // Validate stored HMAC exists and has correct length
    const storedHmac = ghostCache.ghostParsed.hmac;
    if (!storedHmac || storedHmac.length !== 64) {
        ghostCache.status = 'HMAC_INVALID';
        ghostCache.error = 'Invalid or corrupted HMAC';
        return false;
    }

    // Collect all data that was authenticated
    const saltWordArray = CryptoJS.lib.WordArray.create(ghostCache.ghostParsed.salt);
    const aesIvWordArray = CryptoJS.lib.WordArray.create(ghostCache.ghostParsed.aesIv);
    const chachaNonceWordArray = CryptoJS.lib.WordArray.create(ghostCache.ghostParsed.chachaNonce);
    const encryptedDataWordArray = CryptoJS.lib.WordArray.create(ghostCache.ghostParsed.encryptedData);

    // Concatenate all data
    const dataToAuthenticate = CryptoJS.lib.WordArray.create()
        .concat(saltWordArray)
        .concat(aesIvWordArray)
        .concat(chachaNonceWordArray)
        .concat(encryptedDataWordArray);

    // Convert HMAC key to WordArray
    const hmacKeyWordArray = CryptoJS.lib.WordArray.create(ghostCache.derivedKeys.hmacKey);

    // Calculate HMAC-SHA512
    const calculatedHmac = CryptoJS.HmacSHA512(dataToAuthenticate, hmacKeyWordArray);
    const calculatedHmacBytes = wordArrayToUint8(calculatedHmac);

    // Constant-time comparison (prevents timing attacks)
    let mismatch = 0;
    for (let i = 0; i < 64; i++) {
        mismatch |= calculatedHmacBytes[i] ^ storedHmac[i];
    }

    if (mismatch !== 0) {
        ghostCache.status = 'HMAC_FAILED';
        ghostCache.error = 'Wrong password or corrupted file';
        return false;
    }

    ghostCache.status = 'HMAC_VERIFIED';
    return true;

}


/* ****** DECRYPTION LAYER 1: ChaCha20 ****** */


function decryptChacha() {

    updateStatus('DECRYPTING_CHACHA', 'Ghost is being freed...');

    // Validate encrypted data exists
    if (!ghostCache.ghostParsed || !ghostCache.ghostParsed.encryptedData) {
        throw new Error('No encrypted data to decrypt');
    }

    // Validate keys exist
    if (!ghostCache.derivedKeys || !ghostCache.ivs) {
        throw new Error('Keys not derived yet');
    }

    // Get encrypted data from ghost file
    const encryptedData = ghostCache.ghostParsed.encryptedData;

    // Get key and nonce
    const chachaKey = ghostCache.derivedKeys.chachaKey;
    const chachaNonce = ghostCache.ivs.chachaNonce;

    // Decrypt with ChaCha20 (encryption and decryption are the same for stream ciphers)
    const decryptedBytes = ChaCha20.decrypt(chachaKey, chachaNonce, encryptedData);

    // Store decrypted layer 1
    ghostCache.decryptedLayer1 = decryptedBytes;

    ghostCache.status = 'CHACHA_DECRYPTED';
    return true;

}


/* ****** DECRYPTION LAYER 2: AES-256-CBC ****** */


function decryptAes() {

    updateStatus('DECRYPTING_AES', 'Ghost is being revealed...');

    // Validate Layer 1 decryption completed
    if (!ghostCache.decryptedLayer1) {
        throw new Error('Layer 1 decryption not completed');
    }

    // Get ChaCha decrypted data
    const layer1Data = ghostCache.decryptedLayer1;

    // Convert to CryptoJS WordArray
    const dataWordArray = CryptoJS.lib.WordArray.create(layer1Data);

    // Convert key and IV to WordArray
    const aesKeyWordArray = CryptoJS.lib.WordArray.create(ghostCache.derivedKeys.aesKey);
    const aesIvWordArray = CryptoJS.lib.WordArray.create(ghostCache.ivs.aesIv);

    // Create CipherParams object
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: dataWordArray
    });

    // Decrypt with AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(cipherParams, aesKeyWordArray, {
        iv: aesIvWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert decrypted data to Uint8Array
    const decryptedBytes = wordArrayToUint8(decrypted);

    // Validate decryption produced data
    if (decryptedBytes.length === 0) {
        throw new Error('Decryption failed - wrong password or corrupted file');
    }

    // Store original file data
    ghostCache.decryptedLayer2 = decryptedBytes;

    ghostCache.status = 'DECRYPTION_COMPLETE';
    return true;

}


/* ****** DOWNLOAD DECRYPTED FILE ****** */


function downloadDecrypted() {

    updateStatus('DOWNLOADING_DECRYPTED', 'Ghost reveals its secret...');

    // Create blob from decrypted data
    const blob = new Blob([ghostCache.decryptedLayer2], { type: 'application/octet-stream' });

    // Generate filename (remove .ghost extension)
    let originalName = ghostCache.uploadedFile.name;
    if (originalName.endsWith('.ghost')) {
        originalName = originalName.slice(0, -6); // Remove ".ghost"
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName;

    // Trigger download
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    updateStatus('DECRYPTION_COMPLETE', 'Ghost decrypted! 🔓');

    return true;

}



// ***************************************************************************************** \\