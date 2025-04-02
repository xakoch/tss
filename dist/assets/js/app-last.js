// Ждем загрузку DOM перед инициализацией Barba
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, загружен ли Barba.js
    if (typeof barba !== 'undefined') {
        initPageTransitions();
    } else {
        console.warn('Barba.js не найден');
        // Инициализируем скрипты напрямую, если Barba не доступен
        initScript();
    }
});

// Инициализация Lenis для плавного скролла
let lenis;

function initLenis() {
    try {
        if (typeof Lenis === 'undefined') {
            console.warn('Lenis не найден');
            return;
        }
        
        // Уничтожаем предыдущий экземпляр Lenis, если он существует
        if (lenis) {
            lenis.destroy();
        }
        
        // Создаем новый экземпляр Lenis
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });
        
        // Привязываем Lenis к requestAnimationFrame для обновления
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        
        requestAnimationFrame(raf);
        
        // Обрабатываем якорные ссылки с Lenis
        const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
        
        if (anchorLinks.length > 0) {
            anchorLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        // Скролл к элементу с помощью Lenis
                        lenis.scrollTo(targetElement, {
                            offset: 0,
                            duration: 1.2,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    }
                });
            });
        }
        
        console.log('Lenis initialized successfully');
    } catch (error) {
        console.error('Error in initLenis:', error);
    }
}

function initPageTransitions() {
    try {
        // Scroll to top before transition begins
        barba.hooks.before(() => {
            window.scrollTo({ top: 0 });
        });
        
        barba.init({
            sync: false, // Better to disable sync for proper animations
            debug: false,
            timeout: 7000,
            transitions: [{
                name: 'default',
                once({ next }) {
                    // Initialize on first load
                    updateBodyClass(next.html);
                    initScript();
                    
                    // Анимация появления контента при первой загрузке с GSAP
                    if (typeof gsap !== 'undefined') {
                        gsap.from(next.container, {
                            opacity: 0,
                            duration: 0.5,
                            ease: 'power1.out',
                            clearProps: 'all'
                        });
                    }
                },
                async leave(data) {
                    try {
                        // Content fade-out animation with GSAP
                        if (data && data.current && data.current.container) {
                            initBarbaNavUpdate(data);
                            
                            if (typeof gsap !== 'undefined') {
                                // Возвращаем промис с анимацией GSAP
                                return gsap.to(data.current.container, {
                                    opacity: 0,
                                    duration: 0.5,
                                    ease: 'power1.out',
                                    onComplete: () => {
                                        data.current.container.remove();
                                    }
                                });
                            } else {
                                // Fallback если GSAP не доступен
                                data.current.container.style.opacity = '0';
                                await delay(500);
                                data.current.container.remove();
                            }
                        }
                    } catch (error) {
                        console.error('Error in leave transition:', error);
                    }
                },
                async enter({ next }) {
                    try {
                        // Content fade-in animation with GSAP
                        updateBodyClass(next.html);
                        
                        // Set initial state
                        next.container.style.opacity = '0';
                        
                        if (typeof gsap !== 'undefined') {
                            // Создаем временную шкалу для последовательных анимаций
                            const tl = gsap.timeline();
                            
                            // Анимация основного контейнера
                            tl.to(next.container, {
                                opacity: 1,
                                duration: 0.5,
                                ease: 'power1.out',
                                clearProps: 'opacity'
                            });
                            
                            // Находим и анимируем хедер и заголовок
                            const header = next.container.querySelector('.header');
                            const heroTitle = next.container.querySelector('.hero__title h1');
                            
                            if (header) {
                                tl.to(header, {
                                    opacity: 1, 
                                    y: 0, 
                                    duration: 0.8,
                                    ease: "power2.out"
                                }, "-=0.3"); // Начинаем немного раньше окончания предыдущей анимации
                            }
                            
                            if (heroTitle) {
                                tl.to(heroTitle, {
                                    opacity: 1, 
                                    y: 0, 
                                    duration: 0.8,
                                    ease: "power2.out"
                                }, "-=0.5"); // Начинаем немного раньше окончания предыдущей анимации
                            }
                            
                            // Возвращаем промис окончания всей временной шкалы
                            return tl;
                        } else {
                            // Fallback если GSAP не доступен
                            next.container.style.opacity = '1';
                        }
                    } catch (error) {
                        console.error('Error in enter transition:', error);
                        // Установим непрозрачность напрямую в случае ошибки
                        next.container.style.opacity = '1';
                    }
                },
                async beforeEnter({ next }) {
                    updateBodyClass(next.html);
                    
                    // Подготавливаем элементы для анимации
                    if (typeof gsap !== 'undefined') {
                        const header = next.container.querySelector('.header');
                        const heroTitle = next.container.querySelector('.hero__title h1');
                        
                        // Устанавливаем начальное состояние для анимируемых элементов
                        if (header) {
                            gsap.set(header, { opacity: 0, y: -30 });
                        }
                        
                        if (heroTitle) {
                            gsap.set(heroTitle, { opacity: 0, y: 50 });
                        }
                    }
                    
                    initScript();
                },
            }]
        });
    } catch (error) {
        console.error('Error in initPageTransitions:', error);
        // Инициализируем скрипты напрямую в случае ошибки
        initScript();
    }
}

