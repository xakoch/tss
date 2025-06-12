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

        // Добавляем хук для запуска инициализаций после перехода страницы
        barba.hooks.after(() => {
            // Инициализируем анимацию чисел
            initAnimNumbers();
            
            // Проверяем наличие слайдеров на любой странице
            const sliderBlocks = document.querySelectorAll(".slider-block");
            if (sliderBlocks.length > 0) {
                // Если есть слайдеры, запускаем их инициализацию
                initSliderBlocks(sliderBlocks);
            }
            
            // Проверяем, находимся ли на странице с табами
            const tabs = document.querySelectorAll('.typecard__tab');
            const tabContents = document.querySelectorAll('.typecard__content');
            if (tabs.length > 0 && tabContents.length > 0) {
                initTypecardTabs(tabs, tabContents);
            }
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

                    var cf_selector = 'div.wpcf7 > form';
                    var cf_forms = $(next.container).find(cf_selector);
                    if (cf_forms.length > 0) {
                        $(cf_selector).each(function() {
                            var $form = $(this);
                            wpcf7.init($form[0]);
                        });
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
 * Запускает все скрипты на новой странице
 */
function initScript() {
    try {
        initLenis();
        initBarbaNavUpdate();
        initWindowInnerheight();
        initSwiperSlider();
        initBtnMenuOpenClose();
        
        // Анимируем стандартные элементы на всех страницах
        animateCommonElements();

        setTimeout(() => {
            initDynamicVideoModal();
        }, 100);
        
        // Проверяем наличие элементов на странице
        const sliderBlocks = document.querySelectorAll(".slider-block");
        if (sliderBlocks.length > 0) {
            initSliderBlocks(sliderBlocks);
        }
        
        const tabs = document.querySelectorAll('.typecard__tab');
        const tabContents = document.querySelectorAll('.typecard__content');
        if (tabs.length > 0 && tabContents.length > 0) {
            initTypecardTabs(tabs, tabContents);
        }
        
        // Проверяем, находимся ли мы на домашней странице
        if (isHomePage()) {
            initHomePage();
        }

        initModals();
        initCalc();
        initMultiStepForm();
        // Инициализируем анимацию чисел на ВСЕХ страницах
        initAnimNumbers();
        initZohoForms();

        if (document.querySelector('.login-page')) {
            initLoginPage();
            togglePasswordVisibility();
        }

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
 * Система динамического создания модального окна с видео
 */
function initDynamicVideoModal() {
    // Создаем единое модальное окно для всех видео
    if (!document.getElementById('dynamic-video-modal')) {
        const modalHTML = `
            <div class="modal modal__reviews" id="dynamic-video-modal">
                <div class="modal__content">
                    <button class="modal__close" data-modal-close>✕</button>
                    <div class="video-container">
                        <div class="video-placeholder">
                            <div class="loader">Загрузка...</div>
                        </div>
                    </div>
                </div>
                <div class="modal__overlay"></div>
            </div>
        `;
        
        // Добавляем модальное окно в конец body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
    }
    
    // Получаем ссылки на элементы модального окна
    const dynamicModal = document.getElementById('dynamic-video-modal');
    const videoContainer = dynamicModal.querySelector('.video-container');
    const placeholder = videoContainer.querySelector('.video-placeholder');
    const closeButton = dynamicModal.querySelector('[data-modal-close]');
    const modalOverlay = dynamicModal.querySelector('.modal__overlay');
    
    // Текущий плеер YouTube
    let currentPlayer = null;
    
    // Загрузка YouTube API
    function loadYouTubeAPI() {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            
            return new Promise((resolve) => {
                window.onYouTubeIframeAPIReady = function() {
                    resolve();
                };
            });
        } else {
            return Promise.resolve();
        }
    }
    
    // Загружаем YouTube API заранее
    loadYouTubeAPI();
    
    // Получаем все кнопки открытия видео
    const videoOpenButtons = document.querySelectorAll("[data-modal-open^='modal-reviews-']");
    
    // Функция для извлечения ID видео из атрибута или из данных элемента
    function getVideoId(button) {
        // Приоритетно проверяем атрибут data-video-id
        if (button.hasAttribute('data-video-id')) {
            return button.getAttribute('data-video-id');
        }
        
        // Проверяем data-modal-open для получения ID модального окна
        const modalId = button.getAttribute('data-modal-open');
        
        // Если есть атрибут data-modal-open, пытаемся найти соответствующий модальный элемент
        if (modalId) {
            // Проверяем, существует ли старый модальный элемент
            const oldModal = document.getElementById(modalId);
            if (oldModal) {
                // Пытаемся найти iframe и извлечь ID видео из его src
                const iframe = oldModal.querySelector('iframe');
                if (iframe && iframe.getAttribute('src')) {
                    return extractYouTubeId(iframe.getAttribute('src'));
                }
            }
        }
        
        // Если не смогли найти ID видео, используем запасной вариант или null
        return null;
    }
    
    // Функция для извлечения ID видео YouTube из URL
    function extractYouTubeId(url) {
        if (!url) return null;
        
        // Регулярное выражение для поиска ID в URL YouTube
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    // Функция для создания и отображения плеера YouTube
    function createYouTubePlayer(videoId) {
        // Очищаем контейнер от предыдущего плеера
        const oldPlayerDiv = videoContainer.querySelector('div:not(.video-placeholder)');
        if (oldPlayerDiv) {
            oldPlayerDiv.remove();
        }
        
        // Показываем индикатор загрузки
        placeholder.style.display = 'flex';
        
        // Создаем новый div для YouTube Player API
        const playerDiv = document.createElement('div');
        playerDiv.id = `youtube-player-${Date.now()}`;
        videoContainer.appendChild(playerDiv);
        
        // Создаем плеер
        loadYouTubeAPI().then(() => {
            currentPlayer = new YT.Player(playerDiv.id, {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'controls': 1
                },
                events: {
                    'onReady': function(event) {
                        // Скрываем индикатор загрузки
                        placeholder.style.display = 'none';
                    },
                    'onError': function(event) {
                        console.error(`Ошибка загрузки видео ${videoId}`);
                        placeholder.innerHTML = 'Ошибка загрузки видео';
                    }
                }
            });
        }).catch(error => {
            console.error('Ошибка при загрузке YouTube API', error);
            placeholder.innerHTML = 'Ошибка загрузки YouTube API';
        });
    }
    
    // Функция остановки и удаления плеера
    function destroyPlayer() {
        if (currentPlayer) {
            try {
                currentPlayer.stopVideo();
                currentPlayer.destroy();
            } catch (e) {
                console.warn('Ошибка при удалении плеера', e);
            }
            currentPlayer = null;
        }
    }
    
    // Обработчик закрытия модального окна
    function closeModal() {
        destroyPlayer();
        dynamicModal.classList.remove('is-active');
        // Восстанавливаем плавную прокрутку
        if (window.lenis && typeof window.lenis.start === 'function') {
            window.lenis.start();
        }
    }
    
    // Добавляем обработчики событий для кнопок
    videoOpenButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Получаем ID видео для данной кнопки
            const videoId = getVideoId(button);
            
            if (!videoId) {
                console.error('ID видео не найден');
                return;
            }
            
            // Создаем плеер с нужным видео
            createYouTubePlayer(videoId);
            
            // Отображаем модальное окно
            dynamicModal.classList.add('is-active');
            
            // Останавливаем плавную прокрутку
            if (window.lenis && typeof window.lenis.stop === 'function') {
                window.lenis.stop();
            }
        });
    });
    
    // Обработчики закрытия модального окна
    closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    
    // Закрытие при клике на оверлей
    modalOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    
    // При нажатии Escape закрываем модальное окно
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dynamicModal.classList.contains('is-active')) {
            closeModal();
        }
    });
}

