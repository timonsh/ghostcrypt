"use strict";


/* =================================================== */
/* =============== MAIN GHOST FUNCTION =============== */
/* =================================================== */


/**
 * GhostCrypt - Main encryption/decryption function
 * 
 * @param {Object} options - Configuration object
 * @param {string} options.action - 'encrypt' | 'decrypt' | 'generate_keyfile'
 * @param {File|ArrayBuffer} options.file - File to encrypt/decrypt (optional for generate_keyfile)
 * @param {string} options.key_method - 'password' | 'keyfile'
 * @param {string} options.password - Password for encryption/decryption (required if key_method = 'password')
 * @param {ArrayBuffer} options.keyfile - Keyfile content for decryption (required if key_method = 'keyfile' and action = 'decrypt')
 * @param {Function} options.on_progress - Callback for progress updates (receives: status, ui_status)
 * @param {Function} options.on_error - Callback for errors (receives: error message)
 * @param {Function} options.on_complete - Callback when done (receives: result object)
 * 
 * @returns {Promise<Object>} Result object with status and data
 * 
 * @example
 * // Encrypt with password
 * await ghost({
 *   action: 'encrypt',
 *   file: uploadedFile,
 *   key_method: 'password',
 *   password: 'MySecurePassword123',
 *   on_progress: (status, ui_status) => console.log(ui_status),
 *   on_complete: (result) => console.log('Done!', result)
 * });
 * 
 * @example
 * // Decrypt with keyfile
 * await ghost({
 *   action: 'decrypt',
 *   file: ghostFile,
 *   key_method: 'keyfile',
 *   keyfile: keyfile_array_buffer,
 *   on_error: (error) => alert(error)
 * });
 * 
 * @example
 * // Generate keyfile
 * await ghost({
 *   action: 'generate_keyfile',
 *   on_complete: (result) => console.log('Keyfile generated:', result.fingerprint)
 * });
 */


