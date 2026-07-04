// 1. DỌN DẸP HỆ THỐNG
if (window.courseraBot) clearInterval(window.courseraBot);
window.isNavigating = false;
window.waitCheckmarkCount = 0;

// BỘ NHỚ RAM TỐC ĐỘ
window.currentVideoSpeed = 2.9; 
window.lastProcessedUrl = window.location.href.split('?')[0];

console.log("🌟 KÍCH HOẠT BOT V21 (CHÂN LÝ TỐI THƯỢNG): Tua sạch Video ở mọi trang, không bao giờ lạc đường!");

try { Object.defineProperty(document, 'visibilityState', { get: () => 'visible' }); Object.defineProperty(document, 'hidden', { get: () => false }); } catch(e) {}

// --- 1. HÀM TÌM NÚT NEXT XANH LÈ (HÀNG REAL) ---
const getSolidBlueNextButton = () => {
    let targetBtn = null;
    document.querySelectorAll('button, a').forEach(btn => {
        let text = (btn.innerText || "").toLowerCase().trim();
        let trackComp = (btn.getAttribute('data-track-component') || "").toLowerCase();
        let className = (btn.className || "").toLowerCase();
        
        if (text.includes('next item') || text.includes('go to next item') || trackComp === 'next_item') {
            if (className.includes('primary')) targetBtn = btn; // Chỉ lấy nút Primary (Xanh dương đặc)
        }
    });
    return targetBtn;
};

// --- 2. HÀM LÁCH BÀI TẬP SIÊU CHUẨN (KHÔNG BỊ TRÔI VỀ BÀI 1) ---
const skipTrashPage = () => {
    // Ưu tiên 1: Thử tìm nút Next viền xanh (nút phụ) để lách qua
    let genericNext = document.querySelector('a[data-track-component="next_item"], button[data-track-component="next_item"]');
    if (genericNext && !genericNext.disabled) {
        console.log("🚪 Dùng nút Next phụ để đạp cửa sang bài mới...");
        window.isNavigating = true;
        genericNext.click();
        setTimeout(() => { window.isNavigating = false; }, 4000);
        return true;
    }

    // Ưu tiên 2: Tìm bài Video/Reading tiếp theo ngay dưới bài hiện tại trên Menu
    let activeItem = document.querySelector('.rc-NavigableItem.active, [aria-current="page"]');
    if (activeItem) {
        let allItems = Array.from(document.querySelectorAll('.rc-NavigableItem'));
        let activeIndex = allItems.indexOf(activeItem.closest('.rc-NavigableItem') || activeItem);

        if (activeIndex !== -1) {
            // Đi từ vị trí hiện tại trở xuống, tuyệt đối không lùi
            for (let i = activeIndex + 1; i < allItems.length; i++) {
                let item = allItems[i];
                let text = item.innerText.toLowerCase();
                // Nếu là Video hoặc Reading -> Nhảy vào!
                if (text.includes('video') || text.includes('reading') || text.includes('lab')) {
                    let link = item.querySelector('a');
                    if (link) {
                        console.log("➡️ Quét Menu thấy Video/Reading phía dưới. Nhảy cóc qua...");
                        window.isNavigating = true;
                        link.click();
                        setTimeout(() => { window.isNavigating = false; }, 4000);
                        return true;
                    }
                }
            }
        }
    }
    return false;
};

