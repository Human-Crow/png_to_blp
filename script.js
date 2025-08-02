
//#region Constants
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
//#endregion



//#region Other functions
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

function get_distance(c1, c2) {
    return Math.sqrt(
        (c2[0] - c1[0]) ** 2 +
        (c2[1] - c1[1]) ** 2 +
        (c2[2] - c1[2]) ** 2
    );
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
//#endregion



//#region File functions
class BinaryData {
    constructor(total_bytes) {
        this.index = 0;
        this.bytes = new Uint8Array(total_bytes);
    }
    set_uint8(numbers, i = this.index) {
        numbers = this.#to_array(numbers);
        this.bytes.set(numbers, i)
        this.index = i + numbers.length;
    }
    set_uint16(numbers, i = this.index) {
        const byteArray = this.#to_array(numbers).flatMap(num => this.#uint16_to_uint8(num));
        this.set_uint8(byteArray, i);
    }
    set_uint32(numbers, i = this.index) {
        const byteArray = this.#to_array(numbers).flatMap(num => this.#uint32_to_uint8(num));
        this.set_uint8(byteArray, i);
    }
    set_string(str, i = this.index) {
        const encoded = new TextEncoder().encode(str);
        this.set_uint8(Array.from(encoded), i);
    }
    #to_array(input) {
        return Array.isArray(input) ? input : [input];
    }
    #uint16_to_uint8(num) {
        num = num >>> 0;        // Convert - to +
        return [
            num & 0xFF,         // Byte 0 (least significant)
            (num >> 8) & 0xFF   // Byte 1 (most significant)
        ];
    }
    #uint32_to_uint8(num) {
        num = num >>> 0;        // Convert - to +
        return [
            num & 0xFF,         // Byte 0 (least significant)
            (num >> 8) & 0xFF,  // Byte 1
            (num >> 16) & 0xFF, // Byte 2
            (num >> 24) & 0xFF  // Byte 3 (most significant)
        ];
    }
}

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

function pixels_to_blueprint(name, pixels) {
    function get_size_and_shift_coords(pixels) {
        let size = 0;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const [y, row] of pixels.entries()) {
            for (const [x, [r, g, b, a]] of row.entries()) {
                if (a > 127) {
                    size++;
                    if (x < minX) {minX = x;}
                    if (y < minY) {minY = y;}
                    if (x > maxX) {maxX = x;}
                    if (y > maxY) {maxY = y;}
                }
            }
        }
        const shift_x = Math.floor((minX + maxX) / 2);
        const shift_y = Math.floor((minY + maxY) / 2);
        return [size, shift_x, shift_y];
    }

    function get_building(target_rgb) {
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

    // Check Size
    const [building_amount, shift_x, shift_y] = get_size_and_shift_coords(pixels);
    if (building_amount > 999999) {
        show_warning("BluePrint is too big to open.");
        throw Error("BluePrint is too big to open.");
    } else if (building_amount > 78600) {
        show_warning("Blueprint is too big to share.");
        console.log("Blueprint is too big to share.");
    }

    // Set start bytes
    let name_bytes = name.length + (4 - name.length % 4);
    let file_size = 56 + name_bytes + building_amount * 20;
    let bin = new BinaryData(file_size);
    let start_bytes = [16,0,0,0,0,0,10,0,16,0,0,0,4,0,8,0,10,0,0,0];
    bin.set_uint8(start_bytes);
    let bytes_to_name = 28 + 20 * building_amount;
    bin.set_uint32([bytes_to_name, 4, building_amount]);

    // Set building starting positions
    for (let i = 0; i < building_amount; i++) {
        let pos = (building_amount - i) * 20
        bin.set_uint32(pos);
    }

    // Set building format
    let format = [0,0,14,0,16,0,6,0,8,0,12,0,4,0,5,0];
    bin.set_uint8(format);

    // Set buildings
    let bytes_to_format = 14;
    for (const [y, row] of pixels.entries()) {
        for (const [x, [r, g, b, a]] of row.entries()) {
            if (a > 127) {
                let [building, orientation] = get_building([r,g,b]);
                bin.set_uint32(bytes_to_format);
                bin.set_uint8([orientation, 0]);
                bin.set_uint16(building);
                bin.set_uint32([x - shift_x, y - shift_y])
                bytes_to_format += 16;
            }
        }
    }

    // Set name
    bin.set_uint32(name.length);
    bin.set_string(name);

    return bin.bytes
}
//#endregion



//#region Element functions
button.onclick = function() {
    const file = png_input.files[0];
    if (!file) return;

    read_image(file, function (pixelData) {
        const bytes = pixels_to_blueprint(remove_extension(file.name), pixelData);
        download_bin_file(remove_extension(file.name)+".blp", bytes);
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
//#endregion