async function ghost(options) {

    // Validate options
    if (!options || typeof options !== 'object') {
        throw new Error('GhostCrypt: Options object required');
    }

    const {
        action,
        file,
        key_method,
        password,
        keyfile,
        on_progress,
        on_error,
        on_complete
    } = options;

    // Validate action
    if (!['encrypt', 'decrypt', 'generate_keyfile'].includes(action)) {
        throw new Error(`GhostCrypt: Invalid action "${action}". Use 'encrypt', 'decrypt', or 'generate_keyfile'`);
    }

    // Initialize fresh cache
    encryption_agent('initialize');

    // Setup progress callback wrapper
    if (on_progress) {
        const original_update_status = update_status;
        window.update_status = function (technical_status, ui_status_text) {
            original_update_status(technical_status, ui_status_text);
            on_progress(technical_status, ui_status_text);
        };
    }

    try {

        // ===== GENERATE KEYFILE =====
        if (action === 'generate_keyfile') {

            const success = encryption_agent('generate_keyfile');

            if (success) {
                const result = {
                    success: true,
                    action: 'generate_keyfile',
                    key_material: ghost_cache.raw_key,
                    message: 'Keyfile erfolgreich generiert'
                };

                if (on_complete) on_complete(result);
                return result;
            }

        }

        // ===== ENCRYPTION =====

        if (action === 'encrypt') {

            // Validate inputs
            if (!file) {
                throw new Error('GhostCrypt: File required for encryption');
            }
            if (!key_method || !['password', 'keyfile'].includes(key_method)) {
                throw new Error('GhostCrypt: Valid key_method required (password or keyfile)');
            }
            if (key_method === 'password' && !password) {
                throw new Error('GhostCrypt: Password required when key_method is "password"');
            }

            // Process file
            let file_content;
            if (file instanceof File) {
                file_content = await read_file_as_array_buffer(file);
                ghost_cache.uploaded_file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    last_modified: file.lastModified,
                    content: file_content
                };
            } else if (file instanceof ArrayBuffer) {
                ghost_cache.uploaded_file = {
                    name: 'file',
                    type: 'application/octet-stream',
                    size: file.byteLength,
                    last_modified: Date.now(),
                    content: file
                };
            } else {
                throw new Error('GhostCrypt: File must be File object or ArrayBuffer');
            }

            // Set key method
            encryption_agent('set_key_method', key_method === 'password' ? 0 : 1);

            // Set key/password
            if (key_method === 'password') {
                ghost_cache.raw_key = password;
            } else if (key_method === 'keyfile') {
                // For keyfile encryption: generate new keyfile first
                encryption_agent('generate_keyfile');
            }

            // Run encryption pipeline
            await encryption_agent('key_derivation');
            encryption_agent('generate_ivs');
            encryption_agent('encrypt_aes');
            encryption_agent('encrypt_chacha');
            encryption_agent('calculate_hmac');
            encryption_agent('build_ghost');
            encryption_agent('download_ghost');

            const result = {
                success: true,
                action: 'encrypt',
                original_filename: ghost_cache.uploaded_file.name,
                ghost_filename: ghost_cache.uploaded_file.name + '.ghost',
                original_size: ghost_cache.uploaded_file.size,
                encrypted_size: ghost_cache.ghost.byteLength,
                message: 'Verschlüsselung erfolgreich abgeschlossen'
            };

            if (on_complete) on_complete(result);
            return result;

        }

        // ===== DECRYPTION =====

        if (action === 'decrypt') {

            // Validate inputs
            if (!file) {
                throw new Error('GhostCrypt: File required for decryption');
            }
            if (!key_method || !['password', 'keyfile'].includes(key_method)) {
                throw new Error('GhostCrypt: Valid key_method required (password or keyfile)');
            }
            if (key_method === 'password' && !password) {
                throw new Error('GhostCrypt: Password required when key_method is "password"');
            }
            if (key_method === 'keyfile' && !keyfile) {
                throw new Error('GhostCrypt: Keyfile required when key_method is "keyfile"');
            }

            // Process ghost file
            let file_content;
            if (file instanceof File) {
                file_content = await read_file_as_array_buffer(file);
                ghost_cache.uploaded_file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    last_modified: file.lastModified,
                    content: file_content
                };
            } else if (file instanceof ArrayBuffer) {
                ghost_cache.uploaded_file = {
                    name: 'file.ghost',
                    type: 'application/octet-stream',
                    size: file.byteLength,
                    last_modified: Date.now(),
                    content: file
                };
            } else {
                throw new Error('GhostCrypt: File must be File object or ArrayBuffer');
            }

            // Set key method
            encryption_agent('set_key_method', key_method === 'password' ? 0 : 1);

            // Parse ghost file
            if (!decryption_agent('parse_ghost')) {
                throw new Error(ghost_cache.error || 'Ghost-Datei konnte nicht gelesen werden');
            }

            // Load keyfile if needed
            if (key_method === 'keyfile') {
                ghost_cache.keyfile_content = keyfile;
                if (!decryption_agent('load_keyfile')) {
                    throw new Error(ghost_cache.error || 'Keyfile konnte nicht geladen werden');
                }
            } else {
                ghost_cache.entered_key = password;
            }

            // Derive keys
            await decryption_agent('derive_keys');

            // Verify HMAC (detects wrong password/keyfile)
            if (!decryption_agent('verify_hmac')) {
                throw new Error(ghost_cache.error || 'Falsches Passwort oder Keyfile');
            }

            // Decrypt layers
            decryption_agent('decrypt_chacha');
            decryption_agent('decrypt_aes');
            decryption_agent('download');

            // Get original filename
            let original_name = ghost_cache.uploaded_file.name;
            if (original_name.endsWith('.ghost')) {
                original_name = original_name.slice(0, -6);
            }

            const result = {
                success: true,
                action: 'decrypt',
                original_filename: original_name,
                encrypted_size: ghost_cache.uploaded_file.size,
                decrypted_size: ghost_cache.decrypted_layer_2.byteLength,
                message: 'Entschlüsselung erfolgreich abgeschlossen'
            };

            if (on_complete) on_complete(result);
            return result;

        }

    } catch (error) {

        // Error handling
        const error_message = error.message || 'Unbekannter Fehler';
        ghost_cache.error = error_message;

        if (on_error) {
            on_error(error_message);
        }

        return {
            success: false,
            action: action,
            error: error_message
        };

    }

}


