let droppedFile = null;

const dropArea = document.getElementById('drop-area');
const fileNameDiv = document.getElementById('file-name');
const previewImg = document.getElementById('preview');
const toolsDiv = document.getElementById('tools');
const colorPicker = document.getElementById('color-picker');
const pickedRgbSpan = document.getElementById('picked-rgb');
const toleranceSlider = document.getElementById('tolerance-slider');
const toleranceValue = document.getElementById('tolerance-value');
const removeColorBtn = document.getElementById('remove-color-btn');
const convertIcoBtn = document.getElementById('convert-ico-btn');
const pipetteToggleBtn = document.getElementById('pipette-toggle-btn');

let pickedColor = {r:0,g:0,b:0};
let tolerance = 20;
let pipetteActive = false;

// Remove generate button if present
const generateBtn = document.getElementById('generate-btn');
if (generateBtn) generateBtn.style.display = 'none';

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});
dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length && files[0].type.startsWith('image/')) {
        droppedFile = files[0];
        fileNameDiv.textContent = `Selected: ${droppedFile.name}`;
        // Show preview
        const url = URL.createObjectURL(droppedFile);
        previewImg.src = url;
        previewImg.style.display = 'block';
        toolsDiv.style.display = 'block';
        previewImg.classList.remove('pipette-cursor');
        pipetteActive = false;
        pipetteToggleBtn.classList.remove('active');
    } else {
        fileNameDiv.textContent = 'Please drop a valid image file.';
        previewImg.style.display = 'none';
        toolsDiv.style.display = 'none';
        previewImg.classList.remove('pipette-cursor');
        pipetteActive = false;
        pipetteToggleBtn.classList.remove('active');
    }
});

// Pipette toggle
pipetteToggleBtn.innerHTML = '<img src="pipette.png" alt="Pipette" />';

pipetteToggleBtn.addEventListener('click', function() {
    pipetteActive = !pipetteActive;
    if (pipetteActive) {
        previewImg.classList.add('pipette-cursor');
        pipetteToggleBtn.classList.add('active');
        pipetteToggleBtn.innerHTML = '<img src="pipette.png" alt="Deactivate Pipette" />';
    } else {
        previewImg.classList.remove('pipette-cursor');
        pipetteToggleBtn.classList.remove('active');
        pipetteToggleBtn.innerHTML = '<img src="pipette.png" alt="Activate Pipette" />';
    }
});

// Pipette: pick color from image only if pipette is active
previewImg.addEventListener('click', function(e) {
    if (!pipetteActive) return;
    const rect = previewImg.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (previewImg.naturalWidth / previewImg.width));
    const y = Math.floor((e.clientY - rect.top) * (previewImg.naturalHeight / previewImg.height));
    const canvas = document.createElement('canvas');
    canvas.width = previewImg.naturalWidth;
    canvas.height = previewImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(previewImg, 0, 0);
    const data = ctx.getImageData(x, y, 1, 1).data;
    pickedColor = {r: data[0], g: data[1], b: data[2]};
    colorPicker.value = rgbToHex(pickedColor.r, pickedColor.g, pickedColor.b);
    pickedRgbSpan.textContent = `RGB(${pickedColor.r},${pickedColor.g},${pickedColor.b})`;
    pipetteActive = false;
    previewImg.classList.remove('pipette-cursor');
    pipetteToggleBtn.classList.remove('active');
    pipetteToggleBtn.innerHTML = '<img src="pipette.png" alt="Activate Pipette" />';
});

toleranceSlider.addEventListener('input', function() {
    tolerance = parseInt(toleranceSlider.value);
    toleranceValue.textContent = tolerance;
});