// 3. VÒNG LẶP CÀN QUÉT CHÍNH (Chạy mỗi 3 giây)
window.courseraBot = setInterval(() => {
    if (window.isNavigating) return;

    // --- RESET TỐC ĐỘ MAX KHI SANG BÀI MỚI ---
    let currentUrl = window.location.href.split('?')[0];
    if (currentUrl !== window.lastProcessedUrl) {
        window.currentVideoSpeed = 2.9; 
        window.waitCheckmarkCount = 0;
        window.lastProcessedUrl = currentUrl;
        console.log("➡️ Vừa vào bài mới! Bơm max ga 2.9x.");
    }
    
    // --- 1. CHÂN LÝ: BẮT ĐƯỢC NÚT "NEXT" XANH LÈ LÀ CHUYỂN BÀI NGAY ---
    let solidBlueBtn = getSolidBlueNextButton();
    if (solidBlueBtn && !solidBlueBtn.disabled) {
        document.querySelectorAll('video, audio').forEach(media => { if (!media.paused) media.pause(); });
        console.log("✅ TÍCH XANH ĐÃ ĐƯỢC NẠP (Thấy nút xanh dương). Lướt qua bài mới...");
        window.isNavigating = true;
        solidBlueBtn.click();
        setTimeout(() => { window.isNavigating = false; }, 4000);
        return; 
    }

    // --- 2. LÁCH BÀI TẬP / QUIZ KHI AFK ---
    const isTrashPage = window.location.href.includes('/quiz') || window.location.href.includes('/exam') || window.location.href.includes('/assignment') || window.location.href.includes('/peer') || window.location.href.includes('/discussion');
    if (isTrashPage) {
        if (!skipTrashPage()) {
            console.log("🎉 HẾT BÀI ĐỂ CÀY! Khóa học đã dọn sạch, đợi bạn thi thôi.");
            clearInterval(window.courseraBot);
        }
        return;
    }

    // --- 3. BẤM CÁC NÚT PHỤ TRÊN MÀN HÌNH ---
    let skipBtn = null; 
    let markCompleteBtn = null;
    document.querySelectorAll('button, a').forEach(btn => {
        const text = (btn.innerText || "").toLowerCase().trim();
        if (text === 'skip' || text === 'continue') skipBtn = btn; 
        if (text === 'mark as completed' || text === 'đánh dấu đã hoàn thành') markCompleteBtn = btn;
    });

    if (skipBtn && skipBtn.offsetParent !== null) { skipBtn.click(); return; }

    // Nếu có nút "Mark as completed" dạng clickable (cho các bài đọc thuần văn bản)
    if (markCompleteBtn && !markCompleteBtn.disabled && window.location.href.includes('/supplement/')) {
        window.isNavigating = true;
        markCompleteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        setTimeout(() => { window.isNavigating = false; }, 3000);
        return;
    }

    // --- 4. TUA MỌI VIDEO Ở MỌI TRANG (Cả Lecture lẫn Supplement) ---
    // Khắc phục triệt để lỗi ảnh 3 của bạn: Tua video ở trang Reading để ép nút xanh hiện ra!
    const media = document.querySelector('video, audio');
    if (media) {
        if (media.readyState < 1) return; 
        if (!media.muted) media.muted = true; 
        
        if (media.playbackRate !== window.currentVideoSpeed) {
            media.playbackRate = window.currentVideoSpeed;
            console.log(`⚙️ Đang ép tốc độ: ${window.currentVideoSpeed}x để triệu hồi nút xanh...`);
        }
        
        if (media.paused && !media.ended) {
            media.play().catch(() => {}); 
        }

        if (media.ended) {
            window.waitCheckmarkCount++;
            console.log(`⏳ Video hết. Đứng lỳ chờ nút Next xanh lè xuất hiện... (${window.waitCheckmarkCount * 3}s)`);
            
            // 15s không thấy Nút Next xanh (Lỗi 400) -> TUA LẠI BẰNG SỐ LÙI
            if (window.waitCheckmarkCount > 5) { 
                if (window.currentVideoSpeed > 1.5) {
                    console.log("❌ Server chặn (Lỗi 400)! Hạ ga 1.5x và TUA LẠI...");
                    window.currentVideoSpeed = 1.5; 
                    media.currentTime = 0;          
                    media.play().catch(()=>{});     
                    window.waitCheckmarkCount = 0;  
                } else {
                    console.log("☠️ Server đứng hình. Ép F5 để cứu trang...");
                    window.isNavigating = true;
                    window.location.reload();
                }
            }
        } else {
            window.waitCheckmarkCount = 0; 
        }
    }
}, 3000);
