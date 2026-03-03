// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// App Data State
let categories = [];
let subcategories = [];
let products = [];
let currentMainFilter = 'all';
let currentSubFilter = 'all';

// Initialize App
function init() {
    document.getElementById('year').textContent = new Date().getFullYear();

    // Init Interactions
    initNavbarScroll();
    initCustomCursor();
    initParticles();
    initGSAPAnimations();
    setupModals();
    setupFAQs();
    initThemeToggle();

    // Default Fallback load while Firebase connects
    categories = [...defaultCategories];
    subcategories = [...defaultSubcategories];
    products = [...defaultProducts];
    loadLeadershipImages();
    renderDynamicUI();
    renderProducts('all');

    // FIREBASE REALTIME SYNC
    if (typeof db !== 'undefined') {
        db.ref('sapna_data').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (data.categories) categories = data.categories;
                if (data.subcategories) subcategories = data.subcategories;
                if (data.products) products = data.products;

                if (data.ceo_img) window.savedCeoImgFirebase = data.ceo_img;
                if (data.owner_img) window.savedOwnerImgFirebase = data.owner_img;

                updateLeadershipImagesDOM();
            } else {
                // Initial push if Firebase is empty
                saveToFirebase();
            }

            renderDynamicUI();
            renderProducts(currentMainFilter, currentSubFilter);
            if (document.getElementById('adminModal')) {
                populateAdminDropdowns();
            }
        });
    }
}

// Firebase Helper
window.saveToFirebase = function () {
    if (typeof db !== 'undefined') {
        db.ref('sapna_data').update({
            categories: categories,
            subcategories: subcategories,
            products: products
        });
    }
}

// -----------------------------------------
// IMAGE COMPRESSION & BASE64 HELPER
// -----------------------------------------
function fileToBase64(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                // If image is smaller than max width, just use original size
                const width = Math.min(maxWidth, img.width);
                const scale = width / img.width;
                const height = img.height * scale;

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Compress slightly to save LocalStorage space
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        };
        reader.onerror = error => reject(error);
    });
}

// -----------------------------------------
// PREMIUM MIX-BLEND CURSOR
// -----------------------------------------
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const hoverElements = document.querySelectorAll('.custom-hover, a, button, .dropdown, input, select');

    if (window.matchMedia("(pointer: fine)").matches) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let cursorX = mouseX, cursorY = mouseY;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth follower
        gsap.ticker.add(() => {
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            gsap.set(cursor, { x: cursorX, y: cursorY });
        });

        // Hover States
        hoverElements.forEach(el => bindCursorEvents(cursor, el));
    } else {
        cursor.style.display = 'none';
        document.body.style.cursor = 'auto';
    }
}

function bindCursorEvents(cursor, el) {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
}

function rebindCursorHover() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cursor = document.querySelector('.cursor');
    const newHovers = document.querySelectorAll('.pop-item, .product-card, .cat-pill');

    newHovers.forEach(el => {
        el.removeEventListener('mouseenter', () => cursor.classList.add('active'));
        el.removeEventListener('mouseleave', () => cursor.classList.remove('active'));
        bindCursorEvents(cursor, el);
    });
}

// -----------------------------------------
// THEME TOGGLE LOGIC
// -----------------------------------------
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (!themeToggleBtn || !themeIcon) return;

    // Check localStorage for saved theme, default is dark (no class)
    const savedTheme = localStorage.getItem('sapna_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }

    themeToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');

        if (isLight) {
            localStorage.setItem('sapna_theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            localStorage.setItem('sapna_theme', 'dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    });
}