/**
 * Helper function to read File as ArrayBuffer
 */

function read_file_as_array_buffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}


/* =================================================== */
/* ========== TEMPORARY FILE AND DATA CACHE ========== */
/* =================================================== */


let ghost_cache = {
    status: 'RESET',                    // Technical status for system (always updated)
    ui_status: 'Bereit',                // User-friendly status for UI (throttled updates)
    last_ui_update: 0,                  // Timestamp of last UI status update (for throttling)
    error: null,                        // Error message if something goes wrong (null = no error)
    uploaded_file: null,                // Uploaded file object with content as ArrayBuffer
    crypt_action: null,                 // Current action: 'encrypt' or 'decrypt'
    chosen_key_method: null,            // Authentication method: 'password' or 'keyfile'
    raw_key: null,                      // Raw key from UI for encryption
    entered_key: null,                  // Entered password/key for decryption
    keyfile_content: null,              // Uploaded .gkey file content for decryption
    derived_keys: null,                 // Derived encryption keys: aes_key, chacha_key, hmac_key, salt
    ivs: null,                          // Initialization vectors: aes_iv, chacha_nonce
    encrypted_layer_1: null,            // AES-256 encrypted data (first layer)
    encrypted_layer_2: null,            // ChaCha20 encrypted data (second layer, double encrypted)
    decrypted_layer_1: null,            // ChaCha20 decrypted data (first decryption step)
    decrypted_layer_2: null,            // AES-256 decrypted data (final, original file)
    hmac: null,                         // HMAC-SHA512 integrity tag
    ghost: null,                        // Final assembled .ghost file (binary)
    ghost_parsed: null                  // Parsed ghost file structure (for decryption)
}


/* =================================================== */
/* ============== STATUS UPDATE SYSTEM =============== */
/* =================================================== */


function update_status(technical_status, ui_status_text) {

    // Always update technical status
    ghost_cache.status = technical_status;

    // Update UI status only if 2 seconds have passed since last update
    const now = Date.now();
    const time_since_last_update = now - ghost_cache.last_ui_update;

    if (time_since_last_update >= 2000) {
        ghost_cache.ui_status = ui_status_text;
        ghost_cache.last_ui_update = now;
    }

}


/* =================================================== */
/* =================== FILE UPLOAD =================== */
/* =================================================== */


function upload_file() {

    let create_file_input = document.createElement('input');
    create_file_input.type = 'file';

    create_file_input.onchange = function (upload) {

        const file = upload.target.files[0];

        if (file) {

            const reader = new FileReader();

            reader.onload = function (event) {

                ghost_cache.uploaded_file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    last_modified: file.lastModified,
                    content: event.target.result
                };

                process_file();

            };

            reader.readAsArrayBuffer(file);

        }
    }

    create_file_input.click();

}

function process_file() {

    if (ghost_cache.uploaded_file.name.endsWith('.ghost')) {
        ghost_cache.crypt_action = 'decrypt';
    } else {
        ghost_cache.crypt_action = 'encrypt';
    }

}


/* =================================================== */
/* ============== CRYPT HELP FUNCTIONS =============== */
/* =================================================== */


function generate_random_bytes(length) {

    return crypto.getRandomValues(new Uint8Array(length));

}

