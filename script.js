let cameraStream = null; // Pemboleh ubah global untuk menyimpan strim kamera

// Fungsi untuk menunjukkan kotak mesej kustom
function showMessageBox(title, message) {
    const msgBox = document.getElementById('message-box');
    document.getElementById('message-box-title').innerText = title;
    document.getElementById('message-box-content').innerText = message;
    msgBox.classList.remove('hidden'); // Paparkan kotak mesej dengan membuang kelas hidden
    msgBox.style.display = 'flex'; // Pastikan display flex untuk centering
}

// Fungsi untuk menyembunyikan kotak mesej kustom
function hideMessageBox() {
    const msgBox = document.getElementById('message-box'); // Dapatkan semula rujukan
    msgBox.classList.add('hidden'); // Sembunyikan kotak mesej dengan menambah kelas hidden
    msgBox.style.display = ''; // Clear inline style if any
}

// Fungsi untuk mengendalikan ralat pemuatan imej
function handleImageError() {
    console.error('Image failed to load in handleImageError! This might indicate corrupt data or an invalid data URL.');
    showMessageBox('Ralat Imej', 'Imej yang ditangkap gagal dimuatkan. Ini mungkin disebabkan oleh format imej tidak sah atau data rosak. Sila cuba tangkap gambar semula.');
    // Pastikan placeholder kembali kelihatan jika imej gagal dimuat
    document.getElementById('captured-image').classList.add('hidden');
    document.getElementById('image-placeholder-text').classList.remove('hidden');
}

// --- PENTING: Lampirkan event listener setelah DOM dimuatkan ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOMContentLoaded fired. Initializing...");

    // Sembunyikan kotak mesej pada permulaan
    hideMessageBox(); // Pastikan ia tersembunyi
    console.log("Kotak mesej dijangka tersembunyi secara lalai.");

    // Dapatkan butang "mula" dan lampirkan event listener
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.addEventListener('click', function() {
            console.log('Event listener: Butang "mula" diklik.');
            navigateTo('camera-screen');
        });
        console.log("Event listener dilampirkan pada butang 'mula'.");
    } else {
        console.error("Butang 'mula' dengan ID 'start-button' tidak ditemui. Semak HTML.");
    }

    // Pastikan ikon Lucide dipaparkan selepas Lucide dimuatkan
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            console.log("Lucide icons created.");
        } else {
            console.warn("Lucide is not defined. Ikon mungkin tidak dipaparkan.");
        }
    }, 100); // Sedikit kelewatan
});

// Fungsi untuk menguruskan navigasi antara skrin
function navigateTo(screenId) {
    console.log(`Navigasi dipanggil ke: ${screenId}`);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden'); // Sembunyikan semua skrin
        // Hapus style.display inline jika ada, untuk biarkan Tailwind menguruskan sepenuhnya
        screen.style.display = ''; 
        console.log(`Menyembunyikan: ${screen.id}`);
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden'); // Paparkan skrin sasaran
        targetScreen.style.display = 'flex'; // Tetapkan display flex untuk layout
        console.log(`Memaparkan skrin: ${screenId}`);
    } else {
        console.error(`Skrin sasaran dengan ID "${screenId}" tidak ditemui.`);
        showMessageBox("Ralat Navigasi", `Skrin "${screenId}" tidak ditemui. Sila hubungi pembangun.`);
        return; // Hentikan fungsi jika skrin tidak ditemui
    }

    // Jika navigasi ke skrin kamera, mulakan kamera
    if (screenId === 'camera-screen') {
        startCamera();
    } else {
        stopCamera(); // Hentikan kamera jika beralih dari skrin kamera
    }

    // Sembunyikan ringkasan dan spinner apabila bertukar skrin
    document.getElementById('summary-output').classList.add('hidden');
    document.getElementById('loading-spinner').classList.add('hidden'); // Guna class hidden
    // Kosongkan dan sembunyikan imej yang ditangkap
    document.getElementById('captured-image').src = '';
    document.getElementById('captured-image').classList.add('hidden'); // Guna class hidden
    document.getElementById('image-placeholder-text').classList.remove('hidden'); // Guna class hidden
}

