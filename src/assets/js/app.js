initPageTransitions();

function initPageTransitions() {
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
                // Content fade-out animation
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
            },
            async enter({ next }) {
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

    // $('.reviews__slider').slick({
    //     slidesToShow: 5,
    //     slidesToScroll: 1,
    //     centerMode: true,
    //     // autoplay: true,
    //     // autoplaySpeed: 2000,
    //     // infinite: true,
    //     cssEase: 'ease-in-out',
    //     appendDots: jQuery('.custom-dots-container'),
    // });

    // $(document).ready(function(){
    //     // Подготовка видео перед инициализацией слайдера
    //     $('.reviews__item video').each(function() {
    //         var video = $(this);
            
    //         // Устанавливаем дефолтный постер для сохранения высоты
    //         // Для дефолтного постера используем общий плейсхолдер
    //         var defaultPoster = 'assets/img/reviews-video-poster.png'; // Путь к дефолтному изображению
    //         video.attr('poster', defaultPoster);
            
    //         // Добавляем возможность воспроизведения по клику
    //         video.on('click', function() {
    //             // Получаем индекс текущего слайда
    //             var slideIndex = video.closest('.slick-slide').data('slick-index');
                
    //             // Сначала перемещаем слайдер к этому слайду для центрирования
    //             $('.reviews__slider').slick('slickGoTo', slideIndex);
                
    //             // Добавляем небольшую задержку для завершения анимации перемещения
    //             setTimeout(function() {
    //                 if (video[0].paused) {
    //                     // Останавливаем все остальные видео
    //                     $('.reviews__item video').not(video).each(function() {
    //                         this.pause();
    //                         $(this).closest('.reviews__item').removeClass('video-is-playing');
    //                     });
                        
    //                     // Воспроизводим текущее видео
    //                     video[0].play();
    //                     video.closest('.reviews__item').addClass('video-is-playing');
    //                 } else {
    //                     // Ставим на паузу текущее видео
    //                     video[0].pause();
    //                     video.closest('.reviews__item').removeClass('video-is-playing');
    //                 }
    //             }, 300); // Время, необходимое для завершения анимации slickGoTo
    //         });
    //     });
        
    //     // Инициализация слайдера с оптимальными настройками
    //     $('.reviews__slider').slick({
    //         dots: true,
    //         // infinite: true,
    //         speed: 500,
    //         slidesToShow: 5,
    //         centerMode: true,
    //         slidesToScroll: 1,
    //         adaptiveHeight: false, // Отключаем, чтобы не терять высоту
    //         lazyLoad: 'ondemand',
    //         prevArrow: '<button type="button" class="slick-prev">Previous</button>',
    //         nextArrow: '<button type="button" class="slick-next">Next</button>',
    //         responsive: [
    //             {
    //                 breakpoint: 1200,
    //                 settings: {
    //                     slidesToShow: 3,
    //                     centerMode: true
    //                 }
    //             },
    //             {
    //                 breakpoint: 768,
    //                 settings: {
    //                     slidesToShow: 1,
    //                     centerMode: true,
    //                     arrows: false
    //                 }
    //             }
    //         ]
    //     });
        
    //     // Остановка видео при переключении слайдов
    //     $('.reviews__slider').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
    //         // Находим текущий слайд
    //         var currentSlideElement = $(slick.$slides[currentSlide]);
            
    //         // Останавливаем видео на текущем слайде
    //         currentSlideElement.find('video').each(function() {
    //             this.pause();
    //             $(this).closest('.reviews__item').removeClass('video-is-playing');
    //         });
    //     });
        
    //     // Функция ленивой загрузки постеров
    //     function loadPostersForVisibleSlides(slick, currentSlide) {
    //         // Определяем индексы видимых слайдов (текущий, пред, след)
    //         var slidesToLoad = [currentSlide];
            
    //         // Добавляем предыдущий и следующий слайды в очередь загрузки
    //         if (currentSlide > 0) slidesToLoad.push(currentSlide - 1);
    //         if (currentSlide < slick.slideCount - 1) slidesToLoad.push(currentSlide + 1);
            
    //         // Загружаем постеры для видимых слайдов
    //         $.each(slidesToLoad, function(i, slideIndex) {
    //             var slide = $(slick.$slides[slideIndex]);
    //             var video = slide.find('video');
                
    //             if (video.length > 0 && !video.attr('data-loaded')) {
    //                 var poster = video.data('poster');
                    
    //                 if (poster) {
    //                     // Предзагрузка изображения
    //                     var img = new Image();
    //                     img.onload = function() {
    //                         // Полностью удаляем предыдущий постер и устанавливаем новый
    //                         video.removeAttr('poster');
                            
    //                         // Небольшая задержка для гарантированного сброса кэша браузера
    //                         setTimeout(function() {
    //                             video.attr('poster', poster);
    //                             video.attr('data-loaded', 'true');
                                
    //                             console.log('Постер загружен: ' + poster);
                                
    //                             // Обновляем слайдер
    //                             slick.setPosition();
    //                         }, 10);
    //                     };
    //                     img.onerror = function() {
    //                         console.error('Ошибка загрузки постера: ' + poster);
    //                         // Оставляем дефолтный постер в случае ошибки
    //                     };
    //                     img.src = poster;
    //                 }
    //             }
    //         });
    //     }
        
    //     // Загружаем постеры для всех слайдов сразу после инициализации слайдера
    //     // с небольшой задержкой, чтобы страница успела загрузиться
    //     setTimeout(function() {
    //         var slickInstance = $('.reviews__slider').slick('getSlick');
            
    //         // Загружаем постеры для всех слайдов
    //         for (var i = 0; i < slickInstance.slideCount; i++) {
    //             loadPostersForVisibleSlides(slickInstance, i);
    //         }
            
    //         console.log('Запущена загрузка всех постеров');
    //     }, 500); // Увеличиваем задержку для гарантированной загрузки страницы
        
    //     // Добавляем метод принудительного обновления постеров 
    //     // для случаев, когда автоматическая замена не сработала
    //     function forceRefreshPosters() {
    //         var slickInstance = $('.reviews__slider').slick('getSlick');
            
    //         // Получаем все видео элементы
    //         $('.reviews__item video').each(function() {
    //             var video = $(this);
                
    //             if (video.data('poster')) {
    //                 // Сначала удаляем постер, затем добавляем заново
    //                 var poster = video.data('poster');
    //                 video.removeAttr('poster');
                    
    //                 setTimeout(function() {
    //                     video.attr('poster', poster);
    //                 }, 10);
    //             }
    //         });
            
    //         // Обновляем слайдер
    //         setTimeout(function() {
    //             slickInstance.setPosition();
    //         }, 100);
    //     }
        
    //     // Запускаем принудительное обновление через 1 секунду
    //     setTimeout(forceRefreshPosters, 1000);
    //     // И еще раз через 2 секунды для надежности
    //     setTimeout(forceRefreshPosters, 2000);
    // });

    // const $slider = jQuery('.reviews__slider');

    // Инициализация slick
//     $slider.slick({
//         dots: true,
//         infinite: true,
//         slidesToShow: 1,
//         slidesToScroll: 1,
//         centerMode: true,
//         centerPadding: '0px',
//         speed: 500,
//         variableWidth: true,
//         cssEase: 'ease-in-out',
//         appendDots: jQuery('.custom-dots-container'),
//         prevArrow: '<div class="prev-arrow">...</div>',
//         nextArrow: '<div class="next-arrow">...</div>',
//         responsive: [
//             {
//                 breakpoint: 1024,
//                 settings: { slidesToShow: 2, slidesToScroll: 1 }
//             },
//             {
//                 breakpoint: 600,
//                 settings: { slidesToShow: 1, slidesToScroll: 1 }
//             }
//         ]
//     });

//     // Функция остановки всех видео
//     function pauseAllVideos() {
//         document.querySelectorAll('.review-video').forEach(video => {
//             video.pause();
//             video.currentTime = 0;
//         });
//     }

//     // Остановка видео при смене слайда
//     $slider.on('beforeChange', () => {
//         pauseAllVideos();
//     });

//     // Обработчик на кнопки Play
//     document.querySelectorAll('.play-button').forEach(button => {
//         button.addEventListener('click', event => {
//             const parentSlide = button.closest('.slider-item');

//             // Запрещаем воспроизведение на неактивных слайдах
//             if (!parentSlide.classList.contains('slick-active')) {
//                 event.preventDefault();
//                 event.stopPropagation();
//                 return;
//             }

//             const video = parentSlide.querySelector('.review-video');

//             if (video) {
//                 pauseAllVideos(); // Останавливаем все видео перед запуском нового

//                 video.play().then(() => {
//                     button.style.display = 'none';
//                 }).catch(error => console.error('Ошибка воспроизведения:', error));
//             }
//         });
//     });

//     // Обработчик на видео
//     document.querySelectorAll('.review-video').forEach(video => {
//         const button = video.closest('.slider-item').querySelector('.play-button');

//         video.addEventListener('click', () => {
//             if (!video.closest('.slider-item').classList.contains('slick-active')) {
//                 return;
//             }

//             if (video.paused) {
//                 pauseAllVideos(); // Останавливаем другие видео перед воспроизведением
//                 video.play().then(() => {
//                     button.style.display = 'none';
//                 }).catch(error => console.error('Ошибка воспроизведения:', error));
//             } else {
//                 video.pause();
//             }
//         });

//         video.addEventListener('pause', () => {
//             button.style.display = 'block';
//         });

//         video.addEventListener('play', () => {
//             button.style.display = 'none';
//         });
//     });
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