// Сохраняем оригинальную функцию для поддержки обратной совместимости
function initModals() {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
        autoRaf: true,
        prevent: (node) => node.classList.contains("modal")
    });
    
    // Сохраняем ссылку на lenis в глобальной области видимости для доступа из других функций
    window.lenis = lenis;
    
    // Get all open buttons and modal elements (кроме видео модалки, которая обрабатывается отдельно)
    const openButtons = document.querySelectorAll("[data-modal-open]:not([data-modal-open^='modal-reviews-'])");
    const closeButtons = document.querySelectorAll("[data-modal-close]");
    const modals = document.querySelectorAll(".modal:not(#dynamic-video-modal)");
    
    // Add click event to all open buttons
    openButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default action
            // Get target modal ID from data attribute
            const modalId = button.getAttribute("data-modal-open");
            const targetModal = document.getElementById(modalId);
            if (targetModal) {
                targetModal.classList.add('is-active');
                console.log(`Modal ${modalId} opened`);
                lenis.stop();
            }
        });
    });
    
    // Add click event to all close buttons
    closeButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); // Prevent default action
            // Find the parent modal of this close button
            const parentModal = button.closest('.modal');
            if (parentModal) {
                parentModal.classList.remove('is-active');
                console.log(`Modal ${parentModal.id} closed`);
                // Only restart Lenis if no other modals are active
                if (!document.querySelector('.modal.is-active')) {
                    lenis.start();
                }
            }
        });
    });
    
    // Optional: Close modal when clicking outside content area
    modals.forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove('is-active');
                console.log(`Modal ${modal.id} closed by outside click`);
                // Only restart Lenis if no other modals are active
                if (!document.querySelector('.modal.is-active')) {
                    lenis.start();
                }
            }
        });
    });
}