/**
 * Обновляет класс <body> на основе нового HTML-кода
 */
function updateBodyClass(html) {
    try {
        if (!html) return;
        const matches = html.match(/<body.+?class="([^"]*)"/i);
        document.body.setAttribute('class', matches ? matches[1] : '');
    } catch (error) {
        console.error('Error in updateBodyClass:', error);
    }
}

/**
 * Функция задержки
 */
function delay(n = 2000) {
    return new Promise(done => setTimeout(done, n));
}

/**
 * Запускает все скрипты на новой странице
 */
function initScript() {
    try {
        initLenis();
        initBarbaNavUpdate();
        initWindowInnerheight();
        initSwiperSlider();
        
        // Анимируем стандартные элементы на всех страницах
        animateCommonElements();
        
        // Проверяем, находимся ли мы на домашней странице перед вызовом initHomePage
        if (isHomePage()) {
            initHomePage();
        }
        
        initCalc();
        initRegisterStepForm();

        document.addEventListener('wpcf7mailsent', function(event) {
            setTimeout(function() {
                const responseOutput = document.querySelector('.wpcf7-response-output');
                if (responseOutput) {
                    jQuery(responseOutput).fadeOut();
                    // Alternative without jQuery: responseOutput.style.display = 'none';
                }
            }, 3000); // 3 seconds delay before hiding
        });

    } catch (error) {
        console.error('Error in initScript:', error);
    }
}

/**
 * Анимирует общие элементы всех страниц
 */
function animateCommonElements() {
    try {
        if (typeof gsap === 'undefined') {
            console.warn('GSAP не найден, анимации элементов недоступны');
            return;
        }
        
        // Анимация хедера
        const header = document.querySelector('.header');
        if (header) {
            gsap.fromTo(header, 
                { opacity: 0, y: -30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
            );
        }
        
        // Анимация заголовка (снизу вверх)
        const heroTitle = document.querySelector('.hero__title h1');
        if (heroTitle) {
            gsap.fromTo(heroTitle, 
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" }
            );
        }
        
        // Анимация футера
        const footer = document.querySelector('.footer');
        if (footer) {
            // Первоначально скрываем футер
            gsap.set(footer, { opacity: 0, y: 80 });
            
            // Создаем обсервер для отслеживания видимости футера
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !footer.classList.contains('animated')) {
                        // Анимация появления снизу вверх с небольшой задержкой
                        gsap.to(footer, {
                            opacity: 1, 
                            y: 0, 
                            duration: 0.8, 
                            ease: "power2.out"
                        });
                        
                        // Добавляем класс для предотвращения повторной анимации
                        footer.classList.add('animated');
                        
                        // Отключаем наблюдение после анимации
                        footerObserver.unobserve(footer);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: "0px 0px -10% 0px"
            });
            
            // Начинаем наблюдение за футером
            footerObserver.observe(footer);
        }
    } catch (error) {
        console.error('Error in animateCommonElements:', error);
    }
}

/**
 * Проверяет, является ли текущая страница домашней
 */