// Fungsi untuk memulakan strim kamera
async function startCamera() {
    console.log("Mencuba untuk memulakan kamera belakang...");
    const video = document.getElementById('camera-stream');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMessageBox("Ralat Pelayar", "Pelayar anda tidak menyokong akses kamera. Sila gunakan pelayar yang lebih baru atau peranti yang berbeza.");
        console.error("getUserMedia tidak disokong.");
        return; // Hentikan fungsi jika tidak disokong
    }

    try {
        let stream = null;
        // Cuba untuk mendapatkan strim video dengan facingMode 'environment' (kamera belakang)
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            console.log("Strim kamera diperolehi dengan 'environment' facingMode (kamera belakang).");
        } catch (e) {
            // Jika kamera belakang gagal, cuba dengan tetapan generik
            console.warn("Akses kamera belakang gagal, mencuba tetapan kamera generik:", e);
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            console.log("Strim kamera diperolehi dengan tetapan generik.");
        }

        video.srcObject = stream;
        cameraStream = stream; // Simpan strim untuk pemberhentian kemudian

        // Pastikan video mula dimainkan sebelum meneruskan
        video.onloadedmetadata = () => {
            video.play();
            console.log("Video telah mula dimainkan.");
        };
        // Jika video sudah dimuat, mainkan terus
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
            video.play();
            console.log("Video sudah sedia, telah dimainkan.");
        }

    } catch (err) {
        console.error("Ralat mengakses kamera: ", err);
        let errorMessage = "Tidak dapat mengakses kamera. Sila benarkan akses kamera di pelayar anda.";
        if (err.name === "NotAllowedError") {
            errorMessage = "Akses kamera ditolak. Sila benarkan akses kamera melalui tetapan pelayar anda.";
        } else if (err.name === "NotFoundError") {
            errorMessage = "Tiada kamera ditemui pada peranti anda.";
        } else if (err.name === "NotReadableError") {
            errorMessage = "Kamera mungkin sedang digunakan oleh aplikasi lain.";
        }
        showMessageBox("Ralat Akses Kamera", errorMessage);
    }
}

// Fungsi untuk menghentikan strim kamera
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        console.log("Kamera telah dihentikan.");
    }
}