/**
 * Hamburger Nav Open/Close
 */
function initBtnMenuOpenClose() {

    /**************************************************************
    * Header / Menu burger
    **************************************************************/
    const body = document.querySelector('body');
    const burger = document.querySelector('.burger');
    const menu = document.querySelectorAll('.mobile__menu');
    const links = document.querySelectorAll('.mobile__menu .header__nav a');
    const langLinks = document.querySelectorAll('.language-chooser a');

    // Установка начального состояния меню (скрыто)
    gsap.set(menu, {
        scale: 0.95,
        autoAlpha: 0,
        rotation: -2,
        transformOrigin: "top right",
        filter: "blur(15px)"
    });

    function toggleMobileMenu() {
        if (!burger.classList.contains('is-active')) {
            // Открываем меню с плавной анимацией
            burger.classList.add('is-active');
            body.classList.add('overflow');
            
            // Создаем более плавную временную шкалу
            const tl = gsap.timeline({ 
                defaults: { 
                    ease: "power2.out", 
                    duration: 0.3
                }
            });
            
            // Разделяем анимацию на более простые шаги для плавности
            tl.to(menu, { 
                autoAlpha: 1, 
                duration: 0.3
            })
            .to(menu, { 
                scale: 1, 
                rotation: 0, 
                duration: 0.3,
                clearProps: "rotation" // Очищаем свойства для лучшей производительности
            }, "-=0.2")
            .to(menu, {
                filter: "blur(0px)", 
                duration: 0.3
            }, "-=0.4");
            
        } else {
            // Закрываем меню
            burger.classList.remove('is-active');
            body.classList.remove('overflow');
            
            // Более плавная обратная анимация
            const tl = gsap.timeline({ 
                defaults: { 
                    ease: "power2.inOut", 
                    duration: 0.3
                }
            });
            
            // Анимируем само меню
            tl.to(menu, { 
                scale: 0.95, 
                rotation: -2, 
                filter: "blur(15px)", 
                duration: 0.3,
                force3D: true // Включаем аппаратное ускорение
            })
            .to(menu, { 
                autoAlpha: 0, 
                duration: 0.3 
            }, "-=0.2");
        }
    }

    burger.addEventListener('click', e => {
        e.preventDefault();
        toggleMobileMenu();
    });

    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            burger.classList.remove('is-open');
            body.classList.remove('overflow');
            gsap.to(menu, { autoAlpha: 0, ease: "power2" })
        });
    });

    langLinks.forEach(lang => {
        lang.addEventListener('click', e => {
            e.preventDefault();
            burger.classList.remove('is-open');
            body.classList.remove('overflow');
            gsap.to(menu, { autoAlpha: 0, ease: "power2" })
        });
    });

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
                { y: -30 },
                { y: 0, duration: 0.8, ease: "power2.out" }
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
            gsap.set(footer, { y: 80 });
            
            // Создаем обсервер для отслеживания видимости футера
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !footer.classList.contains('animated')) {
                        // Анимация появления снизу вверх с небольшой задержкой
                        gsap.to(footer, {
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
        
        return false;
    } catch (error) {
        console.error('Error in isHomePage:', error);
        return false;
    }
}

// Функция для работы слайдеров - выделена из initHomePage для возможности использования отдельно
function initSliderBlocks(sliderBlocks) {
    sliderBlocks.forEach((block) => {
        try {
            const track = block.querySelector(".slider-track");
            const slides = block.querySelectorAll(".slider-slide");
            
            // Проверяем наличие необходимых элементов
            if (!track || slides.length === 0) {
                console.warn('Missing slider elements in block', block);
                return;
            }
            
            // Если слайдер уже инициализирован, то пропускаем
            if (block.dataset.initialized === 'true') {
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
            
            // Помечаем слайдер как инициализированный
            block.dataset.initialized = 'true';
            
        } catch (error) {
            console.error('Error in slider block processing:', error);
        }
    });
}

// Функция для работы с табами - выделена из initHomePage для возможности использования отдельно
function initTypecardTabs(tabs, tabContents) {
    tabs.forEach(tab => {
        // Если обработчик уже установлен, пропускаем
        if (tab.dataset.handlerAttached === 'true') {
            return;
        }
        
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
        
        // Помечаем таб как инициализированный
        tab.dataset.handlerAttached = 'true';
    });
}

/**
 * Home page функционал
 */
function initHomePage() {
    try {
        // Инициализируем слайдеры, если они есть
        const sliderBlocks = document.querySelectorAll(".slider-block");
        if (sliderBlocks.length > 0) {
            initSliderBlocks(sliderBlocks);
        }

        // Инициализируем табы, если они есть
        const tabs = document.querySelectorAll('.typecard__tab');
        const tabContents = document.querySelectorAll('.typecard__content');
        if (tabs.length > 0 && tabContents.length > 0) {
            initTypecardTabs(tabs, tabContents);
        }
    } catch (error) {
        console.error('Error in initHomePage:', error);
    }
}

/**
 * Anime Numbers
 */
function initAnimNumbers() {
    // Находим все элементы для анимации
    const numberElements = document.querySelectorAll(".anime-number");
    
    if (numberElements.length === 0 || typeof gsap === 'undefined') return;
    
    // Обрабатываем каждый элемент
    numberElements.forEach(element => {
        // Получаем текст элемента
        const originalText = element.textContent;
        
        // Используем улучшенное регулярное выражение для поиска числа с точкой и запятой
        const match = originalText.match(/^(.*?)(\d[\d,.]+)(.*)$/);
        if (!match) return;
        
        // Извлекаем части
        const prefix = match[1] || '';
        const numText = match[2];
        const suffix = match[3] || '';
        
        // Преобразуем строку в число, удаляя запятые
        let targetNumber = parseFloat(numText.replace(/,/g, ''));
        
        // Определяем, имеет ли число десятичную часть
        const hasDecimal = numText.includes('.');
        const decimalPlaces = hasDecimal ? numText.split('.')[1].length : 0;
        
        // Запускаем анимацию от 0 до целевого числа
        const obj = { value: 0 };
        
        gsap.to(obj, {
            value: targetNumber,
            duration: 2,
            ease: "power1.out",
            onUpdate: function() {
                // Форматируем текущее значение с учетом десятичных знаков
                let currentValue;
                
                if (hasDecimal) {
                    currentValue = obj.value.toFixed(decimalPlaces);
                } else {
                    currentValue = Math.floor(obj.value);
                }
                
                // Добавляем запятые, если они были в оригинальном тексте
                if (numText.includes(',')) {
                    const parts = currentValue.toString().split('.');
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    currentValue = parts.join('.');
                }
                
                // Обновляем текст элемента
                element.textContent = prefix + currentValue + suffix;
            }
        });
    });
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
                slidesPerView: 1.1,
                loop: true,
                spaceBetween: 20,
                // lazy: true,
                navigation: {
                    nextEl: ".btn-next",
                    prevEl: ".btn-prev",
                },
                breakpoints: {
                    560: {
                        slidesPerView: 1.5,
                    },
                    991: {
                        slidesPerView: 2,
                    },
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
            infinite: false,
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
                    breakpoint: 1200,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1
                    }
                }
            ]
        });
        
        console.log('Video carousel initialized successfully');
    } catch (error) {
        console.error('Error in initVideoCarousel:', error);
    }
}