function isHomePage() {
    try {
        // Проверка по классу body
        if (document.body.classList.contains('home') || 
            document.body.classList.contains('homepage') || 
            document.body.classList.contains('home-page')) {
            return true;
        }
        
        // Проверка по URL
        const path = window.location.pathname;
        if (path === '/' || 
            path === '/index.html' || 
            path === '/index.php' || 
            path.endsWith('/') || 
            path === '') {
            return true;
        }
        
        // Проверка на наличие элементов, характерных для домашней страницы
        if (document.querySelector('.slider-block') || 
            document.querySelector('.custom-count-number')) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error in isHomePage:', error);
        return false;
    }
}

/**
 * Обновляет атрибуты элементов с data-barba-update
 */
function initBarbaNavUpdate(data) {
    try {
        // Проверяем, что data и data.next существуют и data.next.html определен
        if (!data || !data.next || !data.next.html) return;

        const updateItems = $(data.next.html).find('[data-barba-update]');
        
        if (updateItems.length > 0) {
            $('[data-barba-update]').each(function (index) {
                if ($(updateItems[index]).length > 0) {
                    const newLinkStatus = $(updateItems[index]).attr('data-link-status');
                    $(this).attr('data-link-status', newLinkStatus);
                }
            });
        }
    } catch (error) {
        console.error('Error in initBarbaNavUpdate:', error);
    }
}

/**
 * Устанавливает CSS-переменную для мобильных устройств
 */
function initWindowInnerheight() {
    try {
        $(document).ready(() => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });

        // Обработка якорных ссылок теперь происходит в initLenis
    } catch (error) {
        console.error('Error in initWindowInnerheight:', error);
    }
}

/**
 * Swiper Slider
 */
function initSwiperSlider() {
    try {
        // Проверяем, существует ли Swiper
        if (typeof Swiper === 'undefined') {
            console.warn('Swiper не найден');
            return;
        }

        // Инициализируем слайдеры только если соответствующие элементы существуют
        if (document.querySelector(".typecard__slide")) {
            var typecardSlide = new Swiper(".typecard__slide", {
                slidesPerView: 1,
                loop: true,
                speed: 800,
                navigation: {
                    nextEl: ".btn-next",
                    prevEl: ".btn-prev",
                },
                autoplay: {
                    delay: 2500,
                    disableOnInteraction: true
                }
            });
        }

        if (document.querySelector(".blog-slider")) {
            var blogSingleSlide = new Swiper(".blog-slider", {
                slidesPerView: 2,
                loop: true,
                spaceBetween: 20,
                // lazy: true,
                navigation: {
                    nextEl: ".btn-next",
                    prevEl: ".btn-prev",
                },
                breakpoints: {
                    1200: {
                        slidesPerView: 3,
                    }
                },
                autoplay: {
                    delay: 2500,
                    disableOnInteraction: true
                }
            });
        }
        
        // Инициализируем Slick карусель с видео
        initVideoCarousel();
    } catch (error) {
        console.error('Error in initSwiperSlider:', error);
    }
}

/**
 * Slick карусель с видео
 */
