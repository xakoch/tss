initPageTransitions();

function initPageTransitions() {
    // Перед началом перехода скроллим страницу наверх
    barba.hooks.before(() => {
        window.scrollTo({ top: 0 });
    });

    barba.init({
        sync: false, // Лучше отключить sync для корректных анимаций
        debug: false,
        timeout: 7000,
        transitions: [{
            name: 'default',
            once({ next }) {
                // Инициализация при первой загрузке
                updateBodyClass(next.html);
                initScript();
            },
            async leave(data) {
                // Анимация исчезновения контента
                initBarbaNavUpdate(data);
                await gsap.to(data.current.container, {
                    opacity: 0,
                    duration: 0.5
                });
                data.current.container.remove();
            },
            async enter({ next }) {
                // Анимация появления контента
                updateBodyClass(next.html);
                return gsap.from(next.container, {
                    opacity: 0,
                    duration: 0.5
                });
            },
            async beforeEnter({ next }) {
                updateBodyClass(next.html);
                initScript();
            },
        }]
    });
}

/**
 * Обновляет класс <body> на основе нового HTML-кода
 */
function updateBodyClass(html) {
    const matches = html.match(/<body.+?class="([^"]*)"/i);
    document.body.setAttribute('class', matches ? matches[1] : '');
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
    initBarbaNavUpdate();
    initWindowInnerheight();
    initSwiperSlider();
    initHomePage();
}

/**
 * Обновляет атрибуты элементов с data-barba-update
 */
function initBarbaNavUpdate(data) {
    if (!data || !data.next.html) return;

    const updateItems = $(data.next.html).find('[data-barba-update]');

    $('[data-barba-update]').each(function (index) {
        if ($(updateItems[index]).length > 0) {
            const newLinkStatus = $(updateItems[index]).attr('data-link-status');
            $(this).attr('data-link-status', newLinkStatus);
        }
    });
}

/**
 * Устанавливает CSS-переменную для мобильных устройств
 */
function initWindowInnerheight() {
    $(document).ready(() => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Находим все ссылки, которые ведут к якорям
        const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    // Получаем позицию элемента
                    const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;

                    // Плавный скролл к элементу
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    });
}

/**
 * Swiper Slider
 */
function initSwiperSlider() {

    // var heroSlide = new Swiper(".hero__slider", {
    //     slidesPerView: 1,
    //     loop: true,
    //     lazy: true,
    //     pauseOnMouseEnter: true,
    //     pagination: {
    //         el: ".swiper-pagination",
    //         clickable: true,
    //         renderBullet: function (index, className) {
    //             return '<span class="' + className + '">' + (index + 1) + '</span>';
    //         }
    //     },
    //     navigation: {
    //         nextEl: ".btn-next",
    //         prevEl: ".btn-prev",
    //     },
    //     autoplay: {
    //         delay: 3000,
    //         disableOnInteraction: true
    //     }
    // });

    // $('.hero').mouseenter(function() {
    //     heroSlide.autoplay.stop();
    // });

    // $('.hero').mouseleave(function() {
    //     heroSlide.autoplay.start();
    // });

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


/**
 * Home page
 */
function initHomePage() {

    // ===================================
    // Economy block slider
    // ===================================

    document.querySelectorAll(".slider-block").forEach((block) => {
        const track = block.querySelector(".slider-track");
        const slides = block.querySelectorAll(".slider-slide");
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
            track.style.transform = `translateX(-${index * slideWidth}px)`;
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
            }, 3500); // 2.5 seconds
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
        controlsContainer.querySelector(".slider-button").classList.add("active");
        
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
    });

    // ===================================
    // Economy Number Animation 
    // ===================================

    const numberElements = document.querySelectorAll(".custom-count-number");

    if (numberElements.length === 0) return;

    const parseNumberAndSymbol = (text) => {
        const match = text.trim().match(/^([\d,]+)(\s*[<%]?)$/); // Учитываем возможный пробел перед "<" или "%"
        if (!match) return null;

        return {
            number: parseInt(match[1].replace(/,/g, ""), 10), // Убираем запятые
            suffix: match[2] || "", // Храним "<", "%" или пустую строку БЕЗ ИЗМЕНЕНИЙ
        };
    };

    const animateNumber = (element, finalNumber, suffix) => {
        let currentNumber = 0;
        const duration = 2000; // Длительность анимации (мс)
        const frameRate = 30; // Количество кадров в секунду
        const totalFrames = (duration / 1000) * frameRate;
        const increment = finalNumber / totalFrames;

        element.style.opacity = "1"; // Делаем заголовок видимым

        const updateNumber = () => {
            currentNumber += increment;
            if (currentNumber >= finalNumber) {
                currentNumber = finalNumber;
                clearInterval(animation);
            }
            element.textContent = `${Math.floor(currentNumber).toLocaleString("en-US")}${suffix}`;
        };

        const animation = setInterval(updateNumber, 1000 / frameRate);
    };

    const onScroll = () => {
        numberElements.forEach((element) => {
            const data = parseNumberAndSymbol(element.textContent);
            if (!data) return;

            const { number, suffix } = data;
            const blockPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (blockPosition < windowHeight * 0.75 && !element.dataset.animated) {
                element.dataset.animated = "true"; // Отмечаем как анимированный
                animateNumber(element, number, suffix);
            }
        });
    };
    window.addEventListener("scroll", onScroll);

    // ===================================
    // Typecard Tabs
    // ===================================

    const tabs = document.querySelectorAll('.typecard__tab');
    const tabContents = document.querySelectorAll('.typecard__content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('typecard__tab_active'));
            
            // Add active class to clicked tab
            this.classList.add('typecard__tab_active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('typecard__content_active'));
            
            // Show selected tab content
            const activeContent = tabId === 'debit' ? document.getElementById('debit-content') : document.getElementById('credit-content');
            activeContent.classList.add('typecard__content_active');
        });
    });

}