/**
 * Инициализация форм Zoho на основе data-атрибутов.
 * АВТОМАТИЧЕСКИ СОБИРАЕТ UTM-МЕТКИ ИЗ COOKIE.
 * Не требует правок при добавлении новых форм.
 */
function initZohoForms() {
    /**
     * Вспомогательная функция для получения cookie по имени.
     * (Интегрирована из твоего старого кода)
     */
    const getCookie = (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    /**
     * Внутренняя, универсальная функция для создания iframe формы.
     * Принимает ID контейнера и ID самой Zoho формы.
     */
    const loadZohoForm = (targetDivId, zohoFormId) => {
        const targetDiv = document.getElementById(targetDivId);
        // Выходим, если div не найден, нет ID формы, или в нем уже есть iframe
        if (!targetDiv || !zohoFormId || targetDiv.querySelector('iframe')) {
            return;
        }

        // === НАЧАЛО: Интеграция UTM-меток из твоего старого кода ===
        const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        const collectedUtm = [];

        utmParams.forEach(key => {
            const val = getCookie(key);
            if (val) {
                collectedUtm.push(`${key}=${encodeURIComponent(val)}`);
            }
        });

        const utmString = collectedUtm.join('&');
        // === КОНЕЦ: Интеграция UTM-меток ===


        const iframe = document.createElement("iframe");
        
        // Собираем финальный URL с учетом UTM-меток
        const baseSrc = `https://forms.zohopublic.com/tsstechnology/form/TSST/formperma/${zohoFormId}`;
        const finalSrc = `${baseSrc}?zf_rszfm=1${utmString ? `&${utmString}` : ''}`;
        
        iframe.src = finalSrc;
        iframe.style.border = "none";
        iframe.style.height = "800px"; // Использую высоту из твоего примера, можешь поменять
        iframe.style.width = "100%";
        iframe.setAttribute("aria-label", "TSST Form");
        
        targetDiv.appendChild(iframe);
    };

    /**
     * Глобальный обработчик для изменения высоты фрейма от Zoho.
     * Устанавливается только один раз.
     */
    if (!window.zohoResizeListenerAttached) {
        window.addEventListener("message", function(event) {
            try {
                if (event.data && typeof event.data === 'string') {
                    const parts = event.data.split("|");
                    if (parts.length >= 2) {
                        const formId = parts[0];
                        const newHeight = parseInt(parts[1], 10) + 15 + "px";
                        const iframes = document.getElementsByTagName("iframe");
                        for (let i = 0; i < iframes.length; i++) {
                            if (iframes[i].src.includes(formId)) {
                                if (iframes[i].style.height !== newHeight) {
                                    iframes[i].style.height = newHeight;
                                }
                                break;
                            }
                        }
                    }
                }
            } catch (e) { /* Игнорируем ошибки */ }
        }, false);
        window.zohoResizeListenerAttached = true;
    }

    // --- Логика автоматического сканирования страницы (остается без изменений) ---

    // 1. Находим все триггеры (кнопки) для загрузки по клику
    const triggers = document.querySelectorAll('[data-zoho-trigger-for]');
    triggers.forEach(trigger => {
        if (trigger.dataset.zohoListener) {
            return;
        }
        
        const targetContainerId = trigger.dataset.zohoTriggerFor;
        const targetContainer = document.getElementById(targetContainerId);

        if (targetContainer) {
            const zohoFormId = targetContainer.dataset.zohoForm;
            if (zohoFormId) {
                trigger.addEventListener('click', () => {
                    loadZohoForm(targetContainerId, zohoFormId);
                });
                trigger.dataset.zohoListener = 'true';
            }
        }
    });

    // 2. Находим все формы для немедленной загрузки
    const immediateLoadForms = document.querySelectorAll('[data-zoho-form]');
    immediateLoadForms.forEach(formContainer => {
        if (formContainer.id) {
            const hasTrigger = document.querySelector(`[data-zoho-trigger-for="${formContainer.id}"]`);
            if (hasTrigger) {
                return;
            }
        }
        
        const zohoFormId = formContainer.dataset.zohoForm;
        if (!formContainer.id) {
            formContainer.id = `zoho-auto-id-${Math.random().toString(36).substr(2, 9)}`;
        }
        loadZohoForm(formContainer.id, zohoFormId);
    });
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
        const savingsAmountSm = document.getElementById('savings-amount-sm'); // Второй блок для отображения результатов
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
            const savingsPerGallon = 0.5; // $0.50 per gallon annually when fillups=1, fleet=1
            const baseSavings = gallons * savingsPerGallon;
            const annualSavings = baseSavings * fleet * fillUps;

            // Форматируем с одной десятичной точкой, если не целое число
            const formattedSavings = Number.isInteger(annualSavings) 
                ? annualSavings 
                : annualSavings.toFixed(1);

            // Анимация числа с GSAP, если он доступен
            if (typeof gsap !== 'undefined') {
                const currentValue = parseFloat(savingsAmount.textContent) || 0;
                const obj = { value: currentValue };

                gsap.to(obj, {
                    value: parseFloat(formattedSavings),
                    duration: 0.5,
                    ease: "power1.out",
                    onUpdate: function() {
                        const displayValue = Number.isInteger(obj.value) 
                            ? Math.floor(obj.value) 
                            : obj.value.toFixed(1);

                        // Обновляем оба блока
                        savingsAmount.textContent = `${displayValue}`;
                        if (savingsAmountSm) {
                            savingsAmountSm.textContent = `${displayValue}`;
                        }
                    }
                });
            } else {
                // Если GSAP не используется
                savingsAmount.textContent = `${formattedSavings}`;
                if (savingsAmountSm) {
                    savingsAmountSm.textContent = `${formattedSavings}`;
                }
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
 * Universal Multi-Step Form with GSAP animations and step indicators
 * Works with any number of steps and form fields
 */
function initMultiStepForm() {

    document.addEventListener('wpcf7mailsent', function(event) {
        // Получаем элемент формы
        const form = event.target;
        
        // Проверяем наличие класса form-redirect
        if (form.classList.contains('form-redirect')) {
            // Используем Barba.js для плавного перехода
            barba.go('https://ias.rsq.mybluehost.me/website_e4331c8e/card-activation-thank-you/');
        }
    }, false);

    // Get form elements
    const form = document.querySelector('.form') || document.querySelector('.wpcf7-form');
    if (!form) return;
    
    // Get all steps
    const steps = Array.from(form.querySelectorAll('.form__step, .form-step'));
    if (steps.length < 2) return; // Need at least two steps to work
    
    // Get all next buttons
    const nextButtons = form.querySelectorAll('.form__step-next, .next-step');
    
    // Get all back buttons
    const backButtons = form.querySelectorAll('.form__step-back');
    
    // Get step indicators
    const stepIndicators = document.querySelectorAll('.form__step-header ul li, .progress-steps li');
    
    // Map steps to their respective indicators
    const stepIndicatorMap = new Map();
    stepIndicators.forEach(indicator => {
        const stepNumber = indicator.textContent.trim();
        if (/^\d+$/.test(stepNumber)) {
            const index = parseInt(stepNumber) - 1;
            if (index >= 0 && index < steps.length) {
                stepIndicatorMap.set(steps[index], indicator);
            }
        }
    });
    
    // Setup GSAP for all steps
    steps.forEach((step, index) => {
        if (index === 0) {
            // First step is visible
            gsap.set(step, { autoAlpha: 1 });
            step.style.display = 'block';
            // Fill first indicator
            const indicator = stepIndicatorMap.get(step);
            if (indicator) {
                indicator.classList.add('filled');
            }
        } else {
            // Hide other steps
            gsap.set(step, { autoAlpha: 0, display: 'none' });
        }
    });
    
    // Handle Next button clicks
    nextButtons.forEach((nextButton, buttonIndex) => {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the current step (parent of the button)
            let currentStep = null;
            let currentStepIndex = -1;
            
            steps.forEach((step, index) => {
                if (step.contains(nextButton)) {
                    currentStep = step;
                    currentStepIndex = index;
                }
            });
            
            if (currentStep && currentStepIndex < steps.length - 1) {
                // Get next step
                const nextStep = steps[currentStepIndex + 1];
                
                // Get all required fields in current step
                const requiredFields = getRequiredFieldsInStep(currentStep);
                
                // Validate all required fields
                const isValid = validateRequiredFields(requiredFields);
                
                if (isValid) {
                    // Update step indicators
                    const nextIndicator = stepIndicatorMap.get(nextStep);
                    if (nextIndicator) {
                        nextIndicator.classList.add('filled');
                    }
                    
                    // Animate transition to next step
                    gsap.timeline()
                        .to(currentStep, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                        .set(currentStep, { display: 'none' })
                        .set(nextStep, { display: 'block' })
                        .to(nextStep, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
                }
            }
        });
    });
    
    // Handle Back button clicks
    backButtons.forEach(backButton => {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Find the current step (parent of the button)
            let currentStep = null;
            let currentStepIndex = -1;
            
            steps.forEach((step, index) => {
                if (step.contains(backButton)) {
                    currentStep = step;
                    currentStepIndex = index;
                }
            });
            
            if (currentStep && currentStepIndex > 0) {
                // Get previous step
                const prevStep = steps[currentStepIndex - 1];
                
                // Update step indicators
                const currentIndicator = stepIndicatorMap.get(currentStep);
                if (currentIndicator) {
                    currentIndicator.classList.remove('filled');
                }
                
                // Animate transition back to previous step
                gsap.timeline()
                    .to(currentStep, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                    .set(currentStep, { display: 'none' })
                    .set(prevStep, { display: 'block' })
                    .to(prevStep, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
            }
        });
    });
    
    // Get all required fields in a step
    function getRequiredFieldsInStep(step) {
        const fields = [];
        
        // Look for inputs with aria-required="true"
        const ariaRequiredInputs = step.querySelectorAll('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]');
        ariaRequiredInputs.forEach(input => fields.push(input));
        
        // Look for inputs with required attribute
        const requiredInputs = step.querySelectorAll('input[required], select[required], textarea[required]');
        requiredInputs.forEach(input => {
            if (!fields.includes(input)) {
                fields.push(input);
            }
        });
        
        // Look for inputs with class containing "required"
        const classRequiredInputs = step.querySelectorAll('input.wpcf7-validates-as-required, select.wpcf7-validates-as-required, textarea.wpcf7-validates-as-required');
        classRequiredInputs.forEach(input => {
            if (!fields.includes(input)) {
                fields.push(input);
            }
        });
        
        return fields;
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
        fields.forEach(field => {
            // Get the field's parent element (could be the input itself or a span/div containing it)
            const fieldParent = field.closest('span') || field.parentNode;
            
            // For select elements, check if a non-default option is selected
            if (field.tagName === 'SELECT') {
                // Skip validation if field is not required
                if (!isFieldRequired(field)) return;
                
                const hasSelectedOption = field.selectedIndex > 0;
                const hasValue = field.value && field.value !== "" && !field.value.includes("Select");
                
                if (!hasSelectedOption || !hasValue) {
                    isValid = false;
                    addErrorStyling(field, fieldParent, "Please select an option");
                }
            }
            // For checkbox and radio inputs
            else if (field.type === 'checkbox' || field.type === 'radio') {
                // Skip validation if field is not required
                if (!isFieldRequired(field)) return;
                
                if (!field.checked) {
                    isValid = false;
                    addErrorStyling(field, fieldParent, "This field is required");
                }
            }
            // For all other input types
            else {
                // Skip validation if field is not required
                if (!isFieldRequired(field)) return;
                
                if (!field.value.trim()) {
                    isValid = false;
                    addErrorStyling(field, fieldParent, "This field is required");
                }
                
                // Email validation
                if (field.type === 'email' && field.value.trim()) {
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailPattern.test(field.value.trim())) {
                        isValid = false;
                        addErrorStyling(field, fieldParent, "Please enter a valid email address");
                    }
                }
                
                // Phone validation
                if ((field.type === 'tel' || field.name.includes('phone') || field.name.includes('tel')) && field.value.trim()) {
                    const phonePattern = /^[0-9\+\-\(\)\s]+$/;
                    if (!phonePattern.test(field.value.trim())) {
                        isValid = false;
                        addErrorStyling(field, fieldParent, "Please enter a valid phone number");
                    }
                }
                
                // Confirm email validation
                if (field.name.includes('confirm_email') && field.value.trim()) {
                    const emailField = form.querySelector('input[name="email"], input[name*="email"]:not([name*="confirm"])');
                    if (emailField && field.value !== emailField.value) {
                        isValid = false;
                        addErrorStyling(field, fieldParent, "Email addresses do not match");
                    }
                }
            }
        });
        
        return isValid;
    }
    
    // Check if a field is really required
    function isFieldRequired(field) {
        return (
            field.hasAttribute('required') || 
            field.getAttribute('aria-required') === 'true' ||
            field.classList.contains('wpcf7-validates-as-required')
        );
    }
    
    // Add error styling and message to a field
    function addErrorStyling(field, fieldParent, errorText) {
        // Add error class to the input
        field.classList.add('input-error');
        
        // Create error message element
        const errorMessage = document.createElement('span');
        errorMessage.className = 'form-error-message';
        errorMessage.textContent = errorText;
        errorMessage.style.opacity = '0';
        
        // Insert error message after the field or its parent
        fieldParent.appendChild(errorMessage);
        
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
    
    // Handle form submission
    const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            // Only prevent default if this is not a WP Contact Form 7
            if (!form.classList.contains('wpcf7-form')) {
                e.preventDefault();
            }
            
            // Find the current step (the one containing the submit button)
            const currentStep = steps.find(step => step.contains(submitButton));
            if (!currentStep) return;
            
            // Get all required fields in the final step
            const requiredFields = getRequiredFieldsInStep(currentStep);
            
            // Validate all required fields
            const isValid = validateRequiredFields(requiredFields);
            
            if (isValid && !form.classList.contains('wpcf7-form')) {
                // In case of a non-CF7 form, you can add your own submission logic here
                alert('Form submitted successfully!');
                
                // Reset the form to first step
                resetFormToFirstStep();
            }
        });
    }
    
    // Integrate with Contact Form 7 if present
    if (typeof document.addEventListener === 'function') {
        document.addEventListener('wpcf7invalid', function(event) {
            // Don't let CF7 handle invalid fields if we're on a multi-step form
        });
        
        document.addEventListener('wpcf7mailsent', function() {
            // Reset form to first step on successful submission
            resetFormToFirstStep();
        });
    }
    
    // Reset form to first step
    function resetFormToFirstStep() {
        // Reset step indicators
        stepIndicators.forEach((indicator, index) => {
            if (index > 0) {
                indicator.classList.remove('filled');
            }
        });
        
        // Find current visible step
        const currentStep = steps.find(step => getComputedStyle(step).display !== 'none');
        if (!currentStep || currentStep === steps[0]) return;
        
        // Animate back to first step
        gsap.timeline()
            .to(currentStep, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
            .set(currentStep, { display: 'none' })
            .set(steps[0], { display: 'block' })
            .to(steps[0], { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
        
        // Reset all inputs with slight delay
        gsap.delayedCall(0.5, function() {
            form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea, select').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
                
                // Reset select elements to first option
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                }
            });
        });
    }
    
    // Add CSS for error styling
    if (!document.getElementById('multi-step-form-styles')) {
        const style = document.createElement('style');
        style.id = 'multi-step-form-styles';
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
}

// Initialize the form when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMultiStepForm);
} else {
    initMultiStepForm();
}