function word_array_to_uint8(word_array) {

    const words = word_array.words;
    const sig_bytes = word_array.sigBytes;
    const u8 = new Uint8Array(sig_bytes);

    for (let i = 0; i < sig_bytes; i++) {
        u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    return u8;

}


/* =================================================== */
/* =================== ENCRYPTION ==================== */
/* =================================================== */


const key_methods = ['password', 'keyfile'];

function encryption_agent(action, value) {

    if (action === 'initialize') {

        // initialize new process and clear cache

        ghost_cache = {
            status: 'RESET',
            ui_status: 'Bereit',
            last_ui_update: 0,
            error: null,
            uploaded_file: null,
            crypt_action: null,
            chosen_key_method: null,
            raw_key: null,
            entered_key: null,
            keyfile_content: null,
            derived_keys: null,
            ivs: null,
            encrypted_layer_1: null,
            encrypted_layer_2: null,
            decrypted_layer_1: null,
            decrypted_layer_2: null,
            hmac: null,
            ghost: null,
            ghost_parsed: null
        }

        return true;

    }

    if (action === 'upload_file') {

        // call file upload function
        upload_file();

        return true;

    }

    if (action === 'set_key_method') {

        // set key method from arr "key_methods"

        ghost_cache.chosen_key_method = key_methods[value];
        return true;

    }

    if (action === 'generate_keyfile') {

        // generate and download .gkey file
        return generate_keyfile();

    }

    if (action === 'key_derivation') {

        // derive encryption keys from password or keyfile
        return key_derivation();

    }

    if (action === 'generate_ivs') {

        // generate IVs and nonces for encryption layers
        return generate_ivs();

    }

    if (action === 'encrypt_aes') {

        // first encryption layer: AES-256-CBC
        return encrypt_aes();

    }

    if (action === 'encrypt_chacha') {

        // second encryption layer: ChaCha20
        return encrypt_chacha();

    }

    if (action === 'calculate_hmac') {

        // calculate HMAC-SHA512 for integrity
        return calculate_hmac();

    }

    if (action === 'build_ghost') {

        // assemble the final ghost file
        return build_ghost();

    }

    if (action === 'download_ghost') {

        // download the ghost file
        return download_ghost();

    }

    // ===== DECRYPTION ACTIONS =====

    if (action === 'parse_ghost') {

        // parse the uploaded .ghost file
        return parse_ghost();

    }

    if (action === 'load_keyfile') {

        // load and parse .gkey file
        return load_keyfile();

    }

    if (action === 'derive_keys_decrypt') {

        // derive keys for decryption
        return derive_keys_decrypt();

    }

    if (action === 'verify_hmac') {

        // verify HMAC integrity
        return verify_hmac();

    }

    if (action === 'decrypt_chacha') {

        // first decryption layer: ChaCha20
        return decrypt_chacha();

    }

    if (action === 'decrypt_aes') {

        // second decryption layer: AES-256-CBC
        return decrypt_aes();

    }

    if (action === 'download_decrypted') {

        // download the decrypted file
        return download_decrypted();

    }

}


/* ****** KEYFILE GENERATION ****** */


function generate_keyfile() {

    // Generate 512-bit (64 bytes) random key
    const key_material = generate_random_bytes(64);

    // Convert to Base64 for storage
    const key_base64 = btoa(String.fromCharCode(...key_material));

    // Calculate SHA-256 fingerprint
    const fingerprint_word_array = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(key_material));
    const fingerprint = fingerprint_word_array.toString(CryptoJS.enc.Hex);

    // Create .gkey file content
    const gkey_data = {
        version: 1,
        key_material: key_base64,
        created: new Date().toISOString(),
        fingerprint: fingerprint
    };

    // Convert to JSON string
    const gkey_json = JSON.stringify(gkey_data, null, 2);

    // Create blob and download
    const blob = new Blob([gkey_json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ghostcrypt-key.gkey';
    link.click();
    URL.revokeObjectURL(url);

    // Store key material in cache for encryption
    ghost_cache.raw_key = key_base64;

    return true;

}


/* ****** KEY DERIVATION ****** */


async function key_derivation() {

    update_status('KEY_DERIVATION', 'Schlüssel werden abgeleitet...');

    // Generate salt for Argon2id
    const salt = generate_random_bytes(32);

    let input_material;

    if (ghost_cache.chosen_key_method === 'password') {

        // Use password directly
        input_material = ghost_cache.raw_key;

    } else if (ghost_cache.chosen_key_method === 'keyfile') {

        // If keyfile: raw_key should contain the keyfile data
        // For now: use raw_key as is
        // Later: could be JSON with key material
        input_material = ghost_cache.raw_key;

    }

    // Derive keys with Argon2id
    const result = await argon2.hash({
        pass: input_material,
        salt: salt,
        time: 3,              // 3 iterations
        mem: 65536,           // 64 MB memory
        hashLen: 96,          // 96 bytes = 3 keys à 32 bytes
        parallelism: 4,
        type: argon2.ArgonType.Argon2id
    });

    const master_key = result.hash;  // Uint8Array with 96 bytes

    // Split into 3 separate keys
    const derived_keys = {
        aes_key: master_key.slice(0, 32),       // First 32 bytes for AES
        chacha_key: master_key.slice(32, 64),   // Next 32 bytes for ChaCha20
        hmac_key: master_key.slice(64, 96),     // Last 32 bytes for HMAC
        salt: salt                               // Save salt (needed for decryption!)
    };

    // Store in cache
    ghost_cache.derived_keys = derived_keys;

    update_status('KEYS_DERIVED', 'Schlüssel bereit');

    return true;

}


/* ****** GENERATE IVs / NONCES ****** */


function generate_ivs() {

    update_status('GENERATING_IVS', 'Initialisierung...');

    // Generate random IVs/Nonces for each encryption layer
    const ivs = {
        aes_iv: generate_random_bytes(16),        // AES-256 needs 16 bytes (128-bit)
        chacha_nonce: generate_random_bytes(12)   // ChaCha20 needs 12 bytes (96-bit)
    };

    // Store in cache
    ghost_cache.ivs = ivs;

    update_status('IVS_GENERATED', 'Initialisierung abgeschlossen');

    return true;

}


/* ****** ENCRYPTION LAYER 1: AES-256-CBC ****** */


function encrypt_aes() {

    update_status('ENCRYPTING_AES', 'Geist entsteht...');

    // Get file data
    const file_data = new Uint8Array(ghost_cache.uploaded_file.content);

    // Convert to CryptoJS WordArray
    const file_word_array = CryptoJS.lib.WordArray.create(file_data);

    // Convert key and IV to WordArray
    const aes_key_word_array = CryptoJS.lib.WordArray.create(ghost_cache.derived_keys.aes_key);
    const aes_iv_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ivs.aes_iv);

    // Encrypt with AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(file_word_array, aes_key_word_array, {
        iv: aes_iv_word_array,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert encrypted ciphertext back to Uint8Array
    const encrypted_bytes = word_array_to_uint8(encrypted.ciphertext);

    // Store in cache for next layer
    ghost_cache.encrypted_layer_1 = encrypted_bytes;

    update_status('AES_ENCRYPTED', 'Geist wird stärker...');

    return true;

}


/* ****** ENCRYPTION LAYER 2: ChaCha20 ****** */


function encrypt_chacha() {

    update_status('ENCRYPTING_CHACHA', 'Geist wird verstärkt...');

    // Get AES encrypted data from layer 1
    const layer_1_data = ghost_cache.encrypted_layer_1;

    // Get key and nonce (already Uint8Array)
    const chacha_key = ghost_cache.derived_keys.chacha_key;
    const chacha_nonce = ghost_cache.ivs.chacha_nonce;

    // Encrypt with ChaCha20
    const encrypted_bytes = ChaCha20.encrypt(chacha_key, chacha_nonce, layer_1_data);

    // Store in cache (double encrypted now!)
    ghost_cache.encrypted_layer_2 = encrypted_bytes;

    update_status('CHACHA_ENCRYPTED', 'Geist ist geschützt');

    return true;

}


/* ****** HMAC INTEGRITY CHECK ****** */


function calculate_hmac() {

    update_status('CALCULATING_HMAC', 'Geist wird versiegelt...');

    // Collect all data that needs to be authenticated
    const salt_word_array = CryptoJS.lib.WordArray.create(ghost_cache.derived_keys.salt);
    const aes_iv_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ivs.aes_iv);
    const chacha_nonce_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ivs.chacha_nonce);
    const encrypted_data_word_array = CryptoJS.lib.WordArray.create(ghost_cache.encrypted_layer_2);

    // Concatenate all data
    const data_to_authenticate = CryptoJS.lib.WordArray.create()
        .concat(salt_word_array)
        .concat(aes_iv_word_array)
        .concat(chacha_nonce_word_array)
        .concat(encrypted_data_word_array);

    // Convert HMAC key to WordArray
    const hmac_key_word_array = CryptoJS.lib.WordArray.create(ghost_cache.derived_keys.hmac_key);

    // Calculate HMAC-SHA512
    const hmac = CryptoJS.HmacSHA512(data_to_authenticate, hmac_key_word_array);

    // Convert to Uint8Array
    const hmac_bytes = word_array_to_uint8(hmac);

    // Store in cache
    ghost_cache.hmac = hmac_bytes;

    update_status('HMAC_CALCULATED', 'Geist versiegelt');

    return true;

}