// Add result image and download button
let resultImg = document.getElementById('result-img');
let downloadResultBtn = document.getElementById('download-result-btn');
let downloadIcoBtn = document.getElementById('download-ico-btn');
let originalToIcoBtn = document.getElementById('original-to-ico-btn');
if (!resultImg) {
    resultImg = document.createElement('img');
    resultImg.id = 'result-img';
    resultImg.style.display = 'none';
    resultImg.style.maxWidth = '100%';
    resultImg.style.margin = '24px 0 0 0';
    resultImg.style.borderRadius = '6px';
    resultImg.style.display = 'block';
    resultImg.style.marginLeft = 'auto';
    resultImg.style.marginRight = 'auto';
    resultImg.style.textAlign = 'center';
    document.querySelector('.container').appendChild(resultImg);
}
if (!downloadResultBtn) {
    downloadResultBtn = document.createElement('button');
    downloadResultBtn.id = 'download-result-btn';
    downloadResultBtn.textContent = 'Download PNG';
    downloadResultBtn.className = 'action-btn';
    downloadResultBtn.style.display = 'none';
    document.querySelector('.container').appendChild(downloadResultBtn);
}
if (!downloadIcoBtn) {
    downloadIcoBtn = document.createElement('button');
    downloadIcoBtn.id = 'download-ico-btn';
    downloadIcoBtn.textContent = 'Download ICO';
    downloadIcoBtn.className = 'action-btn';
    downloadIcoBtn.style.display = 'none';
    document.querySelector('.container').appendChild(downloadIcoBtn);
}
if (!originalToIcoBtn) {
    originalToIcoBtn = document.createElement('button');
    originalToIcoBtn.id = 'original-to-ico-btn';
    originalToIcoBtn.className = 'action-btn';
    originalToIcoBtn.style.marginLeft = '8px';
    originalToIcoBtn.title = 'Convert original image to ICO';
    originalToIcoBtn.textContent = 'Download ICO';
    removeColorBtn.parentNode.insertBefore(originalToIcoBtn, removeColorBtn.nextSibling);
}
let lastResultBlob = null;

removeColorBtn.addEventListener('click', function() {
    if (!droppedFile) return;
    const img = new window.Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i+1];
            const b = imageData.data[i+2];
            if (colorDistance({r,g,b}, pickedColor) <= tolerance) {
                imageData.data[i+3] = 0; // transparent
            }
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(function(blob) {
            lastResultBlob = blob;
            resultImg.src = URL.createObjectURL(blob);
            resultImg.style.display = 'block';
            downloadResultBtn.style.display = 'inline-block';
            downloadIcoBtn.style.display = 'inline-block';
        }, 'image/png');
    };
    img.src = URL.createObjectURL(droppedFile);
});

downloadResultBtn.addEventListener('click', function() {
    if (!lastResultBlob) return;
    let baseName = droppedFile ? droppedFile.name.replace(/\.[^/.]+$/, "") : "image";
    const link = document.createElement('a');
    link.href = URL.createObjectURL(lastResultBlob);
    link.download = baseName + '_removed_color.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
});
downloadIcoBtn.addEventListener('click', function() {
    if (!droppedFile || !lastResultBlob) return;
    let baseName = droppedFile ? droppedFile.name.replace(/\.[^/.]+$/, "") : "icon";
    const img = new window.Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        canvas.toBlob(function(pngBlob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pngArray = new Uint8Array(e.target.result);
                const icoHeader = new Uint8Array([
                    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x40, 0x40, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00,
                    pngArray.length & 0xFF, (pngArray.length >> 8) & 0xFF, (pngArray.length >> 16) & 0xFF, (pngArray.length >> 24) & 0xFF,
                    22, 0, 0, 0
                ]);
                const icoArray = new Uint8Array(icoHeader.length + pngArray.length);
                icoArray.set(icoHeader, 0);
                icoArray.set(pngArray, icoHeader.length);
                const icoBlob = new Blob([icoArray], {type: 'image/x-icon'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(icoBlob);
                link.download = baseName + '_removed_color.ico';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            };
            reader.readAsArrayBuffer(pngBlob);
        }, 'image/png');
    };
    img.src = URL.createObjectURL(lastResultBlob);
});
originalToIcoBtn.addEventListener('click', function() {
    if (!droppedFile) return;
    let baseName = droppedFile ? droppedFile.name.replace(/\.[^/.]+$/, "") : "icon";
    const img = new window.Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 64, 64);
        canvas.toBlob(function(pngBlob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const pngArray = new Uint8Array(e.target.result);
                const icoHeader = new Uint8Array([
                    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x40, 0x40, 0x00, 0x00, 0x01, 0x00, 0x20, 0x00,
                    pngArray.length & 0xFF, (pngArray.length >> 8) & 0xFF, (pngArray.length >> 16) & 0xFF, (pngArray.length >> 24) & 0xFF,
                    22, 0, 0, 0
                ]);
                const icoArray = new Uint8Array(icoHeader.length + pngArray.length);
                icoArray.set(icoHeader, 0);
                icoArray.set(pngArray, icoHeader.length);
                const icoBlob = new Blob([icoArray], {type: 'image/x-icon'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(icoBlob);
                link.download = baseName + '.ico';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            };
            reader.readAsArrayBuffer(pngBlob);
        }, 'image/png');
    };
    img.src = URL.createObjectURL(droppedFile);
});

function colorDistance(c1, c2) {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0,2), 16),
        g: parseInt(hex.substring(2,4), 16),
        b: parseInt(hex.substring(4,6), 16)
    };
}