// -----------------------------------------
// BACKGROUND PARTICLES
// -----------------------------------------
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 6 + 2;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const duration = Math.random() * 12 + 10;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}vw`;
        particle.style.top = `${posY}vh`;

        particlesContainer.appendChild(particle);

        gsap.to(particle, {
            y: `-${Math.random() * 150 + 50}`,
            x: `+=${Math.random() * 50 - 25}`,
            opacity: 0,
            duration: duration,
            repeat: -1,
            ease: "linear",
            delay: Math.random() * -duration
        });
    }
}

// -----------------------------------------
// GSAP ANIMATIONS
// -----------------------------------------
function initGSAPAnimations() {
    const heroTl = gsap.timeline();
    // Only trigger initial load animations for elements inside the Hero header
    heroTl.from("header.hero .gsap-slide-up, .about-text.gsap-slide-up", { y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out" })
        .from(".hero-leadership-info.gsap-fade", { opacity: 0, duration: 1 }, "-=0.5")
        .from(".hero-visual.gsap-float", { x: 50, opacity: 0, duration: 1, ease: "back.out(1.7)" }, "-=1");

    // For all other slide-up elements, trigger on scroll
    gsap.utils.toArray('section:not(#home) .gsap-slide-up, footer .gsap-slide-up, .split-row.gsap-slide-up').forEach(el => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: "top 85%" },
            y: 50, opacity: 0, duration: 1, ease: "power2.out"
        });
    });

    gsap.utils.toArray('.quote-glass-box').forEach(el => {
        gsap.from(el, { scrollTrigger: { trigger: el, start: "top 80%" }, scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.5)" });
    });

    gsap.from(".premium-block", {
        scrollTrigger: { trigger: ".footer-grid-premium", start: "top 85%" },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out"
    });

    gsap.utils.toArray('.gsap-scale').forEach(el => {
        gsap.from(el, { scrollTrigger: { trigger: el, start: "top 85%" }, scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.5)" });
    });

    initCounterAnimation();
}

function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        counter.innerHTML = '0';
        ScrollTrigger.create({
            trigger: counter,
            start: "top 90%",
            once: true,
            onEnter: () => {
                const target = +counter.getAttribute('data-target');
                gsap.to(counter, {
                    innerHTML: target,
                    duration: 2.5,
                    ease: "power2.out",
                    snap: { innerHTML: 1 },
                    onUpdate: function () {
                        counter.innerHTML = Math.ceil(Number(this.targets()[0].innerHTML));
                    }
                });
            }
        });
    });
}

function animateGrid(selector) {
    const items = document.querySelectorAll(selector);
    if (items.length > 0) {
        gsap.fromTo(items,
            { y: 50, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(1.2)", overwrite: true }
        );
    }
}

// -----------------------------------------
// NAVBAR
// -----------------------------------------
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.7)';
            navbar.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.1)';
        }
    });

    // Mobile Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.innerHTML = navLinks.classList.contains('active')
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars-staggered"></i>';
        });

        // Close mobile nav when clicking normal links
        const navItems = navLinks.querySelectorAll('li > a:not(.dropbtn)');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    hamburger.innerHTML = '<i class="fa-solid fa-bars-staggered"></i>';
                }
            });
        });

        // Toggle dropdown on mobile
        const dropBtn = document.querySelector('.dropbtn');
        const dropdown = document.querySelector('.dropdown');
        if (dropBtn && dropdown) {
            dropBtn.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    }
}

// -----------------------------------------
// RENDER DYNAMIC UI (CATEGORIES & SUBS)
// -----------------------------------------
function renderDynamicUI() {
    const navDropdown = document.getElementById('navDropdown');
    const mainFilters = document.getElementById('mainFilters');

    navDropdown.innerHTML = `<a href="#" data-filter="all" class="custom-hover">Everything</a>`;
    mainFilters.innerHTML = `<button class="cat-pill active custom-hover" data-filter="all" style="--pill-color: #6366f1;">
        <i class="fa-solid fa-layer-group"></i> All
    </button>`;

    categories.forEach(cat => {
        navDropdown.innerHTML += `<a href="#" data-filter="${cat.id}" class="custom-hover"><i class="fa-solid ${cat.icon}"></i> ${cat.name}</a>`;
        mainFilters.innerHTML += `
            <button class="cat-pill custom-hover" data-filter="${cat.id}" style="--pill-color: ${cat.color || '#ec4899'};">
                <i class="fa-solid ${cat.icon}"></i> ${cat.name}
            </button>
        `;
    });

    setupFilters();
    setTimeout(() => { animateGrid('.cat-pill'); rebindCursorHover(); }, 100);
}

function renderSubFilters(mainCategoryId) {
    const subWrapper = document.getElementById('subFiltersWrapper');
    const subFiltersContainer = document.getElementById('subFilters');

    if (mainCategoryId === 'all') {
        gsap.to(subWrapper, { opacity: 0, height: 0, duration: 0.4, onComplete: () => subWrapper.style.display = 'none' });
        return;
    }

    const relevantSubs = subcategories.filter(s => s.parentId === mainCategoryId);
    if (relevantSubs.length === 0) {
        gsap.to(subWrapper, { opacity: 0, height: 0, duration: 0.4, onComplete: () => subWrapper.style.display = 'none' });
        return;
    }

    subWrapper.style.display = 'block';
    gsap.fromTo(subWrapper, { opacity: 0, height: 0 }, { opacity: 1, height: 'auto', duration: 0.5, ease: "power2.out" });

    subFiltersContainer.innerHTML = `
        <div class="pop-item active custom-hover" data-subfilter="all">
            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=300" alt="All">
            <span>View All</span>
        </div>
    `;

    relevantSubs.forEach(sub => {
        subFiltersContainer.innerHTML += `
            <div class="pop-item custom-hover" data-subfilter="${sub.id}">
                <img src="${sub.image || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=300'}" alt="${sub.name}">
                <span>${sub.name}</span>
            </div>
        `;
    });

    const subBtns = document.querySelectorAll('.pop-item');
    subBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            subBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
            currentSubFilter = btn.dataset.subfilter;
            renderProducts(currentMainFilter, currentSubFilter);
        });
    });
    rebindCursorHover();
}

// -----------------------------------------
// RENDER PRODUCTS
// -----------------------------------------
function renderProducts(mainCategory, subCategory = 'all') {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    let filtered = products;
    if (mainCategory !== 'all') filtered = filtered.filter(p => p.category === mainCategory);
    if (subCategory !== 'all') filtered = filtered.filter(p => p.subcategory === subCategory);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; background: rgba(255,255,255,0.4); border-radius: 20px;">
                <h3 style="color: var(--accent); margin-bottom: 10px;">More items coming soon!</h3>
                <p style="color: var(--text-light);">We are currently restocking this series.</p>
            </div>`;
        return;
    }

    filtered.forEach(product => {
        const catObj = categories.find(c => c.id === product.category);
        const catName = catObj ? catObj.name : 'Trend';

        let actionButtons = '';
        if (document.getElementById('admin-page')) {
            actionButtons = `
                <div class="admin-actions" style="margin-top:15px; display:flex; gap:10px;">
                    <button class="btn btn-primary custom-hover" style="flex:1; padding:8px; font-size: 0.9rem;" onclick="editProduct(${product.id})"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="btn btn-glass custom-hover" style="flex:1; padding:8px; font-size: 0.9rem; color: #f43f5e; border-color: #f43f5e;" onclick="deleteProduct(${product.id})"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `;
        } else if (document.getElementById('public-page')) {
            const waText = encodeURIComponent(`I want to order:\n*${product.name}*\nPrice: ${product.price}`);
            actionButtons = `
                <button class="btn btn-primary w-100 custom-hover" style="margin-top:15px; justify-content: center;" onclick="addToCart(${product.id})">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                <a href="https://wa.me/923136791333?text=${waText}" target="_blank" class="btn btn-glass w-100 custom-hover" style="margin-top:10px; justify-content: center; color: #25D366; border-color: #25D366;">
                    <i class="fa-brands fa-whatsapp"></i> Direct WhatsApp
                </a>
            `;
        }

        const html = `
            <div class="glass-card product-card custom-hover">
                <div class="product-img-wrap">
                    <span class="price-tag">${product.price}</span>
                    <img src="${product.image}" loading="lazy" alt="${product.name}">
                </div>
                <div class="product-info">
                    <p style="color: ${catObj ? catObj.color : 'var(--accent)'}">${catName}</p>
                    <h3>${product.name}</h3>
                    ${actionButtons}
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });

    setTimeout(() => { animateGrid('.product-card'); rebindCursorHover(); }, 50);
}

// Filters logic
function setupFilters() {
    const filterBtns = document.querySelectorAll('.cat-pill');
    const dropBtns = document.querySelectorAll('.dropdown-content a');

    const changeMainFilter = (filterVal, e) => {
        if (e) e.preventDefault();
        currentMainFilter = filterVal;
        currentSubFilter = 'all';

        filterBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = Array.from(filterBtns).find(b => b.dataset.filter === filterVal);
        if (activeBtn) {
            activeBtn.classList.add('active');
            gsap.fromTo(activeBtn, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
        }

        renderSubFilters(filterVal);
        renderProducts(filterVal, 'all');

        if (e && e.currentTarget.closest('.dropdown')) {
            document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
        }
    };

    filterBtns.forEach(btn => btn.addEventListener('click', (e) => changeMainFilter(btn.dataset.filter, e)));
    dropBtns.forEach(btn => btn.addEventListener('click', (e) => changeMainFilter(btn.dataset.filter, e)));
}

// -----------------------------------------
// ADMIN MODAL & FILE UPLOAD LOGIC
// -----------------------------------------
function setupModals() {
    // Admin Modal
    const adminModal = document.getElementById('adminModal');
    const openAdminBtn = document.getElementById('openAdminBtn');
    const closeAdminBtn = adminModal ? adminModal.querySelector('.close-modal') : null;

    // Contact Modal
    const contactModal = document.getElementById('contactModal');
    const openContactBtn = document.getElementById('openContactBtn');
    const closeContactBtn = document.getElementById('closeContactBtn');

    // Admin Tabs Logic
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            populateAdminDropdowns();
        });
    });

    // Admin Listeners
    if (openAdminBtn) {
        openAdminBtn.addEventListener('click', (e) => {
            e.preventDefault();
            populateAdminDropdowns();
            adminModal.classList.add('active');
        });
    }
    if (closeAdminBtn) closeAdminBtn.addEventListener('click', () => adminModal.classList.remove('active'));

    // Contact Listeners
    if (openContactBtn) {
        openContactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.classList.add('active');
        });
    }
    if (closeContactBtn) closeContactBtn.addEventListener('click', () => contactModal.classList.remove('active'));

    // Global click-to-close
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) adminModal.classList.remove('active');
        if (e.target === contactModal) contactModal.classList.remove('active');
    });

    if (adminModal) {
        setupAddCategoryForm();
        setupAddSubcategoryForm();
        setupAddProductForm();
        setupLeadershipUploads();
    }
}

function populateAdminDropdowns() {
    const parentCatSelect = document.getElementById('sub_parent');
    const productCatSelect = document.getElementById('p_category');
    const productSubSelect = document.getElementById('p_subcategory');

    let catOptions = '<option value="" disabled selected>Select Category</option>';
    categories.forEach(cat => { catOptions += `<option value="${cat.id}">${cat.name}</option>`; });

    parentCatSelect.innerHTML = catOptions;
    productCatSelect.innerHTML = catOptions;
    productSubSelect.innerHTML = '<option value="" disabled selected>Select Collection First</option>';

    productCatSelect.addEventListener('change', () => {
        const catId = productCatSelect.value;
        const relevantSubs = subcategories.filter(s => s.parentId === catId);
        if (relevantSubs.length === 0) productSubSelect.innerHTML = '<option value="" disabled selected>No Collections Yet</option>';
        else {
            let subOptions = '';
            relevantSubs.forEach(sub => { subOptions += `<option value="${sub.id}">${sub.name}</option>`; });
            productSubSelect.innerHTML = subOptions;
        }
    });
}

function setupAddCategoryForm() {
    document.getElementById('addCategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('cat_image');
        let imageBase64 = null;

        if (fileInput.files.length > 0) {
            try { imageBase64 = await fileToBase64(fileInput.files[0], 800); }
            catch (err) { alert("Failed to process image."); return; }
        }

        const name = document.getElementById('cat_name').value;
        categories.push({
            id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name: name,
            color: document.getElementById('cat_color').value,
            icon: document.getElementById('cat_icon').value || 'fa-couch',
            image: imageBase64
        });

        saveToFirebase();
        renderDynamicUI();
        e.target.reset();
        alert('Category Installed!');
    });
}

function setupAddSubcategoryForm() {
    document.getElementById('addSubcategoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('sub_image');

        if (fileInput.files.length === 0) { alert("Please upload an image for the collection."); return; }

        const imageBase64 = await fileToBase64(fileInput.files[0], 600); // compress sub items more
        const parentId = document.getElementById('sub_parent').value;
        const name = document.getElementById('sub_name').value;

        subcategories.push({
            id: parentId + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            parentId,
            name,
            image: imageBase64
        });

        saveToFirebase();
        document.querySelector('.cat-pill[data-filter="' + parentId + '"]')?.click();
        e.target.reset();
        alert('Collection Established with Uploaded Image!');
    });
}

function setupAddProductForm() {
    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('p_image');

        try {
            let imageBase64 = null;
            if (fileInput.files.length > 0) {
                imageBase64 = await fileToBase64(fileInput.files[0], 800);
            }

            const parentId = document.getElementById('p_category').value;
            const subId = document.getElementById('p_subcategory').value;
            const name = document.getElementById('p_name').value;
            const price = document.getElementById('p_price').value;
            const editId = e.target.dataset.editId;

            if (editId) {
                const prodIndex = products.findIndex(p => p.id === parseInt(editId));
                if (prodIndex > -1) {
                    products[prodIndex].name = name;
                    products[prodIndex].category = parentId;
                    products[prodIndex].subcategory = subId;
                    products[prodIndex].price = price;
                    if (imageBase64) products[prodIndex].image = imageBase64;
                }
                delete e.target.dataset.editId;
                e.target.querySelector('button[type="submit"]').textContent = "Publish Product";
                fileInput.setAttribute('required', 'true');
                alert("Product Updated Successfully!");
            } else {
                if (fileInput.files.length === 0) { alert("Please upload a product image."); return; }
                products.unshift({
                    id: Date.now(),
                    name: name,
                    category: parentId,
                    subcategory: subId,
                    price: price,
                    image: imageBase64
                });
                alert("Product Uploaded Successfully!");
            }

            saveToFirebase();
            renderProducts(currentMainFilter, currentSubFilter);
            document.querySelector('.cat-pill[data-filter="' + parentId + '"]')?.click();

            e.target.reset();
            document.getElementById('adminModal').classList.remove('active');

        } catch (error) {
            alert("Error converting image. It might be too large.");
        }
    });
}

window.deleteProduct = function (productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        products = products.filter(p => p.id !== productId);
        saveToFirebase();
        renderProducts(currentMainFilter, currentSubFilter);
    }
};

window.editProduct = function (productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        populateAdminDropdowns();
        adminModal.classList.add('active');

        document.querySelector('.admin-tab-btn[data-target="tab-product"]').click();

        document.getElementById('p_category').value = product.category;
        const event = new Event('change');
        document.getElementById('p_category').dispatchEvent(event);

        setTimeout(() => {
            document.getElementById('p_subcategory').value = product.subcategory;
        }, 50);

        document.getElementById('p_name').value = product.name;
        document.getElementById('p_price').value = product.price;

        const form = document.getElementById('addProductForm');
        form.dataset.editId = productId;
        form.querySelector('button[type="submit"]').textContent = "Update Product";
        document.getElementById('p_image').removeAttribute('required');
    }
};

// -----------------------------------------
// FAQ ACCORDION LOGIC
// -----------------------------------------
function setupFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other FAQs
            faqItems.forEach(el => {
                el.classList.remove('active');
                if (el.querySelector('.faq-answer')) {
                    el.querySelector('.faq-answer').style.maxHeight = null;
                }
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            }
        });
    });
}

// EXPORT TO DATA.JS FEATURE
function setupExportFeature() {
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let content = "// Auto-generated Data File for Sapna Furniture\n// Do not edit this file manually if you use the Admin Panel.\n\n";
            content += `const defaultCategories = ${JSON.stringify(categories, null, 4)};\n\n`;
            content += `const defaultSubcategories = ${JSON.stringify(subcategories, null, 4)};\n\n`;
            content += `const defaultProducts = ${JSON.stringify(products, null, 4)};\n`;

            const savedCeoImg = localStorage.getItem('sapna_ceo_img');
            const savedOwnerImg = localStorage.getItem('sapna_owner_img');

            content += `\nconst savedCeoImgData = ${savedCeoImg ? JSON.stringify(savedCeoImg) : 'null'};\n`;
            content += `const savedOwnerImgData = ${savedOwnerImg ? JSON.stringify(savedOwnerImg) : 'null'};\n`;

            const blob = new Blob([content], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// FAQ Logic
function setupFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other FAQs
            faqItems.forEach(el => {
                el.classList.remove('active');
                el.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.querySelector('.faq-answer');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    setupExportFeature();
});

// -----------------------------------------
// LEADERSHIP IMAGE EDITING LOGIC
// -----------------------------------------
function updateLeadershipImagesDOM() {
    const ceoImg = window.savedCeoImgFirebase || localStorage.getItem('sapna_ceo_img') || (typeof savedCeoImgData !== 'undefined' ? savedCeoImgData : null);
    const ownerImg = window.savedOwnerImgFirebase || localStorage.getItem('sapna_owner_img') || (typeof savedOwnerImgData !== 'undefined' ? savedOwnerImgData : null);

    if (ceoImg) {
        const ceoAdmin = document.getElementById('ceo_image_admin');
        const ceoPublic = document.getElementById('ceo_image_public');
        if (ceoAdmin) ceoAdmin.src = ceoImg;
        if (ceoPublic) ceoPublic.src = ceoImg;
    }

    if (ownerImg) {
        const ownerAdmin = document.getElementById('owner_image_admin');
        const ownerPublic = document.getElementById('owner_image_public');
        if (ownerAdmin) ownerAdmin.src = ownerImg;
        if (ownerPublic) ownerPublic.src = ownerImg;
    }
}

function loadLeadershipImages() {
    updateLeadershipImagesDOM();
}

function setupLeadershipUploads() {
    const ceoUpload = document.getElementById('ceoImageUpload');
    const ownerUpload = document.getElementById('ownerImageUpload');

    if (ceoUpload) {
        ceoUpload.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                try {
                    const base64 = await fileToBase64(e.target.files[0], 800);
                    if (typeof db !== 'undefined') db.ref('sapna_data').update({ ceo_img: base64 });
                    else localStorage.setItem('sapna_ceo_img', base64);
                    alert("CEO Photo updated successfully!");
                } catch (err) {
                    alert("Failed to process image.");
                }
            }
        });
    }

    if (ownerUpload) {
        ownerUpload.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                try {
                    const base64 = await fileToBase64(e.target.files[0], 800);
                    if (typeof db !== 'undefined') db.ref('sapna_data').update({ owner_img: base64 });
                    else localStorage.setItem('sapna_owner_img', base64);
                    alert("Owner Photo updated successfully!");
                } catch (err) {
                    alert("Failed to process image.");
                }
            }
        });
    }
}

// -----------------------------------------
// AUTHENTICATION LOGIC
// -----------------------------------------
let currentUser = null;

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.auth-tab-content').forEach(c => c.style.display = 'none');

    event.target.classList.add('active');
    const targetForm = tab === 'login' ? document.getElementById('loginForm') : document.getElementById('signupForm');
    targetForm.style.display = 'block';
    setTimeout(() => targetForm.classList.add('active'), 10);
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if (!email || !pass) {
        alert("Please enter email and password.");
        return;
    }
    currentUser = { email: email, name: email.split('@')[0] };
    document.getElementById('openAuthBtn').innerHTML = `<i class="fa-solid fa-user-check"></i> Hi, ${currentUser.name}`;
    document.getElementById('authModal').classList.remove('active');
    alert("Logged in successfully!");
}

function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const pass = document.getElementById('signupPass').value;
    if (!name || !email || !pass) {
        alert("Please fill all fields.");
        return;
    }
    currentUser = { email: email, name: name };
    document.getElementById('openAuthBtn').innerHTML = `<i class="fa-solid fa-user-check"></i> Hi, ${currentUser.name}`;
    document.getElementById('authModal').classList.remove('active');
    alert("Account created successfully!");
}

// -----------------------------------------
// CART & CHECKOUT LOGIC
// -----------------------------------------
let cart = [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();

    // Quick feedback animation
    const badge = document.getElementById('cartCountBadge');
    if (badge) {
        gsap.fromTo(badge, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(productId);
        else updateCartUI();
    }
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.textContent = count;

    const container = document.getElementById('cartItemsContainer');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">Your cart is currently empty.</div>';
        document.getElementById('cartTotalDisplay').textContent = 'Rs 0';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        total += numericPrice * item.qty;

        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price}</div>
                    <div class="cart-item-actions">
                        <div>
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
                            <span style="display:inline-block; width:20px; text-align:center;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-btn custom-hover" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('cartTotalDisplay').textContent = `Rs ${total.toLocaleString()}`;
}

function getOrderText() {
    let text = "🛍️ *NEW SAPNA FURNITURE ORDER*\n\n";
    text += "*Items:*\n";
    let total = 0;

    cart.forEach(item => {
        const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        total += numericPrice * item.qty;
        text += `- ${item.name} (x${item.qty}) - ${item.price}\n`;
    });

    text += `\n*Total Output:* Rs ${total.toLocaleString()}\n\n`;

    const name = document.getElementById('checkoutName').value || 'N/A';
    const phone = document.getElementById('checkoutPhone').value || 'N/A';
    const address = document.getElementById('checkoutAddress').value || 'N/A';

    const paymentMethod = document.querySelector('input[name="paymethod"]:checked')?.value || 'N/A';

    text += "*Customer Details:*\n";
    text += `Name: ${name}\n`;
    text += `Phone: ${phone}\n`;
    text += `Address: ${address}\n\n`;
    text += `*Payment Method:* ${paymentMethod}\n`;

    return text;
}

function placeOrder(method) {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;

    if (!name || !phone || !address) {
        alert("Please fill all delivery information.");
        return;
    }

    const orderText = getOrderText();

    if (method === 'whatsapp') {
        const waLink = `https://wa.me/923136791333?text=${encodeURIComponent(orderText)}`;
        window.open(waLink, '_blank');
    } else if (method === 'email') {
        const subject = encodeURIComponent("New Sapna Furniture Order");
        const mailtoLink = `mailto:sapnafurniture@example.com?subject=${subject}&body=${encodeURIComponent(orderText)}`;
        window.location.href = mailtoLink;
    }

    // Clear cart after order init
    cart = [];
    updateCartUI();
    document.getElementById('checkoutModal').classList.remove('active');
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('show');
}

// -----------------------------------------
// EVENT LISTENERS FOR NEW MODALS
// -----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('authModal');
    const openAuthBtn = document.getElementById('openAuthBtn');
    const closeAuthBtn = document.getElementById('closeAuthBtn');

    if (openAuthBtn) openAuthBtn.addEventListener('click', (e) => { e.preventDefault(); authModal.classList.add('active'); });
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => authModal.classList.remove('active'));

    const cartSidebar = document.getElementById('cartSidebar');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');

    const openCart = (e) => {
        if (e) e.preventDefault();
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('show');
    };

    const closeCart = () => {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('show');
    };

    if (openCartBtn) openCartBtn.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    const checkoutModal = document.getElementById('checkoutModal');
    const openCheckoutBtn = document.getElementById('openCheckoutBtn');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');

    if (openCheckoutBtn) openCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }
        closeCart();
        checkoutModal.classList.add('active');
    });

    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => checkoutModal.classList.remove('active'));

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});