/* ****** BUILD GHOST FILE ****** */


function build_ghost() {

    update_status('BUILDING_GHOST', 'Geist materialisiert sich...');

    // Calculate total size
    const magic_bytes = new Uint8Array([71, 72, 79, 83, 84]); // "GHOST"
    const version = new Uint8Array([1]);

    const salt = ghost_cache.derived_keys.salt;
    const aes_iv = ghost_cache.ivs.aes_iv;
    const chacha_nonce = ghost_cache.ivs.chacha_nonce;
    const encrypted_data = ghost_cache.encrypted_layer_2;
    const hmac = ghost_cache.hmac;

    const total_size =
        magic_bytes.length +    // 5
        version.length +        // 1
        salt.length +           // 32
        aes_iv.length +         // 16
        chacha_nonce.length +   // 12
        encrypted_data.length + // variable
        hmac.length;            // 64

    // Create ghost
    const ghost = new Uint8Array(total_size);

    let offset = 0;

    // Assemble the ghost
    ghost.set(magic_bytes, offset); offset += magic_bytes.length;
    ghost.set(version, offset); offset += version.length;
    ghost.set(salt, offset); offset += salt.length;
    ghost.set(aes_iv, offset); offset += aes_iv.length;
    ghost.set(chacha_nonce, offset); offset += chacha_nonce.length;
    ghost.set(encrypted_data, offset); offset += encrypted_data.length;
    ghost.set(hmac, offset);

    // Store the ghost
    ghost_cache.ghost = ghost;

    update_status('GHOST_BUILT', 'Geist ist bereit');

    return true;

}


