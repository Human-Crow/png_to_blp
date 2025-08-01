


const button = document.getElementById("button");
const png_input = document.getElementById("pngInput");
const file_name_display = document.getElementById('fileNameDisplay');
const preview = document.getElementById('imagePreview');


const colors = [
    [[3001, 0], [46, 51, 54]],
    [[3001, 0], [55, 56, 60]],
    [[3001, 0], [61, 70, 70]],
    [[3003, 0], [159, 177, 177]],
    [[3003, 1], [175, 194, 198]],
    [[3005, 0], [53, 47, 81]],
    [[3005, 0], [54, 52, 92]],
    [[3005, 2], [62, 78, 130]],
    [[3005, 2], [74, 76, 125]],
    [[3006, 2], [107, 33, 30]],
    [[3011, 2], [152, 167, 174]],
    [[3015, 0], [220, 53, 97]],
    [[3015, 1], [108, 13, 45]],
    [[3015, 3], [182, 39, 85]],
    [[3021, 2], [61, 101, 163]],
    [[3021, 2], [69, 114, 181]],
    [[3021, 2], [96, 159, 230]],
    [[3022, 0], [211, 94, 25]],
    [[3022, 1], [176, 70, 10]],
    [[3022, 2], [253, 104, 38]],
    [[3023, 1], [186, 192, 192]],
    [[3023, 1], [246, 255, 253]],
    [[3029, 0], [27, 165, 105]],
    [[3029, 1], [40, 207, 125]],
    [[3029, 1], [89, 210, 144]],
    [[3029, 2], [43, 158, 119]],
    [[3029, 3], [17, 115, 68]],
    [[3030, 2], [20, 34, 34]],
    [[3030, 2], [39, 51, 47]],
    [[3030, 2], [58, 80, 77]],
    [[3031, 1], [21, 178, 149]],
    [[3031, 2], [10, 160, 133]],
    [[3031, 3], [6, 121, 108]],
    [[3032, 1], [0, 68, 67]],
    [[3032, 2], [12, 134, 137]],
    [[3032, 3], [13, 145, 150]],
    [[3033, 0], [158, 173, 176]],
    [[3033, 2], [91, 96, 100]],
    [[3034, 0], [160, 140, 116]],
    [[3034, 1], [151, 129, 108]],
    [[3034, 2], [134, 119, 100]],
    [[3035, 0], [144, 158, 167]],
    [[3035, 2], [116, 127, 133]],
    [[3035, 3], [155, 168, 174]],
    [[3037, 2], [191, 100, 56]],
    [[3037, 2], [220, 134, 75]]
];


