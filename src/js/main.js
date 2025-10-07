"use strict";

// Upload File

let uploaded_file = null;
let crypt_action = null;

function upload_file() {

    let create_file_input = document.createElement('input');
    create_file_input.type = 'file';

    create_file_input.onchange = function (upload) {

        const file = upload.target.files[0];

        if (file) {

            const reader = new FileReader();

            reader.onload = function (event) {

                uploaded_file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    lastModified: file.lastModified,
                    content: event.target.result
                };

                process_file();

            };

            reader.readAsDataURL(file);

        }
    }

    create_file_input.click();

}

// Process File

function process_file() {

    if (uploaded_file.name.endsWith('.ghost')) {
        crypt_action = 'decrypt';
    } else {
        crypt_action = 'encrypt';
    }

}