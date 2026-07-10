
const png_input = document.getElementById("pngInput");
const file_name_display = document.getElementById('fileNameDisplay');
const preview = document.getElementById('imagePreview');
const convert_btn = document.getElementById("convert");
const p_status = document.getElementById("status");
const text_id = document.getElementById("txt_id");
const link_id = document.getElementById("link");


function show_warning(message) {
    const warning = document.createElement("div");
    warning.textContent = message;
    warning.style.cssText = `
        color: white; 
        font-weight: bold; 
        position: fixed; 
        text-align: center;
        top: 10px; 
        left: 50%; 
        transform: translateX(-50%); 
        background:rgb(180, 0, 0); 
        padding: 10px; 
        border: 1px solid white;
        border-radius: 12px;
        box-shadow: 0px 0px 10px rgb(0, 0, 0);
    `;

    // Find the last warning element
    const warnings = document.querySelectorAll(".warning-message");
    if (warnings.length > 0) {
        const lastWarning = warnings[warnings.length - 1]; // Get last warning
        const lastWarningRect = lastWarning.getBoundingClientRect(); // Get position
        warning.style.top = `${lastWarningRect.bottom/1.5-14.28454342 +5}px`; // Adjust position
    }

    // Add class for identification
    warning.classList.add("warning-message");
    document.body.appendChild(warning);

    // Remove warning when user clicks anywhere on the page
    document.addEventListener("click", () => warning.remove(), { once: true });
}

function remove_extension(filename) {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
}

function download_bin_file(filename, byteBuffer) {
    const blob = new Blob([byteBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function download_text_file(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}




async function readImage(file) {
    const img = await createImageBitmap(file);

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d", {willReadFrequently: true,});
    if (!ctx) {
        throw new Error("Could not get canvas context");
    }
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0,0,canvas.width,canvas.height);
    const pixels = [];

    for (let y = 0; y < img.height; y++) {
        const row = [];
        for (let x = 0; x < img.width; x++) {
            const i = (y * img.width + x) * 4;
            row.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
        }
        pixels.push(row);
    }
    img.close();

    return pixels;
}



async function img_to_blp(file) {
    const pixels = await readImage(file);
    const name = remove_extension(file.name);
    const res = await fetch(
        "https://builderment-blp.reddit2611.workers.dev/imageBlp",
        { method: "POST", body: JSON.stringify({name, pixels}), }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.arrayBuffer();
}

async function uploadBlp(data) {
    const res = await fetch(
        "https://builderment-server.reddit2611.workers.dev/uploadBlp", 
        { method: "POST", body: data }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}


convert_btn.onclick = async function() {
    p_status.textContent = "Loading...";
    try {
        const file = png_input.files[0];
        if (file) {
            const buffer = await img_to_blp(file);
            const result = await uploadBlp(buffer);
            text_id.textContent = result.id;
            link_id.href = result.url;
            link_id.textContent = result.url;
        }
        p_status.innerHTML = "&nbsp;";
    } catch (err) {
        console.log(err);
        p_status.innerHTML = "Error!";
    }
}


png_input.onchange = function() {
    const file = png_input.files[0];
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
}