function initVideoCarousel() {
    try {
        // Проверяем наличие jQuery и Slick
        if (typeof jQuery === 'undefined') {
            console.warn('jQuery не найден, Slick карусель недоступна');
            return;
        }
        
        const $mySlider = jQuery('.reviews__slider');
        
        // Проверяем наличие элемента карусели
        if ($mySlider.length === 0) {
            return;
        }
        
        // Проверяем, не инициализирован ли уже слайдер
        if ($mySlider.hasClass('slick-initialized')) {
            return;
        }
        
        // Инициализируем Slick карусель
        $mySlider.slick({
            dots: true,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            centerMode: true,
            centerPadding: '0px',
            speed: 500,
            variableWidth: true,
            cssEase: 'ease-in-out',
            lazyLoad: 'ondemand',
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1
                    }
                },
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        });
        
        // Функция для остановки всех видео
        function pauseAllVideos() {
            document.querySelectorAll('.review-video').forEach(video => {
                video.pause();
                video.currentTime = 0;
            });
        }
        
        // Остановка видео при смене слайда
        $mySlider.on('beforeChange', () => {
            pauseAllVideos();
        });
        
        // Обработчики для кнопок воспроизведения
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', event => {
                const parentSlide = button.closest('.slide');
                
                // Проверяем, активен ли слайд
                if (!parentSlide.classList.contains('slick-active')) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                
                const video = parentSlide.querySelector('.review-video');
                if (video) {
                    pauseAllVideos();
                    video.play().then(() => {
                        button.style.display = 'none';
                    }).catch(error => console.error('Ошибка воспроизведения:', error));
                }
            });
        });
        
        // Обработчики для видео
        document.querySelectorAll('.review-video').forEach(video => {
            const button = video.closest('.slide').querySelector('.play-button');
            
            // При клике на видео
            video.addEventListener('click', () => {
                if (!video.closest('.slide').classList.contains('slick-active')) {
                    return;
                }
                
                if (video.paused) {
                    pauseAllVideos();
                    video.play().then(() => {
                        button.style.display = 'none';
                    }).catch(error => console.error('Ошибка воспроизведения:', error));
                } else {
                    video.pause();
                }
            });
            
            // При паузе видео
            video.addEventListener('pause', () => {
                button.style.display = 'block';
            });
            
            // При воспроизведении видео
            video.addEventListener('play', () => {
                button.style.display = 'none';
            });
        });
        
        console.log('Video carousel initialized successfully');
    } catch (error) {
        console.error('Error in initVideoCarousel:', error);
    }
}


/**
 * Home page
 */
