"use strict";

/* === State Management === */
let uploadedFile = null;
let processedFile = null;
let currentAuthMethod = null;
let currentKeyfile = null;
let isEncrypting = true;

/* === File Upload === */
async function fileUpload() {
    uploadedFile = await ghost('upload');
    if (uploadedFile) showFileView(uploadedFile);
}

// Show File View with Animation
function showFileView(file) {
    const uploadSection = document.getElementById('upload-file');
    const fileViewSection = document.getElementById('file-view');
    
    // Determine if file is a ghost file (encrypted)
    const isGhostFile = file.name.endsWith('.ghost');
    
    // Set the global flag: if it's a ghost file, we decrypt (false), otherwise encrypt (true)
    isEncrypting = !isGhostFile;
    
    // Update file information
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);
    
    // Set file type icon
    const fileIcon = document.getElementById('file-type-icon');
    if (isGhostFile) {
        fileIcon.textContent = 'encrypted';
    } else {
        fileIcon.textContent = 'description';
    }
    
    // Update status badge
    const statusBadge = document.getElementById('status-badge');
    const statusIcon = document.getElementById('status-icon');
    const statusText = document.getElementById('status-text');
    const processBtn = document.getElementById('process-btn');
    
    if (isGhostFile) {
        // Ghost file - needs decryption
        statusBadge.classList.add('ghost-file');
        statusBadge.classList.remove('normal-file');
        statusIcon.textContent = 'encrypted';
        statusText.textContent = 'Ghost File - Ready to Decrypt';
        
        document.getElementById('detail-type').textContent = 'Encrypted Ghost File';
        document.getElementById('detail-status').textContent = 'Encrypted';
        document.getElementById('detail-action').textContent = 'Decrypt';
        
        processBtn.innerHTML = '<span class="material-icon">lock_open</span><span class="btn-text">Decrypt File</span>';
    } else {
        // Normal file - needs encryption
        statusBadge.classList.add('normal-file');
        statusBadge.classList.remove('ghost-file');
        statusIcon.textContent = 'lock';
        statusText.textContent = 'Regular File - Ready to Encrypt';
        
        const fileType = file.name.split('.').pop().toUpperCase();
        document.getElementById('detail-type').textContent = fileType + ' File';
        document.getElementById('detail-status').textContent = 'Unencrypted';
        document.getElementById('detail-action').textContent = 'Encrypt';
        
        processBtn.innerHTML = '<span class="material-icon">lock</span><span class="btn-text">Encrypt File</span>';
    }
    
    // Animate transition
    uploadSection.style.opacity = '1';
    uploadSection.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        uploadSection.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        uploadSection.style.opacity = '0';
        uploadSection.style.transform = 'translateY(-30px)';
        
        setTimeout(() => {
            uploadSection.classList.add('hidden');
            fileViewSection.classList.remove('hidden');
            
            // Animate file view in
            setTimeout(() => {
                fileViewSection.style.opacity = '1';
                fileViewSection.style.transform = 'translateY(0)';
            }, 50);
        }, 400);
    }, 100);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/* === Navigation & Flow Control === */
function showAuthSelection() {
    const fileViewSection = document.getElementById('file-view');
    const authSection = document.getElementById('auth-selection');
    
    // Update subtitle based on encrypt/decrypt
    const subtitle = document.getElementById('auth-subtitle');
    if (isEncrypting) {
        subtitle.textContent = 'Select how you want to protect your file';
    } else {
        subtitle.textContent = 'Select the method used to encrypt this file';
    }
    
    transitionSection(fileViewSection, authSection);
}