/* ****** DOWNLOAD GHOST FILE ****** */


function download_ghost() {

    update_status('DOWNLOADING_GHOST', 'Geist wird freigelassen...');

    // Create blob from ghost bytes
    const blob = new Blob([ghost_cache.ghost], { type: 'application/octet-stream' });

    // Generate filename
    const original_name = ghost_cache.uploaded_file.name;
    const ghost_filename = original_name + '.ghost';

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ghost_filename;

    // Trigger download
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    update_status('ENCRYPTION_COMPLETE', 'Geist entfesselt! 👻');

    return true;

}


/* =================================================== */
/* =================== DECRYPTION ==================== */
/* =================================================== */


function decryption_agent(action) {

    if (action === 'parse_ghost') {

        // parse the uploaded .ghost file
        const success = parse_ghost();
        if (!success) {
            // Parsing failed - invalid file
            return false;
        }
        return true;

    }

    if (action === 'load_keyfile') {

        // load and parse .gkey file
        return load_keyfile();

    }

    if (action === 'derive_keys') {

        // derive keys for decryption
        return derive_keys_decrypt();

    }

    if (action === 'verify_hmac') {

        // verify HMAC integrity - THIS IS WHERE WRONG PASSWORD IS DETECTED
        const valid = verify_hmac();

        if (!valid) {
            // HMAC failed - wrong password/keyfile!
            ghost_cache.status = 'WRONG_KEY';
            ghost_cache.error = 'Falsches Passwort oder falsche Keyfile';
            return false;
        }

        return true;

    }

    if (action === 'decrypt_chacha') {

        // first decryption layer: ChaCha20
        return decrypt_chacha();

    }

    if (action === 'decrypt_aes') {

        // second decryption layer: AES-256-CBC
        return decrypt_aes();

    }

    if (action === 'download') {

        // download the decrypted file
        return download_decrypted();

    }

}


/* ****** PARSE GHOST FILE ****** */