function read_image(file, callback) {
    const img = new Image();
    const reader = new FileReader();

    img.onload = function () {
        const canvas = document.getElementById("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let output = [];

        for (let y = 0; y < canvas.height; y++) {
            output[y] = [];
            for (let x = 0; x < canvas.width; x++) {
                const i = (y * canvas.width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                output[y][x] = [r, g, b, a];
            }
        }
        callback(output);
    };

    reader.onload = function (e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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

async function upload_bin_file(byteBuffer) {
    try {
        const response = await fetch("https://api.builderment.com/blueprints", {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                "Accept": "application/json"
            },
            body: byteBuffer
        });

        const data = await response.json();
        console.log("Upload successful:", data);
        alert(`Blueprint uploaded! ID: ${data.id}`);
    } catch (error) {
        console.error("Upload failed:", error);
        show_warning("Failed to upload blueprint.");
    }
}



function remove_extension(filename) {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
}

function get_distance(c1, c2) {
    return Math.sqrt(
        (c2[0] - c1[0]) ** 2 +
        (c2[1] - c1[1]) ** 2 +
        (c2[2] - c1[2]) ** 2
    );
}

class Blueprint {
    constructor(name, pixels) {
        this.pixels = pixels;
        this.name = name;
        this.building_amount = this.get_size();
        if (this.building_amount > 999999) {
            show_warning("BluePrint is too big to open.");
            throw Error("BluePrint is too big to open.");
        } else if (this.building_amount > 78600) {
            show_warning("Blueprint is too big to share.");
            throw Error("Blueprint is too big to share.");
        }
        let name_bytes = name.length + (4 - name.length % 4);
        let file_size = 56 + name_bytes + this.building_amount * 20;
        this.bin_data = new Uint8Array(file_size);
        this.create_bin_data();
    }

    get_size() {
        let size = 0;
        for (let y = 0; y < this.pixels.length; y++) {
            for (let x = 0; x < this.pixels[y].length; x++) {
                let [r, g, b, a] = this.pixels[y][x];
                if (a > 127) {size++;}
            }
        }
        return size;
    }

    num_to_uint32(num) {
        num = num >>> 0;
        return [
            num & 0xFF,             // Byte 0 (least significant)
            (num >> 8) & 0xFF,      // Byte 1
            (num >> 16) & 0xFF,     // Byte 2
            (num >> 24) & 0xFF      // Byte 3 (most significant)
        ];
    }
    num_to_uint16(num) {
        num = num >>> 0;
        return [
            num & 0xFF,             // Byte 0 (least significant)
            (num >> 8) & 0xFF      // Byte 1 (most significant)
        ];
    }
    str_to_nums(str) {
        return Array.from(str).map(char => char.charCodeAt(0));
    }

    get_building(target_rgb) {
        let minDist = Infinity;
        let closest = null;
        for (const [build, build_rgb] of colors) {
            let dist = get_distance(target_rgb, build_rgb);
            if (dist < minDist) {
                minDist = dist;
                closest = build;
            }
        }
        if (closest == null) {throw new Error("No building matched RGB value.");}
        return closest;
    }

    create_bin_data() {
        // Set start bytes
        let start_bytes = [16,0,0,0,0,0,10,0,16,0,0,0,4,0,8,0,10,0,0,0];
        this.bin_data.set(start_bytes, 0);
        let bytes_to_name = 28 + 20 * this.building_amount;
        this.bin_data.set(this.num_to_uint32(bytes_to_name), 20);
        this.bin_data.set(this.num_to_uint32(4), 24);
        this.bin_data.set(this.num_to_uint32(this.building_amount), 28);

        // Set building starting positions
        let f_index = 32;
        for (let i = 0; i < this.building_amount; i++) {
            let pos = (this.building_amount - i) * 20
            this.bin_data.set(this.num_to_uint32(pos), f_index);
            f_index += 4;
        }

        // Set building format
        let format = [0,0,14,0,16,0,6,0,8,0,12,0,4,0,5,0];
        this.bin_data.set(format, f_index);
        f_index += 16;

        // Set buildings
        let bytes_to_format = 14;
        for (let y = 0; y < this.pixels.length; y++) {
            for (let x = 0; x < this.pixels[y].length; x++) {
                let [r, g, b, a] = this.pixels[y][x];
                if (a > 127) {
                    let [building, orientation] = this.get_building([r,g,b]);
                    this.bin_data.set(this.num_to_uint32(bytes_to_format), f_index);
                    f_index += 4;
                    this.bin_data.set([orientation], f_index);
                    f_index += 1;
                    this.bin_data.set([0], f_index);
                    f_index += 1;
                    this.bin_data.set(this.num_to_uint16(building), f_index);
                    f_index += 2;
                    this.bin_data.set(this.num_to_uint32(x), f_index);
                    f_index += 4;
                    this.bin_data.set(this.num_to_uint32(y), f_index);
                    f_index += 4;
                    bytes_to_format += 16;
                }
            }
        }

        // Set name
        this.bin_data.set(this.num_to_uint32(this.name.length), f_index);
        f_index += 4;
        this.bin_data.set(this.str_to_nums(this.name), f_index);
    }
}

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



button.onclick = function() {
    const file = png_input.files[0];
    if (!file) return;

    read_image(file, function (pixelData) {
        let bp = new Blueprint(remove_extension(file.name), pixelData);
        upload_bin_file(bp.bin_data);
        //download_bin_file(remove_extension(file.name)+".blp", bp.bin_data);
        //downloadTextFile("pixel_data.txt", pixelData);
    });
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
}