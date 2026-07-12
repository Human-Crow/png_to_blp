import {
    uploadBlp, imageBlp
} from "https://builderment.hcrow.workers.dev/api.js";

const WORKER = "https://builderment.hcrow.workers.dev";



const img_input = document.getElementById("imgInput");
const file_name_display = document.getElementById('fileNameDisplay');
const preview = document.getElementById('imagePreview');
const convert_btn = document.getElementById("convert");
const p_status = document.getElementById("status");
const text_id = document.getElementById("txt_id");
const link_id = document.getElementById("link");




convert_btn.onclick = async function() {
    p_status.textContent = "Loading...";
    try {
        const file = img_input.files[0];
        if (file) {
            const buffer = await imageBlp(WORKER, file);
            const result = await uploadBlp(WORKER, buffer);
            text_id.textContent = result.id;
            link_id.href = result.url;
            link_id.textContent = result.url;
        }
        p_status.innerHTML = "&nbsp;";
    } catch (err) {
        console.log(err);
        p_status.innerHTML = `Error!<br>${err.message}`;
    }
}


img_input.onchange = function() {
    const file = img_input.files[0];
    if (file) {
        file_name_display.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        file_name_display.textContent = 'No file selected';
        preview.style.display = 'none';
    }
    text_id.textContent = "";
    link_id.textContent = "";
    link_id.removeAttribute("href");
    p_status.innerHTML = "&nbsp;";
}