function showAuthInput(method) {
    currentAuthMethod = method;
    const authSection = document.getElementById('auth-selection');
    const inputSection = document.getElementById('auth-input');
    
    const inputIcon = document.getElementById('input-icon');
    const inputTitle = document.getElementById('input-title');
    const passwordContainer = document.getElementById('password-input-container');
    const keyfileContainer = document.getElementById('keyfile-input-container');
    const startBtnText = document.getElementById('start-btn-text');
    const passwordStrength = document.getElementById('password-strength');
    const generateBtn = document.getElementById('generate-keyfile-btn');
    const uploadBtn = document.getElementById('upload-keyfile-btn');
    const keyfileStatus = document.getElementById('keyfile-status');
    
    // Reset global state
    currentKeyfile = null;
    
    // Reset password field
    const passwordField = document.getElementById('password-field');
    passwordField.value = '';
    document.getElementById('strength-fill').style.width = '0%';
    document.getElementById('strength-text').textContent = 'Enter a password';
    
    // Reset keyfile status
    keyfileStatus.classList.add('hidden');
    keyfileStatus.style.display = 'none';
    
    if (method === 'password') {
        // PASSWORD MODE
        inputIcon.textContent = 'password';
        inputTitle.textContent = isEncrypting ? 'Enter Password' : 'Enter Decryption Password';
        
        // FORCE HIDE keyfile container and its contents
        keyfileContainer.classList.add('hidden');
        keyfileContainer.style.display = 'none';
        generateBtn.style.display = 'none';
        uploadBtn.style.display = 'none';
        
        // FORCE SHOW password container
        passwordContainer.classList.remove('hidden');
        passwordContainer.style.display = 'block';
        
        // For encryption: show strength meter
        // For decryption: hide strength meter
        if (isEncrypting) {
            passwordStrength.classList.remove('hidden');
            passwordStrength.style.display = 'block';
        } else {
            passwordStrength.classList.add('hidden');
            passwordStrength.style.display = 'none';
        }
        
    } else {
        // KEYFILE MODE
        inputIcon.textContent = 'key';
        inputTitle.textContent = isEncrypting ? 'Setup Keyfile' : 'Provide Keyfile';
        
        // FORCE HIDE password container
        passwordContainer.classList.add('hidden');
        passwordContainer.style.display = 'none';
        passwordStrength.style.display = 'none';
        
        // FORCE SHOW keyfile container
        keyfileContainer.classList.remove('hidden');
        keyfileContainer.style.display = 'block';
        
        // For encryption: show both generate and upload buttons
        // For decryption: only show upload button
        if (isEncrypting) {
            generateBtn.classList.remove('hidden');
            generateBtn.style.display = 'flex';
            uploadBtn.classList.remove('hidden');
            uploadBtn.style.display = 'flex';
        } else {
            generateBtn.classList.add('hidden');
            generateBtn.style.display = 'none';
            uploadBtn.classList.remove('hidden');
            uploadBtn.style.display = 'flex';
        }
    }
    
    startBtnText.textContent = isEncrypting ? 'Start Encryption' : 'Start Decryption';
    document.getElementById('start-process-btn').disabled = true;
    
    transitionSection(authSection, inputSection);
}

/* === Processing === */
async function beginProcessing() {
    const inputSection = document.getElementById('auth-input');
    const processingSection = document.getElementById('processing');
    
    // Get password or keyfile
    let authData = null;
    if (currentAuthMethod === 'password') {
        authData = document.getElementById('password-field').value;
    } else {
        authData = currentKeyfile;
    }
    
    // Update processing UI
    const processingTitle = document.getElementById('processing-title');
    const processingSubtitle = document.getElementById('processing-subtitle');
    
    if (isEncrypting) {
        processingTitle.textContent = 'Encrypting File...';
        processingSubtitle.textContent = 'Please wait while we secure your data';
    } else {
        processingTitle.textContent = 'Decrypting File...';
        processingSubtitle.textContent = 'Please wait while we restore your file';
    }
    
    transitionSection(inputSection, processingSection);
    await performProcessing(authData);
}