// Функция инициализации страницы входа
function initLoginPage() {
    const loginContainer = document.getElementById('login-form-container');
    const recoveryContainer = document.getElementById('recovery-form-container');
    const showRecoveryBtn = document.getElementById('show-recovery');
    const showLoginBtn = document.getElementById('show-login');
    const showContactBtn = document.getElementById('show-contact');
    const contactPopup = document.getElementById('contact-popup');
    const closePopupBtn = document.querySelector('.close-popup');
    
    // Убеждаемся, что форма восстановления изначально скрыта
    if (recoveryContainer) {
        // Скрываем форму восстановления с помощью GSAP
        gsap.set(recoveryContainer, { 
            autoAlpha: 0, 
            display: 'none' 
        });
    }
    
    // Скрываем попап контактов
    if (contactPopup) {
        gsap.set(contactPopup, {
            autoAlpha: 0,
            display: 'none'
        });
    }
    
    // Если элементы для переключения форм существуют
    if (showRecoveryBtn && showLoginBtn && loginContainer && recoveryContainer) {
        // Кнопка "Проблемы с авторизацией?"
        showRecoveryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скрываем форму входа и показываем форму восстановления
            gsap.to(loginContainer, {
                autoAlpha: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.out",
                onComplete: function() {
                    gsap.set(loginContainer, { display: 'none' });
                    gsap.set(recoveryContainer, { display: 'block', y: 20 });
                    
                    // Анимируем появление формы восстановления
                    gsap.to(recoveryContainer, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
        });
        
        // Кнопка "Войти в кабинет" (возврат к форме входа)
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Скрываем форму восстановления и показываем форму входа
            gsap.to(recoveryContainer, {
                autoAlpha: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.out",
                onComplete: function() {
                    gsap.set(recoveryContainer, { display: 'none' });
                    gsap.set(loginContainer, { display: 'block', y: 20 });
                    
                    // Анимируем появление формы входа
                    gsap.to(loginContainer, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
        });
    }
    
    // Обработчики для попапа "Свяжитесь с нами"
    if (showContactBtn && contactPopup && closePopupBtn) {
        // Открытие попапа
        showContactBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Показываем попап с анимацией
            gsap.set(contactPopup, { display: 'flex' });
            gsap.fromTo(contactPopup, 
                { autoAlpha: 0, scale: 0.9 }, 
                { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" }
            );
        });
        
        // Закрытие попапа
        closePopupBtn.addEventListener('click', function() {
            gsap.to(contactPopup, {
                autoAlpha: 0,
                scale: 0.9,
                duration: 0.3,
                ease: "power2.in",
                onComplete: function() {
                    gsap.set(contactPopup, { display: 'none' });
                }
            });
        });
        
        // Закрытие по клику вне попапа
        contactPopup.addEventListener('click', function(e) {
            if (e.target === contactPopup) {
                gsap.to(contactPopup, {
                    autoAlpha: 0,
                    scale: 0.9,
                    duration: 0.3,
                    ease: "power2.in",
                    onComplete: function() {
                        gsap.set(contactPopup, { display: 'none' });
                    }
                });
            }
        });
    }
    
    // Валидация формы входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const userLogin = document.getElementById('user_login');
            const userPass = document.getElementById('user_pass');
            
            if (!userLogin.value || !userPass.value) {
                e.preventDefault();
                
                // Анимация тряски формы при ошибке
                gsap.to(loginForm, {
                    x: [-10, 10, -8, 8, -5, 5, 0],
                    duration: 0.5,
                    ease: "power2.out"
                });
                
                alert('Пожалуйста, заполните все поля');
            }
        });
    }
    
    // Валидация формы восстановления пароля
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', function(e) {
            const userEmail = document.getElementById('user_email');
            
            if (!userEmail.value) {
                e.preventDefault();
                
                // Анимация тряски формы при ошибке
                gsap.to(recoveryForm, {
                    x: [-10, 10, -8, 8, -5, 5, 0],
                    duration: 0.5,
                    ease: "power2.out"
                });
                
                alert('Пожалуйста, введите email или логин');
            }
        });
    }
    
    // Валидация формы контактов
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Здесь можно добавить отправку формы через AJAX
            alert('Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.');
            
            // Закрываем попап
            gsap.to(contactPopup, {
                autoAlpha: 0,
                scale: 0.9,
                duration: 0.3,
                ease: "power2.in",
                onComplete: function() {
                    gsap.set(contactPopup, { display: 'none' });
                    contactForm.reset(); // Сбрасываем форму
                }
            });
        });
    }
    
    // Обработка ошибок авторизации
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') && urlParams.get('login') === 'failed') {
        alert('Неверный логин или пароль. Пожалуйста, попробуйте снова.');
    }
}

// Функция для переключения видимости пароля
function togglePasswordVisibility() {
    const passwordField = document.getElementById('user_pass');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordField && toggleIcon) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.classList.add('visible');
        } else {
            passwordField.type = 'password';
            toggleIcon.classList.remove('visible');
        }
    }
}