function initHomePage() {
    try {
        // ===================================
        // Economy block slider
        // ===================================
        const sliderBlocks = document.querySelectorAll(".slider-block");
        
        if (sliderBlocks.length > 0) {
            sliderBlocks.forEach((block) => {
                try {
                    const track = block.querySelector(".slider-track");
                    const slides = block.querySelectorAll(".slider-slide");
                    
                    // Проверяем наличие необходимых элементов
                    if (!track || slides.length === 0) {
                        console.warn('Missing slider elements in block', block);
                        return;
                    }
                    
                    let controlsContainer = block.querySelector(".slider-control");
                    if (!controlsContainer) {
                        controlsContainer = document.createElement("div");
                        controlsContainer.classList.add("slider-control");
                        block.prepend(controlsContainer);
                    } else {
                        controlsContainer.innerHTML = "";
                    }
                    
                    let currentIndex = 0;
                    let startX = 0;
                    let moveX = 0;
                    let isSwiping = false;
                    let autoplayInterval;
                    
                    const updateSlider = (index) => {
                        // Make sure index is within bounds
                        if (index >= slides.length) {
                            index = 0;
                        } else if (index < 0) {
                            index = slides.length - 1;
                        }
                        
                        const slideWidth = slides[0].offsetWidth;
                        
                        // Используем GSAP для анимации слайдера
                        if (typeof gsap !== 'undefined') {
                            gsap.to(track, {
                                x: -index * slideWidth,
                                duration: 0.6,
                                ease: "power2.out"
                            });
                        } else {
                            // Fallback если GSAP не доступен
                            track.style.transform = `translateX(-${index * slideWidth}px)`;
                        }
                        
                        block.querySelectorAll(".slider-button").forEach((btn, idx) => {
                            btn.classList.toggle("active", idx === index);
                        });
                        currentIndex = index;
                    };
                    
                    // Function to start autoplay
                    const startAutoplay = () => {
                        // Clear any existing interval first
                        stopAutoplay();
                        
                        autoplayInterval = setInterval(() => {
                            updateSlider(currentIndex + 1);
                        }, 3500); // 3.5 seconds
                    };
                    
                    // Function to stop autoplay
                    const stopAutoplay = () => {
                        if (autoplayInterval) {
                            clearInterval(autoplayInterval);
                            autoplayInterval = null;
                        }
                    };
                    
                    slides.forEach((_, index) => {
                        const button = document.createElement("button");
                        button.classList.add("slider-button");
                        button.textContent = index + 1;
                        button.addEventListener("click", () => {
                            updateSlider(index);
                            // Restart autoplay when user clicks a button
                            startAutoplay();
                        });
                        controlsContainer.appendChild(button);
                    });
                    
                    // Добавляем класс active первой кнопке только если она существует
                    const firstButton = controlsContainer.querySelector(".slider-button");
                    if (firstButton) {
                        firstButton.classList.add("active");
                    }
                    
                    // Swipe events
                    track.addEventListener("touchstart", (e) => {
                        startX = e.touches[0].clientX;
                        isSwiping = true;
                        // Stop autoplay while user is interacting
                        stopAutoplay();
                    });
                    
                    track.addEventListener("touchmove", (e) => {
                        if (!isSwiping) return;
                        moveX = e.touches[0].clientX;
                    });
                    
                    track.addEventListener("touchend", () => {
                        if (!isSwiping) return;
                        let diff = startX - moveX;
                        if (Math.abs(diff) > 50) {
                            if (diff > 0 && currentIndex < slides.length - 1) {
                                updateSlider(currentIndex + 1);
                            } else if (diff < 0 && currentIndex > 0) {
                                updateSlider(currentIndex - 1);
                            }
                        }
                        isSwiping = false;
                        // Restart autoplay after user finishes interacting
                        startAutoplay();
                    });
                    
                    // Pause autoplay when user hovers over slider
                    block.addEventListener("mouseenter", stopAutoplay);
                    block.addEventListener("mouseleave", startAutoplay);
                    
                    window.addEventListener("resize", () => {
                        updateSlider(currentIndex);
                    });
                    
                    // Start autoplay when page loads
                    startAutoplay();
                } catch (error) {
                    console.error('Error in slider block processing:', error);
                }
            });
        }

        // ===================================
        // Economy Number Animation с использованием GSAP
        // ===================================
        const numberElements = document.querySelectorAll(".custom-count-number");

        if (numberElements.length > 0 && typeof gsap !== 'undefined') {
            const parseNumberAndSymbol = (text) => {
                if (!text) return null;
                
                const match = text.trim().match(/^([\d,]+)(\s*[<%]?)$/);
                if (!match) return null;

                return {
                    number: parseInt(match[1].replace(/,/g, ""), 10),
                    suffix: match[2] || "",
                };
            };

            const animateNumber = (element, finalNumber, suffix) => {
                // Создаем объект для анимации
                const obj = { value: 0 };
                
                // Устанавливаем начальное значение
                element.style.opacity = "1";
                
                // Анимируем с GSAP
                gsap.to(obj, {
                    value: finalNumber,
                    duration: 2,
                    ease: "power1.out",
                    onUpdate: function() {
                        element.textContent = `${Math.floor(obj.value).toLocaleString("en-US")}${suffix}`;
                    }
                });
            };

            // Создаем обсервер для отслеживания видимости элементов
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.animated) {
                        try {
                            const data = parseNumberAndSymbol(entry.target.textContent);
                            if (!data) return;

                            const { number, suffix } = data;
                            entry.target.dataset.animated = "true";
                            animateNumber(entry.target, number, suffix);
                        } catch (error) {
                            console.error('Error in number animation:', error);
                        }
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: "0px 0px -25% 0px"
            });
            
            // Наблюдаем за всеми элементами
            numberElements.forEach(element => {
                observer.observe(element);
            });
        }

        // ===================================
        // Typecard Tabs с использованием GSAP
        // ===================================
        const tabs = document.querySelectorAll('.typecard__tab');
        const tabContents = document.querySelectorAll('.typecard__content');

        if (tabs.length > 0 && tabContents.length > 0) {
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    try {
                        // Remove active class from all tabs
                        tabs.forEach(t => t.classList.remove('typecard__tab_active'));
                        
                        // Add active class to clicked tab
                        this.classList.add('typecard__tab_active');
                        
                        // Show corresponding content
                        const tabId = this.getAttribute('data-tab');
                        if (!tabId) return;
                        
                        // Get current active content
                        const currentActive = document.querySelector('.typecard__content_active');
                        
                        // Get new content to activate
                        const newActive = document.getElementById(tabId + '-content');
                        
                        if (!newActive || !currentActive) return;
                        
                        // Если GSAP доступен, используем его для анимации
                        if (typeof gsap !== 'undefined') {
                            // Скрываем текущий активный контент
                            gsap.to(currentActive, {
                                opacity: 0,
                                duration: 0.3,
                                onComplete: function() {
                                    currentActive.classList.remove('typecard__content_active');
                                    
                                    // Показываем новый контент
                                    newActive.classList.add('typecard__content_active');
                                    newActive.style.opacity = 0;
                                    
                                    gsap.to(newActive, {
                                        opacity: 1,
                                        duration: 0.3
                                    });
                                }
                            });
                        } else if (typeof jQuery !== 'undefined') {
                            // Fallback на jQuery, если GSAP не доступен
                            jQuery('.typecard__content_active').fadeOut(300, function() {
                                jQuery(this).removeClass('typecard__content_active');
                                jQuery(newActive).css('display', 'none').addClass('typecard__content_active').fadeIn(300);
                            });
                        } else {
                            // Fallback на обычное переключение, если ни GSAP, ни jQuery не доступны
                            tabContents.forEach(content => content.classList.remove('typecard__content_active'));
                            newActive.classList.add('typecard__content_active');
                        }
                    } catch (error) {
                        console.error('Error in tab click handling:', error);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error in initHomePage:', error);
    }
}

