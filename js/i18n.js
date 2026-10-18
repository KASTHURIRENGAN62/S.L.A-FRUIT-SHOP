/* ============ S.L.A FRUIT SHOP - INTERNATIONALIZATION (i18n) ============ */
window.I18N = (function () {
    const LANGUAGES = {
        en: { label: 'English', flag: '🇬🇧', dir: 'ltr' },
        ta: { label: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
        hi: { label: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
        ar: { label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
        kn: { label: 'ಕನ್ನಡ', flag: '🇮🇳', dir: 'ltr' },
        te: { label: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' }
    };

    const DATA = {
        en: {
            ui: {
                'nav.home': 'Home',
                'nav.services': 'Services',
                'nav.indian': 'Indian Fruits',
                'nav.imported': 'Imported',
                'nav.about': 'About',
                'nav.contact': 'Contact',
                'nav.signin': 'Sign In',
                'nav.callnow': 'Call Now',
                'mobile.call': 'Call: 9715840263',

                'hero.badge': 'Wholesale & Retail | Door Delivery Available',
                'hero.tag': 'Fresh From Farm To Your Home',
                'hero.welcome': 'Welcome to',
                'hero.feat.delivery': 'Free Delivery within 3km',
                'hero.feat.wholesale': 'Wholesale & Retail',
                'hero.feat.quality': 'Premium Quality',
                'hero.explore': 'Explore Fruits',
                'hero.scroll': 'Scroll Down',
                'hero.card.mango': 'Fresh Mangoes',
                'hero.card.apple': 'Imported Apples',
                'hero.card.grapes': 'Premium Grapes',
                'hero.card.banana': 'Banana',
                'hero.card.pineapple': 'Pineapple',
                'hero.card.avocado': 'Avocado',
                'hero.card.orange': 'Orange',
                'hero.typewriter': [
                    'Premium collection of 27+ Indian & imported fruits',
                    'Fresh mangoes from Maharashtra\'s Alphonso orchards',
                    'Juicy pomegranates from Andhra Pradesh',
                    'Sweet lychees from Bihar & West Bengal',
                    'Farm-fresh delivery to your doorstep 🚚'
                ],

                'services.tag': 'What We Offer',
                'services.title': 'Our <span class="gradient-text">Services</span>',
                'services.sub': 'Quality fruits with exceptional service',
                'services.ws': 'Wholesale',
                'services.ws.sub': 'Bulk fruit orders at best wholesale prices for shops, restaurants, and events.',
                'services.ws.badge': 'Best Prices',
                'services.retail': 'Retail',
                'services.retail.sub': 'Fresh individual fruits for your daily needs. Quality guaranteed in every piece.',
                'services.retail.badge': 'Fresh Daily',
                'services.delivery': 'Door Delivery',
                'services.delivery.sub': 'Free delivery within 3km radius. Fresh fruits delivered to your doorstep.',
                'services.delivery.badge': 'FREE',
                'services.imported': 'Imported Fruits',
                'services.imported.sub': 'Premium imported fruits from 15+ countries. Exotic taste guaranteed.',
                'services.imported.badge': 'Premium',

                'trust.fresh': '100% Fresh',
                'trust.fresh.label': 'Handpicked daily from farms',
                'trust.quality': 'Premium Quality',
                'trust.quality.label': '27+ varieties, best in class',
                'trust.delivery': 'Free Delivery',
                'trust.delivery.label': 'Within 3km of Kattumavadi',

                'cat.tag': 'Browse Categories',
                'cat.title': 'Shop by <span class="gradient-text">Category</span>',
                'cat.sub': 'Explore our curated fruit collections',
                'cat.indian': 'Indian Fruits',
                'cat.indian.sub': '18 varieties from local orchards',
                'cat.imported': 'Imported Fruits',
                'cat.imported.sub': 'Premium from 15+ countries',
                'cat.seasonal': 'Seasonal Specials',
                'cat.seasonal.sub': 'Peak season fresh picks',
                'cat.wholesale': 'Wholesale',
                'cat.wholesale.sub': 'Bulk orders at best prices',
                'cat.explore': 'Explore →',
                'cat.enquire': 'Enquire →',

                'bestseller.tag': 'Customer Favourites',
                'bestseller.title': '⭐ Bestseller <span class="gradient-text">Fruits</span>',
                'bestseller.sub': 'Our top-rated picks everyone loves — handpicked and in high demand',
                'bestseller.badge': 'Bestseller',

                'indian.tag': 'Local Collection',
                'indian.title': '🍎 Indian <span class="gradient-text">Fruits</span>',
                'indian.sub': 'Fresh from local orchards across India — 18 varieties from farm to table',

                'foreign.tag': 'Global Collection',
                'foreign.title': '🍊 Imported <span class="gradient-text">Fruits</span>',
                'foreign.sub': 'Premium international selection from 15+ countries — exotic flavors from around the world',

                'filter.all': 'All',
                'filter.summer': '☀️ Summer',
                'filter.winter': '❄️ Winter',
                'filter.allyear': '📅 All Year',
                'filter.north': '🧭 North',
                'filter.south': '🧭 South',
                'filter.west': '🧭 West',
                'filter.east': '🧭 East',
                'filter.europe': '🇪🇺 Europe',
                'filter.americas': '🌎 Americas',
                'filter.asia': '🌏 Asia',
                'filter.africa': '🌍 Africa',

                'health.tag': 'Ayurvedic Wisdom',
                'health.title': '🌿 Health <span class="gradient-text">Benefits</span>',
                'health.sub': "Indian fruits are nature's medicine — discover what each fruit offers",
                'health.all': 'All Benefits',
                'health.immunity': '🛡️ Immunity',
                'health.digestive': '🌱 Digestion',
                'health.heart': '❤️ Heart',
                'health.skin': '✨ Skin',
                'health.card.sub': 'Discover the remarkable health benefits of this traditional Indian fruit.',

                'cta.tag': '🚀 Wholesale & Bulk',
                'cta.title': 'Need <span class="gradient-text">Bulk Supply?</span>',
                'cta.sub': 'Best wholesale prices for shops, restaurants, hotels, and events. Fresh stock delivered to your doorstep.',
                'cta.check1': '✓ Best Wholesale Prices',
                'cta.check2': '✓ Daily Fresh Stock',
                'cta.check3': '✓ Free Door Delivery',
                'cta.or': 'or',

                'seasonal.tag': 'When to Buy',
                'seasonal.title': '📅 Seasonal <span class="gradient-text">Calendar</span>',
                'seasonal.sub': 'Know which Indian fruits are at their peak each month',
                'seasonal.peak': 'Peak Season',
                'seasonal.available': 'Available',
                'seasonal.off': 'Off Season',
                'seasonal.tip': 'Pro Tip',
                'seasonal.tip.sub': 'Eating seasonal fruits gives you the best flavor, maximum nutrition, and lowest prices. Support local farmers!',
                'calendar.fruits': 'Fruits',

                'about.tag': 'About Us',
                'about.title': 'Fresh Fruits, <span class="gradient-text">Trusted Quality</span>',
                'about.p1': 'S.L.A Fruit Shop is your trusted neighborhood fruit shop on ECR Road, Kattumavadi. We specialize in providing the freshest Indian and imported fruits at competitive prices for both wholesale and retail customers.',
                'about.p2': 'With door delivery available within 3km, getting fresh fruits has never been easier. Visit us or call to place your order today!',
                'about.feat1': 'Wholesale & Retail',
                'about.feat1.sub': 'Best prices for bulk and individual orders',
                'about.feat2': 'Door Delivery',
                'about.feat2.sub': 'Free delivery within 3km of Kattumavadi',
                'about.feat3': '27+ Varieties',
                'about.feat3.sub': 'Indian & imported fruits from 15+ countries',
                'stat.varieties': 'Fruit Varieties',
                'stat.countries': 'Countries',
                'stat.delivery': 'km Free Delivery',

                'testi.tag': 'Testimonials',
                'testi.title': 'What Our <span class="gradient-text">Customers</span> Say',
                'testi.q1': '"Best fruit shop in Kattumavadi! Always fresh and the door delivery is so convenient."',
                'testi.q2': '"Great wholesale prices. I regularly buy for my restaurant. Quality is always top notch."',
                'testi.q3': '"Love the imported fruits collection. Kiwi and dragon fruit are always fresh here!"',
                'testi.role1': 'Regular Customer',
                'testi.role2': 'Restaurant Owner',
                'testi.role3': 'Fruit Enthusiast',

                'contact.tag': 'Get In Touch',
                'contact.title': 'Visit Us or <span class="gradient-text">Call Now</span>',
                'contact.address': 'Address',
                'contact.owner': 'Owner',
                'contact.phones': 'Phone Numbers',
                'contact.hours': 'Business Hours',
                'contact.delivery': 'Door Delivery',
                'contact.form.title': 'Send Us a Message',
                'contact.form.sub': "We'll get back to you soon",
                'contact.form.name': 'Your Name',
                'contact.form.phone': 'Phone Number',
                'contact.form.address': 'Feedback(optional)',
                'contact.form.service': 'Select Service',
                'contact.form.svc.retail': 'Retail Purchase',
                'contact.form.svc.wholesale': 'Wholesale Order',
                'contact.form.svc.delivery': 'Door Delivery',
                'contact.form.svc.other': 'Other Inquiry',
                'contact.form.message': 'Your Message',
                'contact.form.send': 'Send Message',
                'contact.map.title': 'Find Us on <span class="gradient-text">Google Maps</span>',
                'contact.map.sub': 'Click the map to open our shop location in Google Maps',
                'contact.map.open': 'Open in Google Maps',

                'footer.desc': 'Your trusted partner for fresh Indian & imported fruits. Wholesale, retail, and door delivery in Kattumavadi.',
                'footer.quick': 'Quick Links',
                'footer.services': 'Services',
                'footer.find': 'Find Us',
                'footer.link.home': 'Home',
                'footer.link.services': 'Services',
                'footer.link.indian': 'Indian Fruits',
                'footer.link.imported': 'Imported Fruits',
                'footer.link.about': 'About Us',
                'footer.link.wholesale': 'Wholesale Supply',
                'footer.link.retail': 'Retail Purchase',
                'footer.link.delivery': 'Door Delivery',
                'footer.link.bulk': 'Bulk Orders',
                'footer.map': 'Open in Google Maps →',

                'cart.title': 'Your Cart',
                'cart.empty': 'Your cart is empty',
                'cart.empty.sub': 'Add some fruits to get started!',
                'cart.total': 'Total',
                'cart.checkout': 'Checkout',
                'cart.call': 'Call to Order Instead',

                'checkout.title': 'Checkout',
                'checkout.sub': 'Confirm your delivery details and payment method',
                'checkout.name': 'Full Name',
                'checkout.phone': 'Phone Number',
                'checkout.email': 'Email (optional)',
                'checkout.address': 'Delivery Address',
                'checkout.method': 'Payment Method',
                'checkout.upi': 'UPI',
                'checkout.netbanking': 'Net Banking',
                'checkout.cod': 'Cash on Delivery',
                'checkout.upi.text': 'Scan our QR code with any UPI app to finish payment',
                'checkout.upi.pay': 'Pay Now',
                'checkout.upi.hint': 'After payment, your order is placed automatically',
                'checkout.bank': 'Select your bank',
                'checkout.bank.choose': 'Choose a bank…',
                'checkout.nb.hint': "You'll be redirected to your bank's secure net banking page to complete payment.",
                'checkout.nb.redirect': 'Redirecting to <span id="nb-bank-name">your bank</span>',
                'checkout.nb.connecting': "Connecting to your bank's secure net banking portal…",
                'checkout.nb.never': 'Never share your login password or OTP with anyone.',
                'checkout.nb.title': 'Net Banking',
                'checkout.nb.login': 'Secure net banking login',
                'checkout.nb.user': 'User ID / Login ID',
                'checkout.nb.pass': 'Login Password',
                'checkout.nb.otp': 'OTP / MPIN',
                'checkout.nb.amount': 'Amount to pay',
                'checkout.nb.loginpay': 'Login & Pay',
                'checkout.nb.processing': 'Processing payment…',
                'checkout.nb.confirming': 'Confirming your payment with <span id="nb-bank-name2">your bank</span>…',
                'checkout.place': 'Place Order',
                'checkout.success': 'Order Placed!',
                'checkout.success.sub': 'Thank you for your order.',
                'receipt.download': 'Download PDF Slip',
                'receipt.print': 'Print Slip',
                'receipt.done': 'Done',

                'modal.cat.indian': 'Indian Fruit',
                'modal.cat.imported': 'Imported Fruit',
                'modal.price': 'Price',
                'modal.origin': 'Origin',
                'modal.season': 'Season',
                'modal.nutrition': 'Nutrition (per 100g)',
                'modal.call': 'Call to Order',
                'nutri.calories': 'Calories',
                'nutri.vitc': 'Vitamin C',
                'nutri.vita': 'Vitamin A',
                'nutri.fiber': 'Fiber',
                'card.view': 'View',
                'card.add': 'Add',
                'card.added': 'Added',
                'card.indian': 'Indian',
                'card.imported': 'Imported',

                'auth.welcome': 'Welcome Back',
                'auth.signin.sub': 'Sign in to your account',
                'auth.email': 'Email',
                'auth.password': 'Password',
                'auth.forgot': 'Forgot password?',
                'auth.signin': 'Sign In',
                'auth.checkout.required': 'Please sign in to place your order.',
                'auth.or': 'or continue with',
                'auth.create': 'Create Account',
                'auth.join': 'Join S.L.A Fruit Shop',
                'auth.fullname': 'Full Name',
                'auth.phone': 'Phone (optional)',
                'auth.signup': 'Sign Up',
                'auth.orsignup': 'or sign up with',
                'auth.reset': 'Reset Password',
                'auth.reset.sub': "Enter your account email and we'll send you a reset link",
                'auth.sendreset': 'Send Reset Link',
                'auth.signout': 'Sign Out',
                'auth.back': '← Back to Sign In'
            },
            desc: {
                'Mango': 'King of fruits — Alphonso, Dasheri, Kesar varieties. Rich in Vitamin A, C, and beta-carotene. Sweet, creamy, and irresistibly aromatic — the pride of Indian summers.',
                'Banana': 'Cavendish and Robusta varieties. Instant energy booster with potassium and Vitamin B6. Nature\'s perfect pre-workout snack in its own biodegradable wrapper.',
                'Guava': 'Fresh pink and white guava. Packed with 4x Vitamin C of oranges! Sweet fragrant flesh with edible seeds — a true tropical superfruit.',
                'Papaya': 'Sweet ripe papaya with digestive enzyme papain. Rich in antioxidants and beta-carotene. The golden fruit for a happy gut and glowing skin.',
                'Pomegranate': 'Juicy Anar with ruby-red arils bursting with sweetness. Loaded with antioxidants, iron, and punicalagins — the heart-healthy superfruit from Indian groves.',
                'Watermelon': 'Refreshing summer fruit with 92% water content. Rich in lycopene and electrolytes. Nature\'s thirst-quencher on hot Indian afternoons.',
                'Coconut': 'Fresh green coconut with sweet electrolyte-rich water and tender kernel. Ayurvedic superfood revered for cooling and nourishing properties.',
                'Jackfruit': 'World\'s largest tree fruit weighing up to 35kg. Versatile — golden sweet when ripe, savory meat substitute when green. A Kerala treasure.',
                'Lychee': 'Sweet fragrant fruit with pink-red textured shell and translucent juicy flesh. Grown in Bihar\'s famous Shahi orchards — a fleeting summer delight.',
                'Jamun': 'Indian blackberry with deep purple staining juice. Known for diabetic benefits and astringent properties. Sweet-tart taste of Indian summers.',
                'Amla': 'Indian gooseberry — the highest natural Vitamin C source with 600mg per 100g. Ayurvedic rasayana revered for hair, immunity, and longevity.',
                'Chikoo': 'Sapodilla — sweet grainy brown fruit with caramel-like flavor. Nature\'s sugar bomb packed with natural fructose for instant energy.',
                'Sitaphal': 'Custard apple — creamy sweet flesh with glossy black seeds. Rich in magnesium and Vitamin C. The ice cream fruit that melts in your mouth.',
                'Mosambi': 'Sweet lime — juicy citrus fruit with mild sweetness and zero acidity. Refreshing summer cooler packed with electrolytes and Vitamin C.',
                'Ber': 'Indian jujube — small round fruit with apple-like crunch. Rich in Vitamin C and eaten fresh, dried, or pickled. The hardy fruit of Rajasthan.',
                'Bael': 'Wood apple — hard shell fruit with aromatic brown pulp. Sacred in Hinduism and a powerful digestive tonic. The ultimate gut-healing fruit.',
                'Kamrakh': 'Star fruit — distinctive star-shaped slices with tangy refreshing flavor. Low calorie and packed with Vitamin C. Beautiful tropical decoration.',
                'Kokum': 'Deep purple fruit from the Konkan coast used in traditional Goan cuisine. Makes the refreshing sol kadhi — a digestive and cooling summer drink.',
                'Apple': 'Washington Red Delicious — crisp, sweet, and juicy. Rich in dietary fiber and polyphenol antioxidants. Perfect for healthy snacking and baking.',
                'Orange': 'Valencia and Navel varieties from Egyptian orchards. Bursting with Vitamin C, juicy citrus perfection. Ideal for fresh juice and salads.',
                'Grapes': 'Thompson Seedless and Red Globe from Iranian vineyards. Sweet, juicy, and antioxidant-rich. Resveratrol powerhouse for heart health.',
                'Kiwi': 'New Zealand Zespri green kiwifruit — tangy-sweet with edible black seeds. Packed with more Vitamin C than an orange. Natural digestive aid with actinidin enzyme.',
                'Dragon Fruit': 'Exotic pink pitaya from Vietnam with white or red flesh and tiny black seeds. Mildly sweet with a refreshing crunch. Rich in prebiotic fiber for gut health.',
                'Avocado': 'Hass variety from Mexican orchards — creamy, nutrient-dense superfood. Loaded with healthy monounsaturated fats, potassium, and folate. Perfect for toast, salads, and smoothies.',
                'Blueberry': 'Wild and cultivated Chilean blueberries. Tiny but packed with anthocyanins — nature\'s most powerful antioxidants. Sweet-tart flavor perfect for breakfast bowls.',
                'Strawberry': 'Fresh California berries — sweet aromatic and heart-shaped. Sun-ripened perfection rich in Vitamin C, manganese, and ellagic acid. Nature\'s candy with zero guilt.',
                'Cherry': 'Premium Bing cherries from Turkish orchards — deep red, sweet, and antioxidant-rich. Natural melatonin source for better sleep. Anti-inflammatory powerhouse.',
                'Pineapple': 'Sweet Golden variety from Costa Rica. Tropical tangy sweetness with bromelain enzyme that aids digestion. Exceptionally rich in manganese and Vitamin C.',
                'Fig': 'Black Mission figs from Turkish groves. Chewy, sweet, and fiber-rich. Nature\'s candy with impressive calcium, potassium, and prebiotic content.',
                'Passion Fruit': 'Purple granadilla from Peruvian highlands — aromatic tangy pulp with crunchy edible seeds. Exotic tropical flavor bursting with Vitamin A, C, and dietary fiber.',
                'Persimmon': 'Fuyu variety from Japanese orchards — sweet, firm, and apple-like texture. Rich in beta-carotene and Vitamin A. Enjoy fresh or dried for concentrated sweetness.',
                'Mangosteen': 'Queen of fruits from Thai orchards — delicate white segmented flesh protected by a deep purple rind. Exquisitely sweet-tangy flavor with powerful xanthone antioxidants.'
            },
            benefits: {
                'Boosts immunity': 'Boosts immunity',
                'Improves digestion': 'Improves digestion',
                'Good for eyesight': 'Good for eyesight',
                'Skin glow': 'Skin glow',
                'Energy booster': 'Energy booster',
                'Heart health': 'Heart health',
                'Muscle recovery': 'Muscle recovery',
                'Bone strength': 'Bone strength',
                'Strong immunity': 'Strong immunity',
                'Skin health': 'Skin health',
                'Digestive aid': 'Digestive aid',
                'Blood pressure': 'Blood pressure',
                'Aids digestion': 'Aids digestion',
                'Anti-inflammatory': 'Anti-inflammatory',
                'Immunity boost': 'Immunity boost',
                'Blood purifier': 'Blood purifier',
                'Anti-aging': 'Anti-aging',
                'Memory boost': 'Memory boost',
                'Hydration': 'Hydration',
                'Skin protection': 'Skin protection',
                'Electrolyte balance': 'Electrolyte balance',
                'Skin nourishment': 'Skin nourishment',
                'Thyroid health': 'Thyroid health',
                'Energy boost': 'Energy boost',
                'Bone health': 'Bone health',
                'Digestive health': 'Digestive health',
                'Thyroid support': 'Thyroid support',
                'Blood circulation': 'Blood circulation',
                'Anti-oxidant': 'Anti-oxidant',
                'Weight management': 'Weight management',
                'Diabetes control': 'Diabetes control',
                'Oral health': 'Oral health',
                'Iron rich': 'Iron rich',
                'Immunity booster': 'Immunity booster',
                'Hair growth': 'Hair growth',
                'Eye health': 'Eye health',
                'Energy source': 'Energy source',
                'Brain health': 'Brain health',
                'Anti-cancer': 'Anti-cancer',
                'Blood purification': 'Blood purification',
                'Sleep aid': 'Sleep aid',
                'Gut health': 'Gut health',
                'Respiratory aid': 'Respiratory aid',
                'Weight loss': 'Weight loss',
                'Antioxidant': 'Antioxidant',
                'Liver health': 'Liver health',
                'Brain function': 'Brain function',
                'Collagen production': 'Collagen production',
                'Blood pressure control': 'Blood pressure control',
                'Respiratory health': 'Respiratory health',
                'Blood sugar': 'Blood sugar',
                'Joint health': 'Joint health',
                'Exercise recovery': 'Exercise recovery',
                'Iron absorption': 'Iron absorption',
                'Antioxidant rich': 'Antioxidant rich',
                'Immune support': 'Immune support'
            },
            health: {
                'Mango': ['Boosts immunity with beta-carotene', 'Improves digestion with enzymes', 'Enhances skin glow', 'Good for eyesight'],
                'Amla': ['Highest natural Vitamin C source', 'Strengthens hair and nails', 'Anti-aging powerhouse', 'Boosts overall immunity'],
                'Pomegranate': ['Blood purifier and iron-rich', 'Heart health booster', 'Anti-cancer properties', 'Improves memory'],
                'Banana': ['Instant energy booster', 'Rich in potassium for heart', 'Muscle recovery aid', 'Natural antacid'],
                'Guava': ['4x Vitamin C of oranges', 'Improves skin texture', 'Aids weight loss', 'Controls blood pressure'],
                'Papaya': ['Digestive enzyme papain', 'Anti-inflammatory', 'Rich in antioxidants', 'Good for menstrual health'],
                'Jackfruit': ['Plant-based protein source', 'Rich in B-vitamins', 'Good for bones', 'Boosts energy'],
                'Jamun': ['Controls blood sugar', 'Improves oral health', 'Rich in iron', 'Good for digestion'],
                'Sitaphal': ['Brain development aid', 'Rich in magnesium', 'Good for eye health', 'Anti-cancer properties'],
                'Watermelon': ['Natural hydration (92% water)', 'Lycopene for heart health', 'Skin protection', 'Muscle soreness relief']
            },
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },
        ta: {}, hi: {}, ar: {}, kn: {}, te: {}
    };

    // Language files (js/lang/<code>.js) merge their content into DATA.
    // Called here and again in init() so it works regardless of script order.
    function mergeLangData() {
        if (!window.LANG_DATA) return;
        Object.keys(window.LANG_DATA).forEach(code => {
            DATA[code] = Object.assign({}, window.LANG_DATA[code]);
        });
    }
    mergeLangData();

    let currentLang = 'en';
    try {
        const saved = localStorage.getItem('fruit_shop_lang');
        if (saved && LANGUAGES[saved]) currentLang = saved;
    } catch (e) {}

    const listeners = [];

    function lang() { return currentLang; }
    function dir() { return (LANGUAGES[currentLang] || LANGUAGES.en).dir; }
    function langLabel(code) { const l = LANGUAGES[code]; return l ? l.label : code; }

    function t(key) {
        const ui = (DATA[currentLang] && DATA[currentLang].ui) || {};
        if (ui[key] !== undefined) return ui[key];
        if (DATA.en.ui[key] !== undefined) return DATA.en.ui[key];
        return key;
    }

    function tList(key) {
        const val = t(key);
        return Array.isArray(val) ? val : [];
    }

    function fruitName(name) {
        const f = DATA[currentLang] && DATA[currentLang].fruits;
        return f && f[name] ? f[name] : name;
    }

    function fruitDesc(name) {
        const d = DATA[currentLang] && DATA[currentLang].desc;
        if (d && d[name]) return d[name];
        return DATA.en.desc[name] || '';
    }

    function benefit(phrase) {
        const b = DATA[currentLang] && DATA[currentLang].benefits;
        return b && b[phrase] ? b[phrase] : phrase;
    }

    function healthList(name) {
        const h = DATA[currentLang] && DATA[currentLang].health;
        return h && h[name] ? h[name] : null;
    }

    function month(m) {
        const ms = DATA[currentLang] && DATA[currentLang].months;
        return ms && ms[m] ? ms[m] : m;
    }

    function applyStaticTranslations() {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = dir();
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = t(el.getAttribute('data-i18n'));
            if (val !== undefined && val !== null) el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const val = t(el.getAttribute('data-i18n-html'));
            if (val !== undefined && val !== null) el.innerHTML = val;
        });
    }

    function updateSwitcherUI() {
        const btn = document.getElementById('lang-current');
        if (btn) btn.textContent = langLabel(currentLang);
        const btnFull = document.getElementById('lang-btn-label');
        if (btnFull) btnFull.textContent = langLabel(currentLang);
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === currentLang);
        });
    }

    function initSwitcher() {
        const btn = document.getElementById('lang-btn');
        const dropdown = document.getElementById('lang-dropdown');
        const wrapper = document.getElementById('lang-switcher');
        if (!btn || !dropdown) return;

        dropdown.innerHTML = Object.keys(LANGUAGES).map(code => {
            const l = LANGUAGES[code];
            return `<button type="button" class="lang-option${code === currentLang ? ' active' : ''}" data-lang="${code}"><span class="lang-flag">${l.flag}</span> ${l.label}</button>`;
        }).join('');

        const toggleOpen = (force) => {
            const on = force === undefined ? !(wrapper ? wrapper.classList.contains('open') : dropdown.classList.contains('open')) : force;
            if (wrapper) wrapper.classList.toggle('open', on);
            dropdown.classList.toggle('open', on);
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleOpen();
        });

        dropdown.addEventListener('click', (e) => {
            const opt = e.target.closest('.lang-option');
            if (!opt) return;
            setLang(opt.dataset.lang);
            toggleOpen(false);
        });

        document.addEventListener('click', () => toggleOpen(false));

        if (wrapper) {
            wrapper.querySelectorAll('.lang-option').forEach(opt => {
                opt.addEventListener('click', () => wrapper.classList.remove('open'));
            });
        }

        // Mobile quick language buttons
        document.querySelectorAll('[data-mobile-lang]').forEach(btnEl => {
            btnEl.addEventListener('click', () => {
                setLang(btnEl.dataset.mobileLang);
            });
        });

        updateSwitcherUI();
    }

    function setLang(code) {
        if (!LANGUAGES[code]) code = 'en';
        if (code === currentLang) { applyStaticTranslations(); updateSwitcherUI(); return; }
        currentLang = code;
        try { localStorage.setItem('fruit_shop_lang', code); } catch (e) {}
        applyStaticTranslations();
        updateSwitcherUI();
        listeners.forEach(cb => { try { cb(code); } catch (e) {} });
    }

    function onChange(cb) { listeners.push(cb); }

    function init() {
        mergeLangData();
        applyStaticTranslations();
        initSwitcher();
        updateSwitcherUI();
    }

    return {
        LANGUAGES: LANGUAGES,
        lang: lang,
        dir: dir,
        langLabel: langLabel,
        t: t,
        tList: tList,
        fruitName: fruitName,
        fruitDesc: fruitDesc,
        benefit: benefit,
        healthList: healthList,
        month: month,
        setLang: setLang,
        onChange: onChange,
        init: init
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18N.init());
} else {
    I18N.init();
}
