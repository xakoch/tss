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

    var economySlide = new Swiper(".economy__slider", {
        slidesPerView: 1,
        // loop: true,
        pagination: {
            el: ".swiper-pagination",
        },
        // autoplay: {
        //     delay: 2500,
        //     disableOnInteraction: true
        // }
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