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
                },
                async leave(data) {
                    try {
                        // Content fade-out animation
                        if (data && data.current && data.current.container) {
                            initBarbaNavUpdate(data);
                            
                            // Use Web Animation API instead of GSAP
                            const animation = data.current.container.animate([
                                { opacity: 1 },
                                { opacity: 0 }
                            ], {
                                duration: 500, // 500ms = 0.5 seconds
                                easing: 'ease'
                            });
                            
                            // Wait for animation to complete
                            await animation.finished;
                            data.current.container.remove();
                        }
                    } catch (error) {
                        console.error('Error in leave transition:', error);
                    }
                },
                async enter({ next }) {
                    try {
                        // Content fade-in animation
                        updateBodyClass(next.html);
                        
                        // Set initial state
                        next.container.style.opacity = '0';
                        
                        // Use Web Animation API
                        const animation = next.container.animate([
                            { opacity: 0 },
                            { opacity: 1 }
                        ], {
                            duration: 500,
                            easing: 'ease'
                        });
                        
                        // Update final state after animation
                        animation.onfinish = () => {
                            next.container.style.opacity = '1';
                        };
                        
                        return animation.finished;
                    } catch (error) {
                        console.error('Error in enter transition:', error);
                        // Установим непрозрачность напрямую в случае ошибки
                        next.container.style.opacity = '1';
                    }
                },
                async beforeEnter({ next }) {
                    updateBodyClass(next.html);
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
        initBarbaNavUpdate();
        initWindowInnerheight();
        initSwiperSlider();
        
        // Проверяем, находимся ли мы на домашней странице перед вызовом initHomePage
        if (isHomePage()) {
            initHomePage();
        }
        
        initCalc();
    } catch (error) {
        console.error('Error in initScript:', error);
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

        // Обрабатываем якорные ссылки
        const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
        
        if (anchorLinks.length > 0) {
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
        }
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
    } catch (error) {
        console.error('Error in initSwiperSlider:', error);
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
        // Economy Number Animation 
        // ===================================
        const numberElements = document.querySelectorAll(".custom-count-number");

        if (numberElements.length > 0) {
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
                let currentNumber = 0;
                const duration = 2000;
                const frameRate = 30;
                const totalFrames = (duration / 1000) * frameRate;
                const increment = finalNumber / totalFrames;

                element.style.opacity = "1";

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
                    try {
                        const data = parseNumberAndSymbol(element.textContent);
                        if (!data) return;

                        const { number, suffix } = data;
                        const blockPosition = element.getBoundingClientRect().top;
                        const windowHeight = window.innerHeight;

                        if (blockPosition < windowHeight * 0.75 && !element.dataset.animated) {
                            element.dataset.animated = "true";
                            animateNumber(element, number, suffix);
                        }
                    } catch (error) {
                        console.error('Error in number animation:', error);
                    }
                });
            };
            
            // Вызываем onScroll один раз для проверки элементов в пределах видимости при загрузке
            onScroll();
            window.addEventListener("scroll", onScroll);
        }

        // ===================================
        // Typecard Tabs
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
                        
                        // Hide all tab contents
                        tabContents.forEach(content => content.classList.remove('typecard__content_active'));
                        
                        // Show selected tab content
                        const activeContent = tabId === 'debit' 
                            ? document.getElementById('debit-content') 
                            : document.getElementById('credit-content');
                            
                        if (activeContent) {
                            activeContent.classList.add('typecard__content_active');
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
                
            savingsAmount.textContent = `${formattedSavings}`;
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
            
            tooltip.style.left = `${offset}px`;
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