async function performProcessing(authData) {
    document.getElementById('progress-status').textContent = 'Starting...';
    await animateProgress(0, 10, 100);

    try {
        const ghostOptions = {
            action: isEncrypting ? 'encrypt' : 'decrypt',
            file: uploadedFile,
            keyMethod: currentAuthMethod,
            [currentAuthMethod === 'password' ? 'password' : 'keyfile']: authData
        };

        const result = await ghost(ghostOptions);

        if (result?.success && result.return) {
            const outputName = isEncrypting ? `${uploadedFile.name}.ghost` : uploadedFile.name.replace('.ghost', '');
            processedFile = new File([result.return], outputName, { type: 'application/octet-stream' });


            const steps = [
                { text: 'Preparing file...', duration: 150 },
                { text: 'Generating keys...', duration: 200 },
                { text: 'Processing data...', duration: 300 },
                { text: 'Finalizing...', duration: 150 }
            ];
            
            let totalProgress = 10;
            const progressPerStep = 90 / steps.length;
            
            for (let i = 0; i < steps.length; i++) {
                updateStep(i + 1, 'active');
                document.getElementById('progress-status').textContent = steps[i].text;
                
                const stepStart = totalProgress;
                const stepEnd = stepStart + progressPerStep;
                
                await animateProgress(stepStart, stepEnd, steps[i].duration);
                
                updateStep(i + 1, 'complete');
                totalProgress = stepEnd;
            }
            
            showComplete();
        } else {
            const errorMsg = result?.error || 'The password or keyfile you provided is incorrect.';
            console.error('Ghost API error:', errorMsg);
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Processing error:', error);
        showError(error.message || 'An unexpected error occurred.');
    }
}

/* === UI Helpers === */
function animateProgress(start, end, duration) {
    return new Promise(resolve => {
        const startTime = Date.now();
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');

        const update = () => {
            const progress = Math.min((Date.now() - startTime) / duration, 1);
            const currentValue = start + (end - start) * progress;
            progressFill.style.width = `${currentValue}%`;
            progressPercentage.textContent = `${Math.round(currentValue)}%`;
            progress < 1 ? requestAnimationFrame(update) : resolve();
        };

        update();
    });
}

function updateStep(stepNumber, status) {
    const step = document.querySelector(`.step-item[data-step="${stepNumber}"]`);
    const icon = step.querySelector('.step-icon');

    if (status === 'active') {
        step.classList.add('active');
        icon.textContent = 'sync';
        icon.classList.add('spinning');
    } else if (status === 'complete') {
        step.classList.remove('active');
        step.classList.add('complete');
        icon.textContent = 'check_circle';
        icon.classList.remove('spinning');
    }
}

/* === Result Screens === */
function showComplete() {
    const outputName = isEncrypting ? `${uploadedFile.name}.ghost` : uploadedFile.name.replace('.ghost', '');
    const title = isEncrypting ? 'Encryption Complete!' : 'Decryption Complete!';
    const subtitle = isEncrypting ? 'Your file has been successfully encrypted' : 'Your file has been successfully decrypted';

    document.getElementById('complete-title').textContent = title;
    document.getElementById('complete-subtitle').textContent = subtitle;
    document.getElementById('summary-original').textContent = uploadedFile.name;
    document.getElementById('summary-output').textContent = outputName;
    document.getElementById('summary-size').textContent = formatFileSize(processedFile.size);
    document.getElementById('summary-method').textContent = currentAuthMethod === 'password' ? 'Password' : 'Keyfile';

    transitionSection(document.getElementById('processing'), document.getElementById('complete'));
}

function showError(errorMessage) {
    document.getElementById('error-message').textContent = errorMessage;

    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-percentage').textContent = '0%';
    document.getElementById('progress-status').textContent = 'Initializing...';

    document.querySelectorAll('.step-item').forEach(step => {
        step.classList.remove('active', 'complete');
        const icon = step.querySelector('.step-icon');
        icon.textContent = 'pending';
        icon.classList.remove('spinning');
    });

    transitionSection(document.getElementById('processing'), document.getElementById('error'));
}

/* === Reset Functions === */
function resetToStart() {
    uploadedFile = processedFile = currentAuthMethod = currentKeyfile = null;

    document.getElementById('password-field').value = '';
    document.getElementById('strength-fill').style.width = '0%';
    document.getElementById('strength-text').textContent = 'Enter a password';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-percentage').textContent = '0%';

    document.querySelectorAll('.step-item').forEach(step => {
        step.classList.remove('active', 'complete');
        step.querySelector('.step-icon').textContent = 'pending';
    });

    transitionSection(document.getElementById('complete'), document.getElementById('upload-file'));
}

/* === Transitions === */
function transitionSection(from, to) {
    from.style.cssText = 'opacity: 1; transform: translateY(0); transition: opacity 0.25s ease, transform 0.25s ease';

    setTimeout(() => {
        from.style.cssText += '; opacity: 0; transform: translateY(-30px)';
        setTimeout(() => {
            from.classList.add('hidden');
            to.classList.remove('hidden');
            to.style.cssText = 'opacity: 0; transform: translateY(30px); transition: opacity 0.25s ease, transform 0.25s ease';
            setTimeout(() => to.style.cssText += '; opacity: 1; transform: translateY(0)', 20);
        }, 250);
    }, 50);
}

/* === Password Validation === */
function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const startBtn = document.getElementById('start-process-btn');

    if (!password.length) {
        strengthFill.style.width = '0%';
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Enter a password';
        startBtn.disabled = true;
        return;
    }

    if (!isEncrypting) {
        startBtn.disabled = false;
        return;
    }


    if (!isEncrypting) {
        startBtn.disabled = false;
        return;
    }

    let strength = 0;
    const feedback = [];
    if (password.length >= 8) {
        strength += 10;
    } else {
        feedback.push('at least 8 characters');
    }
    
    if (password.length >= 12) {
        strength += 10;
    }
    
    if (password.length >= 16) {
        strength += 10;
    }
    
    // Character type checks (0-70 points)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
    
    if (hasLowercase) strength += 15;
    else feedback.push('lowercase letters');
    
    if (hasUppercase) strength += 15;
    else feedback.push('uppercase letters');
    
    if (hasNumbers) strength += 20;
    else feedback.push('numbers');
    
    if (hasSpecialChars) strength += 20;
    else feedback.push('special characters');
    
    // Bonus: variety (0-10 points)
    const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
    if (varietyCount >= 3) strength += 5;
    if (varietyCount === 4) strength += 5;
    
    // Determine label and class
    let label = '';
    let className = 'weak';
    
    if (strength <= 35) {
        label = 'Very Weak';
        className = 'weak';
    } else if (strength <= 55) {
        label = 'Weak';
        className = 'weak';
    } else if (strength <= 75) {
        label = 'Medium';
        className = 'medium';
    } else if (strength <= 90) {
        label = 'Strong';
        className = 'strong';
    } else {
        label = 'Very Strong';
        className = 'strong';
    }
    
    startBtn.disabled = false;

    const feedbackText = feedback.length && strength < 75 ? `${label} • Add: ${feedback.join(', ')}` : label;
    strengthFill.style.width = `${strength}%`;
    strengthFill.className = `strength-fill ${className}`;
    strengthText.textContent = feedbackText;
}