function parse_ghost() {

    update_status('PARSING_GHOST', 'Geist wird gelesen...');

    // Get ghost bytes directly
    const ghost_bytes = new Uint8Array(ghost_cache.uploaded_file.content);

    let offset = 0;

    // Parse magic bytes
    const magic_bytes = ghost_bytes.slice(offset, offset + 5);
    offset += 5;
    const magic_string = String.fromCharCode(...magic_bytes);

    if (magic_string !== "GHOST") {
        ghost_cache.status = 'INVALID_FILE';
        ghost_cache.error = 'Ungültige .ghost Datei';
        return false;
    }

    // Parse version
    const version = ghost_bytes[offset];
    offset += 1;

    if (version !== 1) {
        ghost_cache.status = 'UNSUPPORTED_VERSION';
        ghost_cache.error = 'Nicht unterstützte .ghost Version';
        return false;
    }

    // Parse salt
    const salt = ghost_bytes.slice(offset, offset + 32);
    offset += 32;

    // Parse IVs
    const aes_iv = ghost_bytes.slice(offset, offset + 16);
    offset += 16;

    const chacha_nonce = ghost_bytes.slice(offset, offset + 12);
    offset += 12;

    // Parse encrypted data (everything until last 64 bytes which is HMAC)
    const encrypted_data_length = ghost_bytes.length - offset - 64;
    const encrypted_data = ghost_bytes.slice(offset, offset + encrypted_data_length);
    offset += encrypted_data_length;

    // Parse HMAC
    const hmac = ghost_bytes.slice(offset, offset + 64);

    // Store parsed data
    ghost_cache.ghost_parsed = {
        magic: magic_string,
        version: version,
        salt: salt,
        aes_iv: aes_iv,
        chacha_nonce: chacha_nonce,
        encrypted_data: encrypted_data,
        hmac: hmac
    };

    ghost_cache.status = 'GHOST_PARSED';
    return true;

}


/* ****** LOAD KEYFILE ****** */


function load_keyfile() {

    // Parse JSON directly from keyfile
    const keyfile_json = new TextDecoder().decode(ghost_cache.keyfile_content);

    try {
        const keyfile_data = JSON.parse(keyfile_json);

        // Validate keyfile structure
        if (!keyfile_data.version || !keyfile_data.key_material || !keyfile_data.fingerprint) {
            ghost_cache.status = 'INVALID_KEYFILE';
            ghost_cache.error = 'Ungültige .gkey Datei';
            return false;
        }

        // Store key material
        ghost_cache.entered_key = keyfile_data.key_material;
        ghost_cache.status = 'KEYFILE_LOADED';
        return true;

    } catch (error) {
        ghost_cache.status = 'KEYFILE_PARSE_ERROR';
        ghost_cache.error = 'Keyfile konnte nicht gelesen werden';
        return false;
    }

}


/* ****** KEY DERIVATION FOR DECRYPTION ****** */


async function derive_keys_decrypt() {

    update_status('DERIVING_KEYS_DECRYPT', 'Schlüssel werden geprüft...');

    // Get salt from parsed ghost file
    const salt = ghost_cache.ghost_parsed.salt;

    // Get input material (password or keyfile)
    let input_material;

    if (ghost_cache.chosen_key_method === 'password') {
        input_material = ghost_cache.entered_key;
    } else if (ghost_cache.chosen_key_method === 'keyfile') {
        input_material = ghost_cache.entered_key; // From loaded keyfile
    }

    // Derive keys with Argon2id (same as encryption)
    const result = await argon2.hash({
        pass: input_material,
        salt: salt,
        time: 3,
        mem: 65536,
        hashLen: 96,
        parallelism: 4,
        type: argon2.ArgonType.Argon2id
    });

    const master_key = result.hash;

    // Split into 3 separate keys
    const derived_keys = {
        aes_key: master_key.slice(0, 32),
        chacha_key: master_key.slice(32, 64),
        hmac_key: master_key.slice(64, 96),
        salt: salt
    };

    // Store in cache
    ghost_cache.derived_keys = derived_keys;

    // Also store IVs from ghost file
    ghost_cache.ivs = {
        aes_iv: ghost_cache.ghost_parsed.aes_iv,
        chacha_nonce: ghost_cache.ghost_parsed.chacha_nonce
    };

    ghost_cache.status = 'KEYS_DERIVED';
    return true;

}


/* ****** VERIFY HMAC INTEGRITY ****** */