// Fungsi untuk menangkap gambar dari strim kamera
function capturePhoto() {
    console.log("Fungsi capturePhoto() dipanggil.");
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const capturedImage = document.getElementById('captured-image');
    const imagePlaceholderText = document.getElementById('image-placeholder-text');

    // --- Diagnostik Tambahan: Semak visibility elemen ---
    console.log('Initial capturedImage.style.display (before setting):', capturedImage.style.display);
    console.log('Initial imagePlaceholderText.style.display (before setting):', imagePlaceholderText.style.display);


    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        console.log("Video state is HAVE_ENOUGH_DATA.");
        console.log('Video dimensions (width, height):', video.videoWidth, video.videoHeight);

        // Set canvas dimensions
        // Penting: Pastikan dimensi kanvas adalah sama dengan video untuk kualiti imej yang baik
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Canvas dimensions set to (width, height):', canvas.width, canvas.height);

        const context = canvas.getContext('2d');
        // Mengambil imej dari video dan melukisnya ke kanvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("Video drawn to canvas.");

        // Menjana data URL imej dari kanvas
        const imageDataUrl = canvas.toDataURL('image/png');
        console.log('imageDataUrl generated. Length:', imageDataUrl.length); // Log length to see if it's substantial

        // Semak jika imageDataUrl sah sebelum memaparkan
        if (imageDataUrl && imageDataUrl.length > 100) { // Jika panjang data URL lebih dari 100, kemungkinan ia imej yang sah
            capturedImage.src = imageDataUrl;
            console.log("Captured image src set. Waiting for image to load before displaying...");

            // Tambah event listener untuk memastikan imej dimuatkan sebelum dipaparkan
            // Gunakan fungsi anak panah untuk mengekalkan konteks 'this' jika diperlukan (walaupun tidak di sini)
            capturedImage.onload = () => {
                capturedImage.classList.remove('hidden'); // Paparkan elemen imej
                imagePlaceholderText.classList.add('hidden'); // Sembunyikan teks placeholder
                console.log("Captured image ONLOAD. Display changed to block.");
                console.log("Current capturedImage.style.display (after onload):", capturedImage.style.display);
                // Penting: Alih keluar onload handler setelah ia dicetuskan untuk mengelakkan ralat berganda atau tingkah laku yang tidak dijangka
                capturedImage.onload = null;
            };
            // Jika imej sudah dimuat (mungkin cached data URL), pastikan onload dipanggil
            if (capturedImage.complete) {
                capturedImage.onload();
            }

        } else {
            console.error("imageDataUrl appears to be empty or too short. Image capture might have failed.");
            showMessageBox("Ralat Tangkapan Imej", "Gagal menangkap imej. Imej yang ditangkap kosong atau tidak sah.");
            // Kekalkan placeholder kelihatan jika tangkapan imej gagal
            capturedImage.classList.add('hidden'); // Pastikan imej tersembunyi
            imagePlaceholderText.classList.remove('hidden'); // Paparkan placeholder
        }

        // Simulasi data MyKad (masih menggunakan data keras buat masa ini)
        document.getElementById('no_kp').value = '880101-14-5678';
        document.getElementById('nama').value = 'AHMAD BIN HASSAN';
        document.getElementById('tarikh_lahir').value = '01/01/1988';
        document.getElementById('alamat').value = 'NO. 10, JALAN ANGGUR, TAMAN MAKMUR, 43000 KAJANG, SELANGOR';

        navigateTo('info-screen'); // Navigasi ke skrin maklumat
        console.log("Simulated MyKad data filled and navigated to info screen.");
    } else {
        showMessageBox("Kamera Tidak Sedia", "Kamera belum bersedia untuk menangkap gambar. Sila pastikan strim video kelihatan dan cuba lagi.");
        console.error("Gagal menangkap gambar: video.readyState bukan HAVE_ENOUGH_DATA. Current state:", video.readyState);
    }
}

// Fungsi untuk memanggil Gemini API dan menjana ringkasan
async function generateMyKadSummary() {
    const no_kp = document.getElementById('no_kp').value;
    const nama = document.getElementById('nama').value;
    const tarikh_lahir = document.getElementById('tarikh_lahir').value;
    const alamat = document.getElementById('alamat').value;
    const summaryOutput = document.getElementById('summary-output');
    const loadingSpinner = document.getElementById('loading-spinner');

    loadingSpinner.classList.remove('hidden'); // Paparkan spinner
    summaryOutput.classList.add('hidden'); // Sembunyikan output
    summaryOutput.innerText = '';
    console.log("Menjana ringkasan dengan Gemini AI...");

    const prompt = `Sila ringkaskan maklumat MyKad berikut dalam satu atau dua ayat sahaja. Fokus pada identiti utama dan lokasi:
    Nombor KP: ${no_kp}
    Nama: ${nama}
    Tarikh Lahir: ${tarikh_lahir}
    Alamat: ${alamat}
    Ringkasan:`;

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatHistory };
    const apiKey = ""; // API key will be provided automatically by the Canvas environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            summaryOutput.innerText = text;
            summaryOutput.classList.remove('hidden');
            console.log("Ringkasan Gemini AI berjaya dijana.");
        } else {
            summaryOutput.innerText = 'Gagal menjana ringkasan. Tiada hasil daripada Gemini API.';
            summaryOutput.classList.remove('hidden');
            console.error("Gagal menjana ringkasan: Tiada hasil daripada Gemini API.");
        }
    } catch (error) {
        console.error('Ralat memanggil Gemini API:', error);
        summaryOutput.innerText = 'Ralat menjana ringkasan: ' + error.message;
        summaryOutput.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden'); // Sembunyikan spinner
    }
}