/* === Event Listeners === */
document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password-field');

    document.getElementById('cancel-btn').addEventListener('click', () => {
        uploadedFile = null;
        transitionSection(document.getElementById('file-view'), document.getElementById('upload-file'));
    });

    document.getElementById('process-btn').addEventListener('click', showAuthSelection);

    document.getElementById('password-option').addEventListener('click', () => showAuthInput('password'));
    document.getElementById('keyfile-option').addEventListener('click', () => showAuthInput('keyfile'));

    document.getElementById('auth-back-btn').addEventListener('click', () => {
        transitionSection(document.getElementById('auth-selection'), document.getElementById('file-view'));
    });

    document.getElementById('input-back-btn').addEventListener('click', () => {
        transitionSection(document.getElementById('auth-input'), document.getElementById('auth-selection'));
    });

    passwordField.addEventListener('input', (e) => checkPasswordStrength(e.target.value));

    document.getElementById('toggle-password').addEventListener('click', () => {
        const isPassword = passwordField.type === 'password';
        passwordField.type = isPassword ? 'text' : 'password';
        document.querySelector('#toggle-password .material-icon').textContent = isPassword ? 'visibility_off' : 'visibility';
    });
    
    // Keyfile actions
    document.getElementById('generate-keyfile-btn').addEventListener('click', async () => {
        // Create a dummy file with the desired name
        const dummyFile = new File([new ArrayBuffer(1)], 'GhostCrypt Keyfile', {
            type: 'application/octet-stream'
        });
        
        // Use Ghost API to generate keyfile
        const result = await ghost({
            action: 'encrypt',
            file: dummyFile,
            keyMethod: 'keyfile'
            // No keyfile parameter = auto-generate
        });
        
        if (result && result.success && result.keyfile) {
            // Store the generated keyfile
            currentKeyfile = result.keyfile.buffer || result.keyfile;
            
            const keyfileStatus = document.getElementById('keyfile-status');
            keyfileStatus.classList.remove('hidden');
            keyfileStatus.style.display = 'flex';
            document.getElementById('keyfile-name').textContent = 'New keyfile generated (32 bytes)';
            document.getElementById('start-process-btn').disabled = false;
            
            // Download the keyfile
            ghost('download', 'keyfile');
        }
    });
    
    document.getElementById('upload-keyfile-btn').addEventListener('click', async () => {
        // Use Ghost API to upload keyfile
        const keyfile = await ghost('upload', 'keyfile');
        if (keyfile && keyfile.content) {
            // Store the keyfile content (ArrayBuffer)
            currentKeyfile = keyfile.content;
            const keyfileStatus = document.getElementById('keyfile-status');
            keyfileStatus.classList.remove('hidden');
            keyfileStatus.style.display = 'flex';
            document.getElementById('keyfile-name').textContent = keyfile.name;
            document.getElementById('start-process-btn').disabled = false;
        }
    });
    
    document.getElementById('start-process-btn').addEventListener('click', beginProcessing);

    document.getElementById('retry-btn').addEventListener('click', () => {
        transitionSection(document.getElementById('error'), document.getElementById('auth-input'));
    });

    document.getElementById('error-cancel-btn').addEventListener('click', () => {
        uploadedFile = processedFile = currentAuthMethod = currentKeyfile = null;
        transitionSection(document.getElementById('error'), document.getElementById('upload-file'));
    });

    document.getElementById('download-btn').addEventListener('click', () => ghost('download'));
    document.getElementById('process-another-btn').addEventListener('click', resetToStart);
});