/**
 * Calculation
 */
function initCalc() {
    try {
        // Проверяем наличие необходимых элементов
        const fleetSlider = document.getElementById('fleet-slider');
        const fleetValue = document.getElementById('fleet-value');
        const fleetTooltip = document.getElementById('fleet-tooltip');
        const gallonsSlider = document.getElementById('gallons-slider');
        const gallonsValue = document.getElementById('gallons-value');
        const gallonsTooltip = document.getElementById('gallons-tooltip');
        const savingsAmount = document.getElementById('savings-amount');
        const numberButtons = document.querySelectorAll('.button-group__button');
        
        // Если элементы калькулятора отсутствуют, выходим из функции
        if (!fleetSlider || !gallonsSlider || !savingsAmount) {
            return;
        }
        
        // Set initial values
        let fleet = 1;
        let fillUps = 1;
        let gallons = 50;
        
        // Calculate savings
        function calculateSavings() {
            // Based on the specific requirement:
            // When fleet=1, fillUps=1, gallons=50, annual savings should be $25
            // When fleet=1, fillUps=1, gallons=51, annual savings should be $25.5
            // This means $0.5 per gallon per year with 1 fillup per week and 1 vehicle
            
            // Calculate the base savings
            const savingsPerGallon = 0.5; // $0.50 per gallon annually when fillups=1, fleet=1
            const baseSavings = gallons * savingsPerGallon;
            
            // Scale by number of vehicles and weekly fill-ups
            const annualSavings = baseSavings * fleet * fillUps;
            
            // Format with one decimal place if it's not a whole number
            const formattedSavings = Number.isInteger(annualSavings) 
                ? annualSavings 
                : annualSavings.toFixed(1);
            
            // Анимация числа с GSAP, если он доступен
            if (typeof gsap !== 'undefined' && savingsAmount) {
                // Получаем текущее значение
                const currentValue = parseFloat(savingsAmount.textContent) || 0;
                
                // Создаем объект для анимации
                const obj = { value: currentValue };
                
                // Анимируем с GSAP
                gsap.to(obj, {
                    value: parseFloat(formattedSavings),
                    duration: 0.5,
                    ease: "power1.out",
                    onUpdate: function() {
                        const displayValue = Number.isInteger(obj.value) 
                            ? Math.floor(obj.value) 
                            : obj.value.toFixed(1);
                        savingsAmount.textContent = `${displayValue}`;
                    }
                });
            } else {
                savingsAmount.textContent = `${formattedSavings}`;
            }
        }
        
        // Update position of the tooltip
        function updateTooltipPosition(slider, tooltip) {
            if (!slider || !tooltip) return;
            
            const min = parseInt(slider.min);
            const max = parseInt(slider.max);
            const val = parseInt(slider.value);
            const percentage = ((val - min) / (max - min)) * 100;
            const thumbWidth = 60; // Width of thumb in pixels
            const sliderWidth = slider.offsetWidth - thumbWidth;
            const offset = (percentage / 100) * sliderWidth + (thumbWidth / 2);
            
            // Используем GSAP для плавного перемещения тултипа
            if (typeof gsap !== 'undefined') {
                gsap.to(tooltip, {
                    left: `${offset}px`,
                    duration: 0.2,
                    ease: "power1.out"
                });
            } else {
                tooltip.style.left = `${offset}px`;
            }
        }
        
        // Update sliders
        if (fleetSlider && fleetValue && fleetTooltip) {
            fleetSlider.addEventListener('input', function() {
                fleet = parseInt(this.value);
                fleetValue.textContent = fleet;
                fleetTooltip.textContent = fleet;
                updateTooltipPosition(fleetSlider, fleetTooltip);
                calculateSavings();
            });
        }
        
        if (gallonsSlider && gallonsValue && gallonsTooltip) {
            gallonsSlider.addEventListener('input', function() {
                gallons = parseInt(this.value);
                gallonsValue.textContent = gallons;
                gallonsTooltip.textContent = gallons;
                updateTooltipPosition(gallonsSlider, gallonsTooltip);
                calculateSavings();
            });
        }
        
        // Set up number buttons for fill-ups
        if (numberButtons.length > 0) {
            numberButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    numberButtons.forEach(btn => btn.classList.remove('button-group__button--active'));
                    
                    // Add active class to clicked button
                    this.classList.add('button-group__button--active');
                    
                    // Update fillUps value
                    fillUps = parseInt(this.dataset.value) || 1;
                    calculateSavings();
                });
            });
        }
        
        // Initialize tooltip positions
        window.addEventListener('load', function() {
            updateTooltipPosition(fleetSlider, fleetTooltip);
            updateTooltipPosition(gallonsSlider, gallonsTooltip);
        });
        
        // Initial calculation
        calculateSavings();
    } catch (error) {
        console.error('Error in initCalc:', error);
    }
}