function verify_hmac() {

    update_status('VERIFYING_HMAC', 'Siegel wird überprüft...');

    // Collect all data that was authenticated
    const salt_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ghost_parsed.salt);
    const aes_iv_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ghost_parsed.aes_iv);
    const chacha_nonce_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ghost_parsed.chacha_nonce);
    const encrypted_data_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ghost_parsed.encrypted_data);

    // Concatenate all data
    const data_to_authenticate = CryptoJS.lib.WordArray.create()
        .concat(salt_word_array)
        .concat(aes_iv_word_array)
        .concat(chacha_nonce_word_array)
        .concat(encrypted_data_word_array);

    // Convert HMAC key to WordArray
    const hmac_key_word_array = CryptoJS.lib.WordArray.create(ghost_cache.derived_keys.hmac_key);

    // Calculate HMAC-SHA512
    const calculated_hmac = CryptoJS.HmacSHA512(data_to_authenticate, hmac_key_word_array);
    const calculated_hmac_bytes = word_array_to_uint8(calculated_hmac);

    // Compare with stored HMAC
    const stored_hmac = ghost_cache.ghost_parsed.hmac;

    // Constant-time comparison
    let mismatch = 0;
    for (let i = 0; i < 64; i++) {
        mismatch |= calculated_hmac_bytes[i] ^ stored_hmac[i];
    }

    if (mismatch !== 0) {
        ghost_cache.status = 'HMAC_FAILED';
        ghost_cache.error = 'Falsches Passwort oder beschädigte Datei';
        return false;
    }

    ghost_cache.status = 'HMAC_VERIFIED';
    return true;

}


/* ****** DECRYPTION LAYER 1: ChaCha20 ****** */


function decrypt_chacha() {

    update_status('DECRYPTING_CHACHA', 'Geist wird befreit...');

    // Get encrypted data from ghost file
    const encrypted_data = ghost_cache.ghost_parsed.encrypted_data;

    // Get key and nonce
    const chacha_key = ghost_cache.derived_keys.chacha_key;
    const chacha_nonce = ghost_cache.ivs.chacha_nonce;

    // Decrypt with ChaCha20 (encryption and decryption are the same for stream ciphers)
    const decrypted_bytes = ChaCha20.decrypt(chacha_key, chacha_nonce, encrypted_data);

    // Store decrypted layer 1
    ghost_cache.decrypted_layer_1 = decrypted_bytes;

    ghost_cache.status = 'CHACHA_DECRYPTED';
    return true;

}


/* ****** DECRYPTION LAYER 2: AES-256-CBC ****** */


function decrypt_aes() {

    update_status('DECRYPTING_AES', 'Geist wird enthüllt...');

    // Get ChaCha decrypted data
    const layer_1_data = ghost_cache.decrypted_layer_1;

    // Convert to CryptoJS WordArray
    const data_word_array = CryptoJS.lib.WordArray.create(layer_1_data);

    // Convert key and IV to WordArray
    const aes_key_word_array = CryptoJS.lib.WordArray.create(ghost_cache.derived_keys.aes_key);
    const aes_iv_word_array = CryptoJS.lib.WordArray.create(ghost_cache.ivs.aes_iv);

    // Create CipherParams object
    const cipher_params = CryptoJS.lib.CipherParams.create({
        ciphertext: data_word_array
    });

    // Decrypt with AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(cipher_params, aes_key_word_array, {
        iv: aes_iv_word_array,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert decrypted data to Uint8Array
    const decrypted_bytes = word_array_to_uint8(decrypted);

    // Store original file data
    ghost_cache.decrypted_layer_2 = decrypted_bytes;

    ghost_cache.status = 'DECRYPTION_COMPLETE';
    return true;

}


/* ****** DOWNLOAD DECRYPTED FILE ****** */


function download_decrypted() {

    update_status('DOWNLOADING_DECRYPTED', 'Geist gibt sein Geheimnis preis...');

    // Create blob from decrypted data
    const blob = new Blob([ghost_cache.decrypted_layer_2], { type: 'application/octet-stream' });

    // Generate filename (remove .ghost extension)
    let original_name = ghost_cache.uploaded_file.name;
    if (original_name.endsWith('.ghost')) {
        original_name = original_name.slice(0, -6); // Remove ".ghost"
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = original_name;

    // Trigger download
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);

    update_status('DECRYPTION_COMPLETE', 'Geist entschlüsselt! 🔓');

    return true;

}