/**
 * Register Step Form with GSAP animations and step indicators
 */
function initRegisterStepForm() {
    // Get form elements
    const form = document.querySelector('.wpcf7-form');
    const step1 = document.querySelector('.form__step-1');
    const step2 = document.querySelector('.form__step-2');
    const nextBtn = document.querySelector('.form__step-next');
    const backBtn = document.querySelector('.form__step-back');
    
    // Get step indicators
    const stepIndicators = document.querySelectorAll('.form__step-header ul li');
    // Проверяем наличие индикаторов перед получением
    let step1Indicator = null;
    let step2Indicator = null;
    
    // Проверяем и находим элементы на основе их содержимого
    stepIndicators.forEach(indicator => {
        if (indicator.textContent.trim() === '1') {
            step1Indicator = indicator;
        } else if (indicator.textContent.trim() === '2') {
            step2Indicator = indicator;
        }
    });

    // Required fields in step 1
    const requiredFields = [
        'input[name="lastname"]',
        'input[name="firstname"]',
        'input[name="email-479"]',
        'input[name="tel"]'
    ];

    // Initial setup with GSAP
    gsap.set(step1, { autoAlpha: 1 });
    gsap.set(step2, { autoAlpha: 0, display: 'none' });
    
    // Step 1 indicator is filled by default
    if (step1Indicator) {
        step1Indicator.classList.add('filled');
    }

    // Handle Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Validate all required fields in step 1
            const isValid = validateRequiredFields(requiredFields);

            if (isValid) {
                // Update step indicators
                if (step2Indicator) {
                    // Простое добавление класса без GSAP
                    step2Indicator.classList.add('filled');
                }
                
                // Animate transition to step 2
                gsap.timeline()
                    .to(step1, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                    .set(step1, { display: 'none' })
                    .set(step2, { display: 'block' })
                    .to(step2, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
            }
        });
    }

    // Handle Back button click
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Update step indicators
            if (step2Indicator) {
                // Простое удаление класса без GSAP
                step2Indicator.classList.remove('filled');
            }
            
            // Animate transition back to step 1
            gsap.timeline()
                .to(step2, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                .set(step2, { display: 'none' })
                .set(step1, { display: 'block' })
                .to(step1, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
        });
    }

    // Validate required fields
    function validateRequiredFields(fields) {
        let isValid = true;

        // Remove any existing error messages
        const existingErrors = form.querySelectorAll('.form-error-message');
        existingErrors.forEach(error => error.remove());

        // Reset field styling
        form.querySelectorAll('.input-error').forEach(field => {
            field.classList.remove('input-error');
        });

        // Check each required field
        fields.forEach(selector => {
            const field = form.querySelector(selector);

            if (field && field.getAttribute('aria-required') === 'true') {
                if (!field.value.trim()) {
                    isValid = false;

                    // Add error styling
                    field.classList.add('input-error');

                    // Add error message with GSAP animation
                    const errorMessage = document.createElement('span');
                    errorMessage.className = 'form-error-message';
                    errorMessage.textContent = 'This field is required';
                    errorMessage.style.opacity = '0';
                    
                    // Insert error message after the field
                    field.parentNode.appendChild(errorMessage);
                    
                    // Animate error message appearance
                    gsap.to(errorMessage, { 
                        opacity: 1, 
                        duration: 0.3, 
                        ease: "power2.out"
                    });
                    
                    // Shake effect on invalid field
                    gsap.fromTo(field, 
                        { x: 0 }, 
                        { x: 5, duration: 0.1, repeat: 3, yoyo: true }
                    );
                }

                // Additional validation for email
                if (selector.includes('email') && field.value.trim()) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(field.value.trim())) {
                        isValid = false;

                        // Add error styling
                        field.classList.add('input-error');

                        // Add error message with GSAP animation
                        const errorMessage = document.createElement('span');
                        errorMessage.className = 'form-error-message';
                        errorMessage.textContent = 'Please enter a valid email address';
                        errorMessage.style.opacity = '0';
                        
                        // Insert error message after the field
                        field.parentNode.appendChild(errorMessage);
                        
                        // Animate error message appearance
                        gsap.to(errorMessage, { 
                            opacity: 1, 
                            duration: 0.3, 
                            ease: "power2.out"
                        });
                        
                        // Shake effect on invalid field
                        gsap.fromTo(field, 
                            { x: 0 }, 
                            { x: 5, duration: 0.1, repeat: 3, yoyo: true }
                        );
                    }
                }

                // Additional validation for phone
                if (selector.includes('tel') && field.value.trim()) {
                    const phonePattern = /^[0-9\+\-\(\)\s]+$/;
                    if (!phonePattern.test(field.value.trim())) {
                        isValid = false;

                        // Add error styling
                        field.classList.add('input-error');

                        // Add error message with GSAP animation
                        const errorMessage = document.createElement('span');
                        errorMessage.className = 'form-error-message';
                        errorMessage.textContent = 'Please enter a valid phone number';
                        errorMessage.style.opacity = '0';
                        
                        // Insert error message after the field
                        field.parentNode.appendChild(errorMessage);
                        
                        // Animate error message appearance
                        gsap.to(errorMessage, { 
                            opacity: 1, 
                            duration: 0.3, 
                            ease: "power2.out"
                        });
                        
                        // Shake effect on invalid field
                        gsap.fromTo(field, 
                            { x: 0 }, 
                            { x: 5, duration: 0.1, repeat: 3, yoyo: true }
                        );
                    }
                }
            }
        });

        return isValid;
    }

    // Integrate with Contact Form 7
    document.addEventListener('wpcf7invalid', function(event) {
        // If the form is on step 2 and validation fails, keep showing step 2
        if (getComputedStyle(step2).display !== 'none') {
            event.preventDefault();
        }
    });
  
    // Reset form on successful submission
    document.addEventListener('wpcf7mailsent', function() {
        // Reset step indicators
        if (step2Indicator) {
            // Простое удаление класса без GSAP
            step2Indicator.classList.remove('filled');
        }
        
        // Animate back to step 1
        gsap.timeline()
            .to(step2, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
            .set(step2, { display: 'none' })
            .set(step1, { display: 'block' })
            .to(step1, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
    
        // Reset all inputs with slight delay
        gsap.delayedCall(0.5, function() {
            form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
                input.value = '';
            });
        });
    });

    // Add CSS for error styling
    const style = document.createElement('style');
    style.textContent = `
        .input-error {
            border-color: red !important;
        }
        .form-error-message {
            color: red;
            font-size: 12px;
            display: block;
            margin-top: 5px;
        }
    `;
    document.head.appendChild(style);

}