// Ждем загрузку DOM перед инициализацией Barba
document.addEventListener('DOMContentLoaded', function() {
    // Глобальный обработчик неперехваченных Promise ошибок
    window.addEventListener('unhandledrejection', function(event) {
        console.warn('Unhandled promise rejection:', event.reason);
        // event.preventDefault(); // Осторожно с этим, может скрыть проблемы
    });

    // Проверяем, загружен ли Barba.js
    if (typeof barba !== 'undefined') {
        initPageTransitions();
    } else {
        console.warn('Barba.js not found. Initializing script directly.');
        // Передаем document.body как контекст для первой загрузки без Barba
        initScript(document.body); // Изменено для передачи контекста
    }
});

// Инициализация Lenis для плавного скролла (ваш код)
let lenis;
function initLenis() {
    try {
        if (typeof Lenis === 'undefined') {
            console.warn('Lenis not found');
            return;
        }
        if (lenis) {
            lenis.destroy();
        }
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
        function raf(time) {
            if (lenis) lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
        if (anchorLinks.length > 0) {
            anchorLinks.forEach(link => {
                // Для Barba.js и динамического контента, возможно, потребуется перепривязывать события
                // или использовать делегирование событий. Этот код будет работать для ссылок,
                // которые существуют на момент вызова initLenis.
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement && lenis) {
                        lenis.scrollTo(targetElement, {
                            offset: 0,
                            duration: 1.2,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                        });
                    } else if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
        // console.log('Lenis initialized successfully'); // Закомментировано для чистоты
    } catch (error) {
        console.error('Error in initLenis:', error);
    }
}

// Инициализация Barba.js (ваш код с небольшими правками для контекста initScript)
function initPageTransitions() {
    try {
        barba.hooks.beforeLeave((data) => {
            if (typeof jQuery !== 'undefined' && typeof initBarbaNavUpdate === 'function') {
                initBarbaNavUpdate(data);
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        });

        barba.hooks.afterEnter((data) => {
            initScript(data.next.container); // <--- ПЕРЕДАЕМ КОНТЕКСТ
            if (typeof gsap !== 'undefined' && data.next.container) {
                 gsap.to(data.next.container, { opacity: 1, duration: 0.5, ease: 'power1.out' });
            } else if (data.next.container) {
                data.next.container.style.opacity = '1';
            }
        });

        barba.hooks.beforeEnter((data) => {
            if (data.next.container) {
                data.next.container.style.opacity = '0';
            }
            updateBodyClass(data.next.html);
            // Вызов initScript из вашего оригинального beforeEnter хука был здесь.
            // Теперь он вызывается в afterEnter для корректной работы с новым контейнером.
            // Если вам нужно что-то специфичное для beforeEnter, добавьте здесь.
            // Например, GSAP set для элементов новой страницы:
            if (typeof gsap !== 'undefined') {
                const header = data.next.container.querySelector('.header');
                const heroTitle = data.next.container.querySelector('.hero__title h1');
                if (header) gsap.set(header, { opacity: 0, y: -30 });
                if (heroTitle) gsap.set(heroTitle, { opacity: 0, y: 50 });
            }
        });

        barba.init({
            sync: false,
            debug: false,
            timeout: 7000,
            transitions: [{
                name: 'default',
                once({ next }) {
                    updateBodyClass(next.html);
                    initScript(next.container); // <--- ПЕРЕДАЕМ КОНТЕКСТ ДЛЯ ПЕРВОЙ ЗАГРУЗКИ
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
                        if (data && data.current && data.current.container) {
                            // initBarbaNavUpdate(data); // Уже вызван в beforeLeave
                            if (typeof gsap !== 'undefined') {
                                await gsap.to(data.current.container, {
                                    opacity: 0,
                                    duration: 0.3, // Изменено с 0.5
                                    ease: 'power1.in', // Изменено с power1.out
                                });
                                // data.current.container.remove(); // Обычно не нужно при sync: false
                            } else {
                                data.current.container.style.opacity = '0';
                                await delay(300); // Изменено с 500
                                // data.current.container.remove(); // Обычно не нужно
                            }
                        }
                    } catch (error) {
                        console.error('Error in leave transition:', error);
                        // return Promise.resolve(); // Не нужно, если функция async
                    }
                },
                async enter({ next }) { // Этот хук может быть не нужен, если afterEnter + gsap.to достаточно
                    // Анимация появления теперь в основном управляется хуком afterEnter
                    // Если здесь была специфичная для GSAP Timeline анимация, ее нужно вернуть или адаптировать
                    // Пример из вашего кода (адаптирован):
                    try {
                        // updateBodyClass(next.html); // Уже в beforeEnter
                        // next.container.style.opacity = '0'; // Уже в beforeEnter
                        if (typeof gsap !== 'undefined') {
                            // Эта сложная анимация может конфликтовать с простым gsap.to в afterEnter.
                            // Выберите один подход. Если оставляете эту, то gsap.to в afterEnter может быть не нужен.
                            const tl = gsap.timeline({
                                onComplete: () => { /* resolve() был для Promise, здесь не нужен */ }
                            });
                            tl.to(next.container, {
                                opacity: 1, // Убедимся, что opacity анимируется
                                duration: 0.5,
                                ease: 'power1.out',
                                // clearProps: 'opacity' // Осторожно с clearProps, может конфликтовать
                            });
                            const header = next.container.querySelector('.header');
                            const heroTitle = next.container.querySelector('.hero__title h1');
                            if (header) {
                                tl.to(header, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.3");
                            }
                            if (heroTitle) {
                                tl.to(heroTitle, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.5");
                            }
                        } else {
                            // next.container.style.opacity = '1'; // Управляется хуком afterEnter
                        }
                    } catch (error) {
                        console.error('Error in enter transition:', error);
                        if(next.container) next.container.style.opacity = '1';
                    }
                },
                // beforeEnter из вашего кода (часть gsap.set) перенесена в глобальный beforeEnter хук
            }]
        });
    } catch (error) {
        console.error('Error in initPageTransitions:', error);
        initScript(document.body); // Фоллбэк
    }
}

// Ваши существующие функции (без изменений, если не указано иное)
function updateBodyClass(html) {
    try {
        if (!html) return;
        const matches = html.match(/<body.+?class="([^"]*)"/i);
        document.body.className = matches ? matches[1] : '';
    } catch (error) {
        console.error('Error in updateBodyClass:', error);
    }
}

function delay(n = 2000) {
    return new Promise(done => setTimeout(done, n));
}

function initBarbaNavUpdate(data) {
    try {
        if (typeof jQuery === 'undefined' || !data || !data.next || !data.next.html) return;
        const $ = jQuery;
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

function initWindowInnerheight() {
    try {
        // Предпочитаем Vanilla JS, если jQuery не обязателен
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => { // Обновляем при ресайзе
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });
    } catch (error) {
        console.error('Error in initWindowInnerheight:', error);
    }
}

// Главная функция инициализации, ТЕПЕРЬ ПРИНИМАЕТ КОНТЕКСТ
function initScript(contextElement = document.body) { // contextElement по умолчанию document.body
    // console.log('initScript called with context:', contextElement === document.body ? 'document.body' : 'Barba container');
    try {
        // Lenis инициализируется один раз, если еще не был.
        // Если Lenis должен реагировать на изменение высоты контента после Barba,
        // может потребоваться lenis.resize() или подобный метод.
        if (!lenis) {
            initLenis();
        }

        // Ваши существующие вызовы функций, адаптированные для работы с contextElement, если это необходимо.
        // Функции, которые ищут элементы глобально (например, document.querySelector), могут не нуждаться в contextElement.
        // Функции, которые должны работать только с элементами внутри нового контейнера Barba, должны использовать contextElement.

        // initBarbaNavUpdate(); // Вызывается из хука Barba
        initWindowInnerheight(); // Глобальная, вызывается один раз или при ресайзе

        // Функции, которые могут нуждаться в contextElement:
        initSwiperSlider(contextElement);
        initBtnMenuOpenClose(contextElement); // Если меню часть Barba-контейнера
        animateCommonElements(contextElement);

        setTimeout(() => {
            initDynamicVideoModal(contextElement);
        }, 100);

        const sliderBlocks = contextElement.querySelectorAll(".slider-block");
        if (sliderBlocks.length > 0) {
            initSliderBlocks(sliderBlocks); // Передаем NodeList
        }

        const tabs = contextElement.querySelectorAll('.typecard__tab');
        const tabContents = contextElement.querySelectorAll('.typecard__content');
        if (tabs.length > 0 && tabContents.length > 0) {
            initTypecardTabs(tabs, tabContents); // Передаем NodeList
        }

        if (isHomePage(contextElement)) { // isHomePage может также нуждаться в context
            initHomePage(contextElement);
        }

        initModals(contextElement);
        initCalc(contextElement);
        initMultiStepForm(contextElement);

        // initAnimNumbers теперь принимает NodeList
        const animNumberElements = contextElement.querySelectorAll(".anime-number");
        if (animNumberElements.length > 0) {
            initAnimNumbers(animNumberElements);
        }

        // ВАЖНО: Изменен вызов initVerification для передачи контекста
        initVerification(contextElement); // <--- ИЗМЕНЕННЫЙ ВЫЗОВ

        const loginPageElement = contextElement.querySelector('.login-page');
        if (loginPageElement) {
            initLoginPage(loginPageElement); // Передаем конкретный элемент
            // togglePasswordVisibility привязывается внутри initLoginPage
        }

    } catch (error) {
        console.error('Error in initScript:', error);
    }
}

/**
 * ВЕРИФИКАЦИЯ - ЕДИНАЯ ФУНКЦИЯ БЕЗ CF7 (ВАШ КОД)
 * Изменено для принятия contextElement и вызова новой initClientVerificationForm
 */
function initVerification(contextElement) { // <--- ДОБАВЛЕН contextElement
    const verificationSection = contextElement.querySelector('.verification-section'); // <--- ИСПОЛЬЗУЕМ contextElement
    const emptyDashboard = contextElement.querySelector('.verification-empty-dashboard'); // <--- ИСПОЛЬЗУЕМ contextElement

    if (emptyDashboard) {
        initVerificationEmptyDashboard(emptyDashboard); // <--- Передаем конкретный найденный элемент
    }

    if (verificationSection) {
        // initVerificationForm(); // ВАШ СТАРЫЙ ВЫЗОВ - ЗАКОММЕНТИРОВАН
        initClientVerificationForm(verificationSection); // <--- НОВЫЙ ВЫЗОВ AJAX ВЕРСИИ, передаем конкретный элемент
    }
}

// Ваша существующая initVerificationEmptyDashboard (добавлен параметр dashboardElement)
function initVerificationEmptyDashboard(dashboardElement) {
    if (!dashboardElement) return; // Если элемент не найден в текущем контексте
    const contactBtn = dashboardElement.querySelector('.contact-support-btn');
    if (contactBtn) {
        // Проверка, чтобы не навешивать обработчик многократно
        if (!contactBtn.dataset.handlerVedb) {
            contactBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const needHelp = document.querySelector('.need-assistance'); // Этот может быть глобальным
                if (needHelp) {
                    needHelp.scrollIntoView({ behavior: 'smooth' });
                }
            });
            contactBtn.dataset.handlerVedb = 'true';
        }
    }

    const actionCards = dashboardElement.querySelectorAll('.action-card');
    actionCards.forEach(function(card) {
        if (card.dataset.handlerVedb) return;
        const icon = card.querySelector('.action-icon');
        if (icon) {
            card.addEventListener('mouseenter', function() {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            });
            card.addEventListener('mouseleave', function() {
                icon.style.transform = 'scale(1)';
            });
        }
        card.dataset.handlerVedb = 'true';
    });
    // console.log('Verification Empty Dashboard Initialized'); // Закомментировано для чистоты
}

// Ваша существующая initVerificationForm (ОСТАВЛЕНА, но не будет вызываться, если initVerification вызывает initClientVerificationForm)
// Если вы хотите использовать эту старую версию, раскомментируйте ее вызов в initVerification и закомментируйте вызов initClientVerificationForm
/*
function initVerificationForm() {
    console.log('Initializing OLD verification form (non-AJAX)');

    // Закрытие алертов
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        const closeBtn = alert.querySelector('.close-alert');
        if (closeBtn && !closeBtn._handlerAdded) {
            closeBtn.addEventListener('click', function() {
                alert.style.transition = 'opacity 0.3s ease';
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.style.display = 'none';
                    }
                }, 300);
            });
            closeBtn._handlerAdded = true;
        }
    });

    // Обработка файлов
    const fileInputs = document.querySelectorAll('.verification-file-input');
    fileInputs.forEach(function(input) {
        if (input._handlerAdded) return;

        const uploadArea = input.closest('.document-upload-area');
        if (!uploadArea) return;

        const preview = uploadArea.querySelector('.file-preview');
        const uploadIcon = uploadArea.querySelector('.upload-icon');
        const dragText = uploadArea.querySelector('.drag-text');
        const fileHint = uploadArea.querySelector('.file-hint');
        const uploadLabel = uploadArea.querySelector('.upload-label');

        if (input.disabled) {
            if (uploadLabel) uploadLabel.classList.add('disabled-label');
            uploadArea.style.cursor = 'not-allowed';
            return;
        }

        input.addEventListener('change', function() {
            handleFileChange(this, uploadIcon, dragText, fileHint, preview);
            updateUploadButton();
        });

        setupDragAndDrop(uploadArea, input);
        input._handlerAdded = true;
    });

    // Обработка обычной HTML формы
    const form = document.querySelector('#verification-form'); // Убедитесь, что ID правильный
    if (form && !form._handlerAdded) {
        form.addEventListener('submit', function(e) {
            const uploadBtn = form.querySelector('#upload-button'); // Убедитесь, что ID правильный

            // Проверяем есть ли файлы
            let hasFiles = false;
            const activeInputs = form.querySelectorAll('.verification-file-input:not(:disabled)');

            activeInputs.forEach(function(input) {
                if (input.files && input.files.length > 0) {
                    hasFiles = true;
                }
            });

            if (!hasFiles) {
                e.preventDefault();
                alert('Пожалуйста, выберите хотя бы один файл для загрузки.'); // Перевести на англ.
                return false;
            }

            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...'; // Перевести
            }
        });
        form._handlerAdded = true;
    }
    updateUploadButton();
    // console.log('OLD Verification Form Initialized');
}
*/

// Ваши существующие handleFileChange, setupDragAndDrop, updateUploadButton
// ОСТАВЛЕНЫ, так как они используются вашей старой initVerificationForm.
// Если вы полностью переходите на AJAX-версию, их можно будет удалить.
function handleFileChange(input, uploadIcon, dragText, fileHint, preview) {
    const file = input.files[0];
    if (!uploadIcon || !dragText || !fileHint || !preview) return;
    if (file) {
        uploadIcon.style.display = 'none';
        dragText.textContent = file.name;
        dragText.style.display = 'block';
        fileHint.textContent = 'Нажмите для изменения файла'; // Перевести
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px; border-radius: 5px;">`; // Alt на англ.
                    preview.style.display = 'block';
                } catch (error) {
                    preview.innerHTML = '<div>File uploaded</div>'; // На англ.
                    preview.style.display = 'block';
                }
            };
            reader.onerror = function() {
                preview.innerHTML = '<div>File uploaded</div>'; // На англ.
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            let iconClass = 'fa-file';
            if (file.type === 'application/pdf') iconClass = 'fa-file-pdf';
            preview.innerHTML = `<i class="fas ${iconClass}" style="font-size: 48px; color: #0056b3;"></i>`;
            preview.style.display = 'block';
        }
    } else {
        uploadIcon.style.display = 'block';
        dragText.textContent = 'Перетащите файл сюда или нажмите для загрузки'; // Перевести
        dragText.style.display = 'block';
        fileHint.textContent = 'JPG, PNG или PDF (Макс 10МБ)'; // Перевести
        fileHint.style.display = 'block';
        preview.innerHTML = '';
        preview.style.display = 'none';
    }
}

function setupDragAndDrop(uploadArea, input) {
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!input.disabled) {
            this.style.borderColor = '#0056b3';
            this.style.backgroundColor = '#f8f9fa';
        }
    });
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#dee2e6';
        this.style.backgroundColor = 'transparent';
    });
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#dee2e6';
        this.style.backgroundColor = 'transparent';
        if (!input.disabled && e.dataTransfer && e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

function updateUploadButton() {
    const uploadBtn = document.querySelector('#upload-button'); // Убедитесь, что ID правильный
    if (!uploadBtn) return;
    let hasFiles = false;
    const activeInputs = document.querySelectorAll('.verification-file-input:not(:disabled)');
    activeInputs.forEach(function(input) {
        if (input.files && input.files.length > 0) {
            hasFiles = true;
        }
    });
    uploadBtn.disabled = !hasFiles;
}


// --- НАЧАЛО НОВОЙ ФУНКЦИИ ДЛЯ AJAX ЗАГРУЗКИ (initClientVerificationForm) ---
function initClientVerificationForm(verificationFormContainer) {
    // verificationFormContainer - это элемент .verification-section или .client-verification-area
    if (!verificationFormContainer) {
        // console.log('Client verification form container not found for AJAX init.');
        return;
    }
    // console.log('Initializing AJAX Client Verification Form Logic...');

    // Используем уникальный ID для глобальной области сообщений, если она нужна
    // или ищем ее внутри verificationFormContainer
    let globalMessageArea = verificationFormContainer.querySelector('#verification-global-message-area-ajax');
    if (!globalMessageArea) {
        globalMessageArea = document.createElement('div');
        globalMessageArea.id = 'verification-global-message-area-ajax';
        globalMessageArea.style.marginBottom = '20px';
        if (verificationFormContainer.firstChild) {
            verificationFormContainer.insertBefore(globalMessageArea, verificationFormContainer.firstChild);
        } else {
            verificationFormContainer.appendChild(globalMessageArea);
        }
    }


    function displayGlobalMessage(message, type = 'error') {
        if (!globalMessageArea) return; // Дополнительная проверка
        const alertClass = type === 'success' ? 'alert-success-vf-ajax' : 'alert-error-vf-ajax';
        const bgColor = type === 'success' ? '#e8f5e9' : '#ffebee'; // Зеленый для успеха, красный для ошибки
        const textColor = type === 'success' ? '#2e7d32' : '#c62828';

        globalMessageArea.innerHTML =
            `<div class="alert-vf-ajax ${alertClass}" style="padding:12px 15px; margin-bottom:20px; border-radius:4px; background-color:${bgColor}; color:${textColor}; border: 1px solid ${textColor};">
                ${message}
             </div>`;
        globalMessageArea.style.display = 'block';
        setTimeout(() => {
            if (globalMessageArea.firstChild) {
                globalMessageArea.firstChild.style.transition = 'opacity 0.5s ease';
                globalMessageArea.firstChild.style.opacity = '0';
                setTimeout(() => {
                    globalMessageArea.innerHTML = '';
                    globalMessageArea.style.display = 'none';
                }, 500);
            }
        }, 7000); // Сообщение исчезает через 7 секунд
    }

    const fileInputs = verificationFormContainer.querySelectorAll('.client-verification-file-input');
    fileInputs.forEach(input => {
        if (input.dataset.ajaxListenerAttached === 'true') return;
        input.dataset.ajaxListenerAttached = 'true';

        const uploadArea = input.closest('.document-upload-area-client');
        if (!uploadArea) {
            console.warn('Upload area not found for input:', input); // Добавлено для отладки
            return;
        }

        const docType = input.dataset.docType;
        // Ищем элементы относительно uploadArea или verificationFormContainer
        const previewElement = uploadArea.querySelector(`.file-preview-client`) || verificationFormContainer.querySelector(`#preview_${docType}`);
        const progressContainer = uploadArea.querySelector(`.upload-progress-client`) || verificationFormContainer.querySelector(`#progress_${docType}`);
        const progressBar = progressContainer ? progressContainer.querySelector('.progress-bar-client') : null;
        const messageElement = uploadArea.querySelector(`.upload-message-client`) || verificationFormContainer.querySelector(`#message_${docType}`);
        // Элемент для общего статуса документа (Approved, Rejected, Under Review)
        const statusTextElement = verificationFormContainer.querySelector(`#status-text-${docType}`);
        const uploadIconElement = uploadArea.querySelector('.upload-icon-client'); // Иконка для загрузки
        const uploadTextElement = uploadArea.querySelector('.upload-text-client'); // Текст типа "Click or drag"

        const label = uploadArea.querySelector('label[for="' + input.id + '"]');
        if (label) { // Или if (clickableArea)
            if (!label.dataset.customFileClickListener) { // Используем флаг на label
                label.addEventListener('click', function(event) {
                    // Если клик произошел НЕ по самому input (который может быть дочерним элементом label)
                    // и input не отключен.
                    if (event.target !== input && !input.disabled) {
                        // Если label имеет атрибут 'for', то браузер должен сам открыть диалог.
                        // Программный input.click() здесь может быть избыточен или вызывать конфликт.
                        // Попробуем сначала БЕЗ него.
                        // Если это не работает, то раскомментируйте input.click() и, возможно, event.preventDefault().

                        // event.preventDefault(); // Может предотвратить стандартное действие label и избежать двойного открытия
                        // input.click();      // Программный вызов, если стандартное поведение не срабатывает

                        // Если стандартное поведение label (через 'for') работает,
                        // то этот обработчик может быть даже не нужен, либо он должен только
                        // делать stopPropagation, если есть другие конфликтующие глобальные слушатели.
                    }
                });
                label.dataset.customFileClickListener = 'true';
            }
        }
        // Если вы используете всю uploadArea как кликабельную зону:
        else if (uploadArea && uploadArea.contains(input)) {
            if (!uploadArea.dataset.customFileClickListener) {
                uploadArea.addEventListener('click', function(event) {
                    if (event.target !== input && !input.disabled) {
                        // event.preventDefault(); // Экспериментируйте
                        input.click();
                    }
                });
                uploadArea.dataset.customFileClickListener = 'true';
            }
        }

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {e.preventDefault(); e.stopPropagation();}, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => { if (!input.disabled) uploadArea.style.borderColor = '#007bff';}, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => { if (!input.disabled) uploadArea.style.borderColor = '#ccc';}, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            if (input.disabled) return;
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                input.files = files; // Присваиваем файлы инпуту
                handleFileSelectionForAjax({ target: input }); // Вызываем обработчик
            }
        }, false);

        input.addEventListener('change', handleFileSelectionForAjax);

        function handleFileSelectionForAjax(event) {
            const file = event.target.files[0];

            if (messageElement) {
                messageElement.textContent = '';
                messageElement.className = 'upload-message-client'; // Сброс класса
            }
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';

            if (!file) {
                if (uploadTextElement) uploadTextElement.textContent = 'Click or drag file here';
                if (uploadIconElement) uploadIconElement.style.display = 'block';
                if (previewElement) previewElement.innerHTML = '';
                return;
            }

            // Валидация размера файла (10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                if (messageElement) {
                    messageElement.textContent = 'Error: File is too large (max 10MB).';
                    messageElement.className = 'upload-message-client error';
                }
                event.target.value = ''; // Очищаем инпут
                if (uploadTextElement) uploadTextElement.textContent = 'File too large. Try again.';
                if (uploadIconElement) uploadIconElement.style.display = 'block';
                if (previewElement) previewElement.innerHTML = '';
                return;
            }

            // Валидация типа файла
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                if (messageElement) {
                    messageElement.textContent = 'Error: Invalid file type (JPG, PNG, PDF only).';
                    messageElement.className = 'upload-message-client error';
                }
                event.target.value = '';
                if (uploadTextElement) uploadTextElement.textContent = 'Invalid type. Try again.';
                if (uploadIconElement) uploadIconElement.style.display = 'block';
                if (previewElement) previewElement.innerHTML = '';
                return;
            }

            if (previewElement) {
                 previewElement.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            }
            if (uploadTextElement) uploadTextElement.textContent = 'File selected.';
            if (uploadIconElement) uploadIconElement.style.display = 'none';

            // Автоматическая загрузка после выбора файла
            uploadFileViaAjax(file, event.target);
        }

        function uploadFileViaAjax(file, fileInputElement) {
            const requestId = fileInputElement.dataset.requestId;
            const currentDocType = fileInputElement.dataset.docType;
            const nonce = fileInputElement.dataset.nonce;

            if (!requestId || !currentDocType || !nonce) {
                console.error('Upload Error: Missing data attributes for AJAX.');
                if (messageElement) {
                    messageElement.textContent = 'Error: Upload configuration missing.';
                    messageElement.className = 'upload-message-client error';
                }
                return;
            }

            const formData = new FormData();
            formData.append('action', 'tss_upload_client_document');
            formData.append('request_id', requestId);
            formData.append('doc_type', currentDocType);
            formData.append('_ajax_nonce', nonce);
            formData.append('document_file', file);

            if (progressContainer) progressContainer.style.display = 'block';
            if (progressBar) progressBar.style.width = '0%';
            if (messageElement) {
                messageElement.textContent = 'Uploading...';
                messageElement.className = 'upload-message-client info';
            }

            const xhr = new XMLHttpRequest();
            const ajaxUrlToUse = (typeof tss_ajax_object !== 'undefined' && tss_ajax_object.ajax_url)
                ? tss_ajax_object.ajax_url
                : ((typeof ajaxurl !== 'undefined') ? ajaxurl : '/wp-admin/admin-ajax.php');
            xhr.open('POST', ajaxUrlToUse, true);

            xhr.upload.onprogress = function(event) {
                if (event.lengthComputable && progressBar) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.style.width = percentComplete.toFixed(0) + '%';
                }
            };

            xhr.onload = function() {
                if (progressContainer) setTimeout(() => { progressContainer.style.display = 'none'; }, 1500);
                if (progressBar) progressBar.style.width = '0%';

                if (xhr.status >= 200 && xhr.status < 400) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            if (messageElement) {
                                messageElement.textContent = response.data.message || 'Upload successful! Awaiting review.';
                                messageElement.className = 'upload-message-client success';
                            }
                            if (uploadTextElement) uploadTextElement.textContent = 'File changed. Re-upload if needed.';
                            if (uploadIconElement) uploadIconElement.style.display = 'block';

                            if (previewElement && response.data.doc_data && response.data.doc_data.file_name_original) {
                                previewElement.textContent = `Current: ${response.data.doc_data.file_name_original}`;
                            } else if (previewElement) {
                                 previewElement.textContent = `Current: ${file.name}`;
                            }

                            if (statusTextElement) {
                                statusTextElement.innerHTML = '<span style="background:#fff3e0; color:#e65100; padding:2px 8px; border-radius:10px; font-size:12px; display:inline-block;">Under Review</span>';
                            }
                            displayGlobalMessage('Document "' + (response.data.doc_data ? response.data.doc_data.file_name_original : file.name) + '" uploaded. It is now under review.', 'success');
                        } else {
                            if (messageElement) {
                                messageElement.textContent = 'Error: ' + (response.data.message || 'Upload failed.');
                                messageElement.className = 'upload-message-client error';
                            }
                            displayGlobalMessage('Error uploading "' + file.name + '": ' + (response.data.message || 'Unknown server error.'), 'error');
                        }
                    } catch (e) {
                        if (messageElement) {
                            messageElement.textContent = 'Error: Invalid server response.';
                            messageElement.className = 'upload-message-client error';
                        }
                         displayGlobalMessage('Error uploading "' + file.name + '": Invalid server response.', 'error');
                    }
                } else {
                    if (messageElement) {
                        messageElement.textContent = `Error: Upload failed (Status: ${xhr.status}).`;
                        messageElement.className = 'upload-message-client error';
                    }
                     displayGlobalMessage('Error uploading "' + file.name + `": Server error (Status ${xhr.status}).`, 'error');
                }
                fileInputElement.value = '';
            };

            xhr.onerror = function() {
                if (progressContainer) progressContainer.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
                if (messageElement) {
                    messageElement.textContent = 'Error: Network issue.';
                    messageElement.className = 'upload-message-client error';
                }
                fileInputElement.value = '';
                displayGlobalMessage('Error uploading "' + file.name + '": Network error.', 'error');
            };
            xhr.send(formData);
        }
    });
}
// --- КОНЕЦ НОВОЙ ФУНКЦИИ ДЛЯ AJAX ЗАГРУЗКИ ---


// Ваши остальные функции (initDynamicVideoModal, initModals, initBtnMenuOpenClose, и т.д.)
// остаются здесь без изменений, как в вашем исходном файле `download.js`.
// Для краткости я их не повторяю, но они должны быть здесь.
// Важно: убедитесь, что они также используют contextElement при поиске элементов,
// если они должны работать с динамическим контентом Barba.

function initDynamicVideoModal(context = document.body) { // Добавлен context, если модалка не глобальна
    const modalId = 'dynamic-video-modal';
    // Попытка найти модалку в текущем контексте или глобально
    let dynamicModal = context.querySelector('#' + modalId) || document.getElementById(modalId);

    if (!dynamicModal) { // Если модалки нет, создаем ее один раз глобально
        if (!document.getElementById(modalId)) { // Проверяем, не создана ли уже
            const modalHTML = `
                <div class="modal modal__reviews" id="dynamic-video-modal" style="display:none;">
                    <div class="modal__content">
                        <button class="modal__close" data-modal-close>✕</button>
                        <div class="video-container">
                            <div class="video-placeholder" style="display:flex; align-items:center; justify-content:center; min-height:200px; background:#f0f0f0;">
                                <div class="loader">Loading...</div>
                            </div>
                        </div>
                    </div>
                    <div class="modal__overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:-1;"></div>
                </div>`;
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer.firstElementChild);
            dynamicModal = document.getElementById(modalId); // Присваиваем созданную модалку
        } else {
             dynamicModal = document.getElementById(modalId); // Используем уже созданную
        }
    }

    if (!dynamicModal || dynamicModal.dataset.videoHandlerAttached === 'true') { // Если нет или уже настроена
        return;
    }

    const videoContainer = dynamicModal.querySelector('.video-container');
    const placeholder = dynamicModal.querySelector('.video-placeholder'); // Ищем внутри dynamicModal
    const closeButton = dynamicModal.querySelector('[data-modal-close]');
    const modalOverlay = dynamicModal.querySelector('.modal__overlay');

    let currentPlayer = null;

    function loadYouTubeAPI() {
        return new Promise((resolve, reject) => {
            try {
                if (!window.YT) {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api"; // HTTPS
                    tag.onerror = () => reject(new Error('Failed to load YouTube API script'));
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    if (firstScriptTag && firstScriptTag.parentNode) {
                        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                    } else { // Фоллбэк, если скриптов нет (маловероятно)
                        document.head.appendChild(tag);
                    }
                    window.onYouTubeIframeAPIReady = function() { resolve(); };
                    setTimeout(() => { if (!window.YT) reject(new Error('YouTube API load timeout')); }, 10000);
                } else {
                    resolve();
                }
            } catch (error) { reject(error); }
        });
    }

    // Вызываем загрузку API один раз
    if (!window.youtubeApiPromise) {
        window.youtubeApiPromise = loadYouTubeAPI();
        window.youtubeApiPromise.catch(error => console.warn('Failed to load YouTube API:', error));
    }


    function getVideoId(button) {
        if (button.hasAttribute('data-video-id')) return button.getAttribute('data-video-id');
        const modalIdAttr = button.getAttribute('data-modal-open'); // modalIdAttr, не modalId
        if (modalIdAttr) {
            const oldModal = document.getElementById(modalIdAttr); // Ищем по атрибуту
            if (oldModal) {
                const iframe = oldModal.querySelector('iframe');
                if (iframe && iframe.getAttribute('src')) return extractYouTubeId(iframe.getAttribute('src'));
            }
        }
        return null;
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/; // Обновленный регэксп
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function createYouTubePlayer(videoId) {
        const playerContainerId = 'youtube-player-dynamic-instance';
        let playerDiv = videoContainer.querySelector('#' + playerContainerId);
        if (playerDiv) playerDiv.remove(); // Удаляем старый div плеера

        placeholder.style.display = 'flex';
        placeholder.innerHTML = '<div class="loader">Loading...</div>';

        playerDiv = document.createElement('div');
        playerDiv.id = playerContainerId;
        videoContainer.appendChild(playerDiv);

        window.youtubeApiPromise.then(() => { // Используем сохраненный промис
            try {
                if (!YT.Player) { // Дополнительная проверка
                    console.error("YT.Player is not available");
                    placeholder.innerHTML = 'Error: YT.Player unavailable.';
                    return;
                }
                currentPlayer = new YT.Player(playerDiv.id, {
                    videoId: videoId,
                    playerVars: { 'autoplay': 1, 'modestbranding': 1, 'rel': 0, 'showinfo': 0, 'controls': 1, 'origin': window.location.origin },
                    events: {
                        'onReady': (event) => { placeholder.style.display = 'none'; },
                        'onError': (event) => { console.error(`Error loading video ${videoId}`, event); placeholder.innerHTML = 'Error loading video'; }
                    }
                });
            } catch (error) {
                console.error('Error creating YouTube player:', error);
                placeholder.innerHTML = 'Error creating player';
            }
        }).catch(error => {
            console.error('YouTube API not ready for createYouTubePlayer:', error);
            placeholder.innerHTML = 'Error: YouTube API failed to initialize.';
        });
    }

    function destroyPlayer() {
        if (currentPlayer && typeof currentPlayer.destroy === 'function') { // Проверка метода
            try {
                currentPlayer.stopVideo();
                currentPlayer.destroy();
            } catch (e) { console.warn('Error destroying player', e); }
            currentPlayer = null;
        }
    }

    function closeModal() {
        destroyPlayer();
        dynamicModal.classList.remove('is-active');
        dynamicModal.style.display = 'none';
        if (lenis && typeof lenis.start === 'function') {
            lenis.start();
        }
    }

    // Используем делегирование событий на body для кнопок открытия видео,
    // так как они могут появляться после загрузки страницы (например, через Barba)
    document.body.addEventListener("click", function(e) {
        const button = e.target.closest("[data-modal-open^='modal-reviews-']");
        if (button && dynamicModal) { // Убедимся, что dynamicModal существует
            e.preventDefault();
            const videoId = getVideoId(button);
            if (!videoId) { console.error('Video ID not found for button:', button); return; }
            createYouTubePlayer(videoId);
            dynamicModal.classList.add('is-active');
            dynamicModal.style.display = 'block';
            if (lenis && typeof lenis.stop === 'function') {
                lenis.stop();
            }
        }
    });

    if (closeButton) {
        closeButton.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
    }
    // Закрытие по клику на оверлей (фон)
    if (dynamicModal) { // Проверяем, что модалка найдена/создана
        const overlayElement = dynamicModal.querySelector('.modal__overlay') || dynamicModal; // Если нет .modal__overlay, сам .modal может быть оверлеем
        overlayElement.addEventListener('click', (e) => {
            if (e.target === overlayElement) { // Клик именно на оверлей, а не на контент внутри
                 e.preventDefault(); closeModal();
            }
        });
        dynamicModal.dataset.videoHandlerAttached = 'true';
    }


    // Глобальный слушатель Escape остается
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dynamicModal && dynamicModal.classList.contains('is-active')) {
            const closeBtn = dynamicModal.querySelector('[data-modal-close]');
            if(closeBtn) closeBtn.click(); // Имитируем клик по кнопке закрытия
        }
    });
}


function initModals(context = document.body) {
    try {
        // Lenis управляется глобально
        // const currentLenis = window.lenis;

        // Ищем кнопки открытия модальных окон в текущем контексте
        const openButtons = context.querySelectorAll("[data-modal-open]:not([data-modal-open^='modal-reviews-'])");
        // Модальные окна обычно глобальны, поэтому ищем в document
        const modals = document.querySelectorAll(".modal:not(#dynamic-video-modal)");

        openButtons.forEach(button => {
            if (button.dataset.modalHandlerAttached) return; // Предотвращаем дублирование
            button.addEventListener("click", (e) => {
                e.preventDefault();
                const modalId = button.getAttribute("data-modal-open");
                const targetModal = document.getElementById(modalId);
                if (targetModal) {
                    targetModal.classList.add('is-active');
                    targetModal.style.display = 'block'; // или 'flex', в зависимости от CSS
                    // console.log(`Modal ${modalId} opened`);
                    if (lenis && typeof lenis.stop === 'function') lenis.stop();
                }
            });
            button.dataset.modalHandlerAttached = 'true';
        });

        modals.forEach(modal => {
            if (modal.dataset.modalHandlersSet) return; // Предотвращаем дублирование

            const closeButtonsModal = modal.querySelectorAll("[data-modal-close]");
            closeButtonsModal.forEach(closeBtn => {
                 if (closeBtn.dataset.modalCloseHandler) return;
                closeBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    modal.classList.remove('is-active');
                    modal.style.display = 'none';
                    // console.log(`Modal ${modal.id} closed by button`);
                    if (!document.querySelector('.modal.is-active')) {
                        if (lenis && typeof lenis.start === 'function') lenis.start();
                    }
                });
                closeBtn.dataset.modalCloseHandler = 'true';
            });

            // Закрытие по клику на оверлей (сам элемент .modal)
            modal.addEventListener("click", (e) => {
                if (e.target === modal) { // Убедимся, что клик был именно на фон
                    modal.classList.remove('is-active');
                    modal.style.display = 'none';
                    // console.log(`Modal ${modal.id} closed by outside click`);
                     if (!document.querySelector('.modal.is-active')) {
                        if (lenis && typeof lenis.start === 'function') lenis.start();
                    }
                }
            });
            modal.dataset.modalHandlersSet = 'true';
        });

        // Глобальный обработчик Escape для этих модалок
        // Убедимся, что он не конфликтует с обработчиком для видео-модалки
        if (!document.body.dataset.genericModalEscapeListener) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const activeGenericModal = document.querySelector('.modal.is-active:not(#dynamic-video-modal)');
                    if (activeGenericModal) {
                         const closeButton = activeGenericModal.querySelector('[data-modal-close]');
                         if(closeButton) closeButton.click(); // Имитируем клик
                    }
                }
            });
            document.body.dataset.genericModalEscapeListener = 'true';
        }

    } catch (error) {
        console.error('Error in initModals:', error);
    }
}

// Остальные ваши функции (initBtnMenuOpenClose, animateCommonElements, и т.д.)
// должны быть здесь. Убедитесь, что они корректно используют `contextElement`
// при поиске элементов, если они должны работать с контентом, изменяемым Barba.js.
// Для функций, которые работают с глобальными элементами (например, .burger меню вне Barba-контейнера),
// `contextElement` может не понадобиться, но важно избегать повторного навешивания обработчиков.

function initBtnMenuOpenClose(context = document.body) {
    const body = document.body; // body всегда один
    const burger = document.querySelector('.burger'); // Предполагаем, что бургер один и глобальный

    if (!burger) {
        // console.warn('Burger menu button not found.');
        return;
    }

    // Проверяем, не был ли обработчик уже привязан к бургеру
    if (burger.dataset.menuOpened === 'true' && burger.classList.contains('is-active')) {
      // Если меню уже открыто и обработчик был привязан, ничего не делаем,
      // чтобы не сломать состояние при быстрой навигации Barba
    } else if (burger.dataset.menuHandlerAttached === 'true' && !burger.classList.contains('is-active') ) {
      // Если обработчик привязан, но меню закрыто, все ок
    } else {
       burger.dataset.menuHandlerAttached = 'true'; // Привязываем один раз
    }


    const menuNode = document.querySelector('.mobile__menu'); // Ищем глобально
    if (!menuNode) { // Используем menuNode вместо menu, чтобы не конфликтовать с переменной в toggleMobileMenu
        // console.warn('Mobile menu element not found.');
        return;
    }

    // GSAP анимация (если есть) - должна применяться к menuNode
    if (typeof gsap !== 'undefined' && !menuNode.dataset.gsapInit) {
        gsap.set(menuNode, { autoAlpha: 0, display: 'none' });
        menuNode.dataset.gsapInit = 'true';
    } else if (!menuNode.dataset.gsapInit) {
        menuNode.style.display = 'none'; // Фоллбэк
    }


    function toggleMobileMenu() {
        const isActive = burger.classList.toggle('is-active');
        body.classList.toggle('overflow-hidden', isActive);
        menuNode.classList.toggle('is-open', isActive); // Используем menuNode

        if (isActive) {
            if (typeof gsap !== 'undefined') {
                gsap.to(menuNode, { display:'block', autoAlpha: 1, duration: 0.3, ease: "power2.out" });
            } else {
                menuNode.style.display = 'block';
            }
        } else {
             if (typeof gsap !== 'undefined') {
                gsap.to(menuNode, { autoAlpha: 0, duration: 0.3, ease: "power2.in", onComplete: () => gsap.set(menuNode, {display: 'none'}) });
            } else {
                menuNode.style.display = 'none';
            }
        }
    }
    // Удаляем старый обработчик перед добавлением нового, чтобы избежать дублирования
    // Это не идеальный способ, лучше использовать флаги, как выше (dataset.menuHandlerAttached)
    // burger.removeEventListener('click', toggleMobileMenu); // Это может быть проблематично, если ссылка на функцию разная
    if (!burger.dataset.mainClickListener) { // Проверяем, не добавлен ли уже главный слушатель
        burger.addEventListener('click', e => {
            e.preventDefault();
            toggleMobileMenu();
        });
        burger.dataset.mainClickListener = 'true';
    }


    // Закрытие меню по клику на ссылку (если ссылки не являются Barba-переходами)
    // Если ссылки - Barba-переходы, Barba должен сам обновить страницу, и меню закроется/скроется
    menuNode.querySelectorAll('a').forEach(link => {
        if (link.dataset.menuLinkListener) return; // Проверка
        link.addEventListener('click', (e) => {
            // Если ссылка - это Barba-ссылка, то Barba обработает переход.
            // Меню должно закрыться.
            if (menuNode.classList.contains('is-open')) {
                // Не предотвращаем e.preventDefault() для Barba ссылок
                // Если ссылка - простой якорь или внешняя, то можно оставить preventDefault
                if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
                    // e.preventDefault(); // Для якорей можно оставить, если не хотите стандартного поведения
                }
                toggleMobileMenu(); // Закрываем меню
            }
        });
        link.dataset.menuLinkListener = 'true';
    });
}


function animateCommonElements(context = document.body) {
    try {
        if (typeof gsap === 'undefined') return;

        const header = context.querySelector('.header'); // Ищем в контексте
        if (header && !header.dataset.gsapAnimated) {
            gsap.fromTo(header, { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out", delay:0.1 });
            header.dataset.gsapAnimated = 'true';
        }

        const heroTitle = context.querySelector('.hero__title h1'); // Ищем в контексте
        if (heroTitle && !heroTitle.dataset.gsapAnimated) {
            gsap.fromTo(heroTitle, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" });
            heroTitle.dataset.gsapAnimated = 'true';
        }

        const footer = document.querySelector('.footer'); // Футер обычно глобальный
        if (footer && !footer.dataset.gsapFooterAnimated) { // Используем уникальный флаг
            gsap.set(footer, { y: 80, autoAlpha: 0 });
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        gsap.to(footer, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" });
                        footer.dataset.gsapFooterAnimated = 'true'; // Помечаем, что анимация была
                        footerObserver.unobserve(footer);
                    }
                });
            }, { threshold: 0.1 });
            footerObserver.observe(footer);
        }
    } catch (error) {
        console.error('Error in animateCommonElements:', error);
    }
}

function isHomePage(context = document.body) { // context может быть не нужен, если классы только на body
    try {
        if (document.body.classList.contains('home') ||
            document.body.classList.contains('homepage') ||
            document.body.classList.contains('home-page')) {
            return true;
        }
        const path = window.location.pathname;
        // Упрощенная проверка для главной страницы
        if (path === '/' || path.startsWith('/index.html') || path.startsWith('/index.php') || (path.length > 1 && path.endsWith('/') && !path.substring(1).includes('/'))) {
             return true;
        }
        // Если используете уникальный селектор на главной, который может быть в context
        // if (context.querySelector('.unique-homepage-identifier')) return true;
        return false;
    } catch (error) {
        console.error('Error in isHomePage:', error);
        return false;
    }
}

function initSliderBlocks(sliderBlocksNodeList) { // Принимает NodeList
    if (!sliderBlocksNodeList || sliderBlocksNodeList.length === 0) return;
    sliderBlocksNodeList.forEach((block) => {
        if (block.dataset.sliderInitialized === 'true') return; // Проверка инициализации
        try {
            const track = block.querySelector(".slider-track");
            const slides = block.querySelectorAll(".slider-slide");
            if (!track || slides.length === 0) return;

            let controlsContainer = block.querySelector(".slider-control");
            if (!controlsContainer) {
                controlsContainer = document.createElement("div");
                controlsContainer.classList.add("slider-control");
                block.insertBefore(controlsContainer, track); // Вставляем перед треком
            } else {
                controlsContainer.innerHTML = ""; // Очищаем для пересоздания
            }

            let currentIndex = 0;
            let autoplayInterval = null; // Объявляем здесь
            const slideWidth = () => slides.length > 0 ? slides[0].offsetWidth : 0; // Функция для получения ширины

            const updateSliderDOM = (newIndex) => {
                const newTranslateX = -newIndex * slideWidth();
                if (typeof gsap !== 'undefined') {
                    gsap.to(track, { x: newTranslateX, duration: 0.6, ease: "power2.out" });
                } else {
                    track.style.transform = `translateX(${newTranslateX}px)`;
                }
                block.querySelectorAll(".slider-button").forEach((btn, idx) => {
                    btn.classList.toggle("active", idx === newIndex);
                });
                currentIndex = newIndex;
            };

            const stopAutoplayLocal = () => { // Локальная функция
                if (autoplayInterval) clearInterval(autoplayInterval);
                autoplayInterval = null;
            };
            const startAutoplayLocal = () => { // Локальная функция
                stopAutoplayLocal();
                if (slides.length > 1) {
                    autoplayInterval = setInterval(() => {
                        let nextIndex = (currentIndex + 1) % slides.length;
                        updateSliderDOM(nextIndex);
                    }, 3500);
                }
            };

            slides.forEach((_, index) => {
                const button = document.createElement("button");
                button.classList.add("slider-button");
                button.setAttribute('aria-label', `Go to slide ${index + 1}`);
                button.addEventListener("click", () => {
                    stopAutoplayLocal();
                    updateSliderDOM(index);
                    startAutoplayLocal();
                });
                controlsContainer.appendChild(button);
            });
            if (controlsContainer.firstChild) controlsContainer.firstChild.classList.add("active");

            let touchStartX = 0; let isSwipingTrack = false; // Локальные переменные для тач-событий
            track.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0].clientX; isSwipingTrack = true; stopAutoplayLocal();
                track.style.transition = 'none'; // Отключаем CSS-переход во время свайпа
            }, { passive: true });

            track.addEventListener("touchmove", (e) => {
                if (!isSwipingTrack) return;
                const currentX = e.touches[0].clientX;
                const diffX = currentX - touchStartX;
                // Можно добавить визуальное перемещение трека здесь, если нужно
                // track.style.transform = `translateX(${-currentIndex * slideWidth() + diffX}px)`;
            }, { passive: true });

            track.addEventListener("touchend", (e) => {
                if (!isSwipingTrack) return;
                isSwipingTrack = false;
                track.style.transition = ''; // Включаем CSS-переход обратно
                const touchEndX = e.changedTouches[0].clientX;
                const diff = touchStartX - touchEndX;
                let nextIndex = currentIndex;
                if (Math.abs(diff) > 50) { // Порог свайпа
                    if (diff > 0) nextIndex = (currentIndex + 1) % slides.length;
                    else nextIndex = (currentIndex - 1 + slides.length) % slides.length;
                }
                updateSliderDOM(nextIndex); // Обновляем с анимацией
                startAutoplayLocal();
            });

            block.addEventListener("mouseenter", stopAutoplayLocal);
            block.addEventListener("mouseleave", startAutoplayLocal);

            let resizeTimeout;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => updateSliderDOM(currentIndex), 250);
            });

            startAutoplayLocal();
            block.dataset.sliderInitialized = 'true';
        } catch (error) { console.error('Error in slider block processing:', error); }
    });
}


function initTypecardTabs(tabsNodeList, tabContentsNodeList) { // Принимает NodeList
    if (!tabsNodeList || tabsNodeList.length === 0) return;
    tabsNodeList.forEach(tab => {
        if (tab.dataset.tabHandlerAttached === 'true') return; // Проверка
        tab.addEventListener('click', function() {
            tabsNodeList.forEach(t => t.classList.remove('typecard__tab_active'));
            this.classList.add('typecard__tab_active');
            const tabId = this.getAttribute('data-tab');
            if (!tabId) return;

            tabContentsNodeList.forEach(content => {
                const isActive = content.getAttribute('id') === tabId + '-content';
                content.classList.toggle('typecard__content_active', isActive);
                // Анимация с GSAP
                if (typeof gsap !== 'undefined') {
                    if (isActive) {
                        gsap.fromTo(content, {autoAlpha: 0, y: 15}, {autoAlpha: 1, y: 0, duration: 0.4, ease: 'power1.out'});
                    } else {
                        gsap.to(content, {autoAlpha: 0, duration: 0.3}); // Плавное скрытие неактивных
                    }
                } else { // Фоллбэк без GSAP
                    content.style.display = isActive ? 'block' : 'none';
                }
            });
        });
        tab.dataset.tabHandlerAttached = 'true';
    });
     // Активируем первую вкладку по умолчанию, если ни одна не активна
    const firstActiveTab = Array.from(tabsNodeList).find(t => t.classList.contains('typecard__tab_active'));
    if (!firstActiveTab && tabsNodeList.length > 0) {
        tabsNodeList[0].click();
    }
}


function initHomePage(context = document.body) { // Принимает контекст
    try {
        // Ищем элементы внутри переданного контекста
        const sliderBlocks = context.querySelectorAll(".slider-block");
        if (sliderBlocks.length > 0) {
            initSliderBlocks(sliderBlocks);
        }
        const tabs = context.querySelectorAll('.typecard__tab');
        const tabContents = context.querySelectorAll('.typecard__content');
        if (tabs.length > 0 && tabContents.length > 0) {
            initTypecardTabs(tabs, tabContents);
        }
        // console.log('HomePage specific scripts initialized for context.');
    } catch (error) {
        console.error('Error in initHomePage:', error);
    }
}

function initAnimNumbers(numberElementsNodeList) { // Принимает NodeList
    if (!numberElementsNodeList || numberElementsNodeList.length === 0 || typeof gsap === 'undefined') return;
    numberElementsNodeList.forEach(element => {
        if (element.dataset.gsapAnimatedNum === 'true') return; // Проверка
        const originalText = element.textContent || "0";
        const match = originalText.match(/^(.*?)((?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)(.*)$/); // Улучшенный регэксп
        if (!match) return;

        const prefix = match[1] || '';
        const numText = match[2];
        const suffix = match[3] || '';
        let targetNumber = parseFloat(numText.replace(/,/g, ''));
        if (isNaN(targetNumber)) return; // Пропускаем, если не число

        const hasDecimal = numText.includes('.');
        const decimalPlaces = hasDecimal ? numText.split('.')[1].length : 0;
        const obj = { value: 0 }; // Начинаем с 0

        gsap.to(obj, {
            value: targetNumber,
            duration: 2,
            ease: "power1.out",
            onUpdate: function() {
                let currentValueStr;
                if (hasDecimal) {
                    currentValueStr = obj.value.toFixed(decimalPlaces);
                } else {
                    currentValueStr = Math.floor(obj.value).toString();
                }
                if (numText.includes(',')) { // Добавляем запятые, если они были в оригинале
                    const parts = currentValueStr.split('.');
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    currentValueStr = parts.join('.');
                }
                element.textContent = prefix + currentValueStr + suffix;
            }
        });
        element.dataset.gsapAnimatedNum = 'true';
    });
}


function initSwiperSlider(context = document.body) { // Принимает контекст
    try {
        if (typeof Swiper === 'undefined') {
            // console.warn('Swiper not found');
            return;
        }
        // Инициализация Swiper для typecard__slide
        const typecardSlideEl = context.querySelector(".typecard__slide");
        if (typecardSlideEl && !typecardSlideEl.swiper) { // Проверяем, не инициализирован ли уже
            new Swiper(typecardSlideEl, { /* ... ваши опции ... */
                slidesPerView: 1, loop: true, speed: 800,
                navigation: { nextEl: ".btn-next", prevEl: ".btn-prev" }, // Убедитесь, что кнопки навигации уникальны или также ищутся в context
                autoplay: { delay: 2500, disableOnInteraction: true }
            });
        }
        // Инициализация Swiper для blog-slider
        const blogSliderEl = context.querySelector(".blog-slider");
        if (blogSliderEl && !blogSliderEl.swiper) {
            new Swiper(blogSliderEl, { /* ... ваши опции ... */
                slidesPerView: 1.1, loop: true, spaceBetween: 20,
                navigation: { nextEl: ".btn-next", prevEl: ".btn-prev" },
                breakpoints: { 560: { slidesPerView: 1.5 }, 991: { slidesPerView: 2 }, 1200: { slidesPerView: 3 }},
                autoplay: { delay: 2500, disableOnInteraction: true }
            });
        }
        // initVideoCarousel вызывается отдельно, так как он использует Slick (jQuery)
    } catch (error) {
        console.error('Error in initSwiperSlider:', error);
    }
}

function initVideoCarousel(context = document.body) { // Принимает контекст
    try {
        if (typeof jQuery === 'undefined') {
            // console.warn('jQuery not found, Slick carousel for videos unavailable');
            return;
        }
        const $ = jQuery;
        // Ищем слайдер в текущем контексте
        const $mySlider = $(context).find('.reviews__slider').addBack('.reviews__slider'); // .addBack для случая, если context сам является слайдером
        if ($mySlider.length === 0) return;

        $mySlider.each(function() { // Обрабатываем каждый найденный слайдер
            const $thisSlider = $(this);
            // Проверяем, не был ли Slick уже инициализирован на этом элементе
            // Slick добавляет класс 'slick-initialized'
            if ($thisSlider.hasClass('slick-initialized')) {
                 // Если нужно переинициализировать (например, если изменилось количество слайдов),
                 // то сначала $thisSlider.slick('unslick');
            } else {
                $thisSlider.slick({ /* ... ваши опции Slick ... */
                    dots: true, infinite: false, slidesToShow: 1, slidesToScroll: 1,
                    centerMode: true, centerPadding: '0px', speed: 500,
                    variableWidth: true, cssEase: 'ease-in-out', lazyLoad: 'ondemand',
                    responsive: [ { breakpoint: 1200, settings: { slidesToShow: 2, slidesToScroll: 1 } } ]
                });
            }
        });
        // console.log('Video carousel (Slick) initialized for context.');
    } catch (error) {
        console.error('Error in initVideoCarousel:', error);
    }
}


function initCalc(context = document.body) { // Принимает контекст
    try {
        const fleetSlider = context.querySelector('#fleet-slider'); // Ищем в контексте
        // ... и так далее для всех элементов калькулятора
        const fleetValue = context.querySelector('#fleet-value');
        const fleetTooltip = context.querySelector('#fleet-tooltip');
        const gallonsSlider = context.querySelector('#gallons-slider');
        const gallonsValue = context.querySelector('#gallons-value');
        const gallonsTooltip = context.querySelector('#gallons-tooltip');
        const savingsAmount = context.querySelector('#savings-amount');
        const savingsAmountSm = context.querySelector('#savings-amount-sm');
        const numberButtons = context.querySelectorAll('.button-group__button');


        if (!fleetSlider || !gallonsSlider || !savingsAmount) {
            // console.log('Calculator elements not found in this context.');
            return; // Если ключевые элементы не найдены, выходим
        }

        // Предотвращаем повторное навешивание обработчиков
        if (fleetSlider.dataset.calcInit === 'true') return;
        fleetSlider.dataset.calcInit = 'true';


        let fleet = parseInt(fleetSlider.value) || 1; // Инициализация значениями из DOM
        let gallons = parseInt(gallonsSlider.value) || 50;
        let fillUps = 1; // Значение по умолчанию или из активной кнопки

        // Инициализация fillUps из активной кнопки
        const activeButton = Array.from(numberButtons).find(btn => btn.classList.contains('button-group__button--active'));
        if (activeButton) {
            fillUps = parseInt(activeButton.dataset.value) || 1;
        }


        function calculateSavings() { /* ... (ваша логика без изменений, но savingsAmount и savingsAmountSm должны быть найдены ранее) ... */
            const savingsPerGallon = 0.5;
            const baseSavings = gallons * savingsPerGallon;
            const annualSavings = baseSavings * fleet * fillUps;
            const formattedSavings = Number.isInteger(annualSavings) ? annualSavings : annualSavings.toFixed(1);

            if (typeof gsap !== 'undefined' && savingsAmount) { // Проверка существования savingsAmount
                const currentValue = parseFloat(savingsAmount.textContent.replace(/[^0-9.-]+/g,"")) || 0;
                const obj = { value: currentValue };
                gsap.to(obj, {
                    value: parseFloat(formattedSavings), duration: 0.5, ease: "power1.out",
                    onUpdate: function() {
                        const displayValue = Number.isInteger(obj.value) ? Math.floor(obj.value) : obj.value.toFixed(1);
                        savingsAmount.textContent = `${displayValue}`;
                        if (savingsAmountSm) savingsAmountSm.textContent = `${displayValue}`;
                    }
                });
            } else if (savingsAmount) {
                savingsAmount.textContent = `${formattedSavings}`;
                if (savingsAmountSm) savingsAmountSm.textContent = `${formattedSavings}`;
            }
        }

        function updateTooltipPosition(slider, tooltip) { /* ... (ваша логика без изменений, но slider и tooltip должны быть переданы) ... */
             if (!slider || !tooltip) return;
            const min = parseInt(slider.min); const max = parseInt(slider.max); const val = parseInt(slider.value);
            const percentage = ((val - min) / (max - min)) * 100;
            // Для более точного позиционирования тултипа, учитываем его ширину и ширину ползунка (thumb)
            const tooltipWidth = tooltip.offsetWidth;
            const thumbWidthApprox = 20; // Приблизительная ширина ползунка, можно уточнить
            const trackWidth = slider.offsetWidth - thumbWidthApprox;
            let offset = (percentage / 100) * trackWidth + (thumbWidthApprox / 2) - (tooltipWidth / 2);
            offset = Math.max(0, Math.min(offset, slider.offsetWidth - tooltipWidth)); // Ограничиваем смещение краями слайдера

            if (typeof gsap !== 'undefined') {
                gsap.to(tooltip, { left: `${offset}px`, duration: 0.2, ease: "power1.out" });
            } else {
                tooltip.style.left = `${offset}px`;
            }
            // Обновляем текстовое значение тултипа
            tooltip.textContent = slider.value;
        }


        if (fleetSlider && fleetValue /* && fleetTooltip */) { // fleetTooltip обновляется в updateTooltipPosition
            fleetSlider.addEventListener('input', function() {
                fleet = parseInt(this.value);
                if(fleetValue) fleetValue.textContent = fleet; // Обновляем значение рядом со слайдером
                updateTooltipPosition(fleetSlider, fleetTooltip);
                calculateSavings();
            });
             // Инициализация тултипа при загрузке
            if (fleetTooltip) updateTooltipPosition(fleetSlider, fleetTooltip);
        }

        if (gallonsSlider && gallonsValue /* && gallonsTooltip */) {
            gallonsSlider.addEventListener('input', function() {
                gallons = parseInt(this.value);
                if(gallonsValue) gallonsValue.textContent = gallons;
                updateTooltipPosition(gallonsSlider, gallonsTooltip);
                calculateSavings();
            });
            if (gallonsTooltip) updateTooltipPosition(gallonsSlider, gallonsTooltip);
        }


        if (numberButtons.length > 0) {
            numberButtons.forEach(button => {
                button.addEventListener('click', function() {
                    numberButtons.forEach(btn => btn.classList.remove('button-group__button--active'));
                    this.classList.add('button-group__button--active');
                    fillUps = parseInt(this.dataset.value) || 1;
                    calculateSavings();
                });
            });
        }

        // Первоначальный расчет и позиционирование тултипов
        // Вместо window.addEventListener('load', ...) лучше вызвать сразу, т.к. initScript уже после DOMContentLoaded
        if (fleetTooltip) updateTooltipPosition(fleetSlider, fleetTooltip);
        if (gallonsTooltip) updateTooltipPosition(gallonsSlider, gallonsTooltip);
        calculateSavings(); // Первоначальный расчет с текущими значениями

    } catch (error) {
        console.error('Error in initCalc:', error);
    }
}


function initMultiStepForm(context = document.body) { // Принимает контекст
    try {
        const form = context.querySelector('.form'); // Ищем форму в контексте
        if (!form || form.dataset.msfInit === 'true') { // Проверка инициализации
            return;
        }
        form.dataset.msfInit = 'true';

        const steps = Array.from(form.querySelectorAll('.form__step, .form-step'));
        if (steps.length < 2) return;

        const nextButtons = form.querySelectorAll('.form__step-next, .next-step');
        const backButtons = form.querySelectorAll('.form__step-back');
        // Индикаторы шагов могут быть вне основной формы, ищем их глобально или передаем селектор
        const stepIndicators = document.querySelectorAll('.form__step-header ul li, .progress-steps li');


        const stepIndicatorMap = new Map();
        // ... (ваша логика stepIndicatorMap без изменений) ...
         stepIndicators.forEach(indicator => {
            const stepNumberText = indicator.textContent ? indicator.textContent.trim() : '';
            // Проверяем, что текст содержит только цифры
            if (/^\d+$/.test(stepNumberText)) {
                const index = parseInt(stepNumberText, 10) - 1;
                if (index >= 0 && index < steps.length) { // Убедимся, что индекс в пределах массива steps
                    stepIndicatorMap.set(steps[index], indicator);
                }
            }
        });


        steps.forEach((step, index) => { /* ... (ваша логика отображения первого шага) ... */
            if (index === 0) {
                step.style.display = 'block'; // Показываем первый шаг
                if (typeof gsap !== 'undefined') {
                    gsap.set(step, { autoAlpha: 1 });
                }
                const indicator = stepIndicatorMap.get(step);
                if (indicator) indicator.classList.add('filled');
            } else {
                step.style.display = 'none'; // Скрываем остальные
                if (typeof gsap !== 'undefined') {
                    gsap.set(step, { autoAlpha: 0 });
                }
            }
        });

    nextButtons.forEach((nextButton) => { /* ... (ваша логика с GSAP Timeline) ... */
        if (nextButton.dataset.msfNextHandler) return;
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            let currentStep = null, currentStepIndex = -1;
            steps.forEach((s, i) => { if (s.contains(nextButton)) { currentStep = s; currentStepIndex = i; } });

            if (currentStep && currentStepIndex < steps.length - 1) {
                const nextStep = steps[currentStepIndex + 1];
                const requiredFields = getRequiredFieldsInStep(currentStep);
                const isValid = validateRequiredFields(requiredFields, form); // Передаем форму для очистки ошибок

                if (isValid) {
                    const nextIndicator = stepIndicatorMap.get(nextStep);
                    if (nextIndicator) nextIndicator.classList.add('filled');

                    if (typeof gsap !== 'undefined') {
                        gsap.timeline()
                            .to(currentStep, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                            .set(currentStep, { display: 'none' })
                            .set(nextStep, { display: 'block' }) // Показываем перед анимацией
                            .to(nextStep, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
                    } else {
                        currentStep.style.display = 'none';
                        nextStep.style.display = 'block';
                    }
                }
            }
        });
        nextButton.dataset.msfNextHandler = 'true';
    });

    backButtons.forEach(backButton => { /* ... (ваша логика с GSAP Timeline) ... */
        if (backButton.dataset.msfBackHandler) return;
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            let currentStep = null, currentStepIndex = -1;
            steps.forEach((s, i) => { if (s.contains(backButton)) { currentStep = s; currentStepIndex = i; } });

            if (currentStep && currentStepIndex > 0) {
                const prevStep = steps[currentStepIndex - 1];
                const currentIndicator = stepIndicatorMap.get(currentStep);
                if (currentIndicator) currentIndicator.classList.remove('filled'); // Снимаем 'filled' с текущего при возврате

                if (typeof gsap !== 'undefined') {
                    gsap.timeline()
                        .to(currentStep, { autoAlpha: 0, duration: 0.4, ease: "power2.out" })
                        .set(currentStep, { display: 'none' })
                        .set(prevStep, { display: 'block' })
                        .to(prevStep, { autoAlpha: 1, duration: 0.4, ease: "power2.in" });
                } else {
                    currentStep.style.display = 'none';
                    prevStep.style.display = 'block';
                }
            }
        });
        backButton.dataset.msfBackHandler = 'true';
    });

    // getRequiredFieldsInStep и validateRequiredFields (с небольшими правками)
    function getRequiredFieldsInStep(step) { /* ... (ваша функция без изменений) ... */
        const fields = [];
        const ariaRequiredInputs = step.querySelectorAll('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]');
        ariaRequiredInputs.forEach(input => fields.push(input));
        const requiredInputs = step.querySelectorAll('input[required], select[required], textarea[required]');
        requiredInputs.forEach(input => {
            if (!fields.includes(input)) { // Добавляем, только если еще не в списке
                fields.push(input);
            }
        });
        return fields;
    }

    function validateRequiredFields(fields, parentForm) { /* ... (ваша функция, но parentForm для поиска ошибок) ... */
        let isValid = true;
        // Очищаем только ошибки внутри текущей формы
        const existingErrors = parentForm.querySelectorAll('.form-error-message');
        existingErrors.forEach(error => error.remove());
        parentForm.querySelectorAll('.input-error').forEach(field => {
            field.classList.remove('input-error');
        });

        fields.forEach(field => {
            // Убедимся, что поле видимо и активно (некоторые поля могут быть скрыты логикой формы)
            if (field.offsetWidth === 0 && field.offsetHeight === 0 && !field.matches(':hidden')) {
                 // Поле скрыто (например, display:none), но не стандартным HTML hidden. Пропускаем валидацию.
                 // Для более сложных случаев может потребоваться проверка computed styles.
            } else if (field.disabled || field.readOnly || field.closest('.step-is-hidden')) { // Пример класса для скрытых шагов
                // Пропускаем валидацию для отключенных, read-only или полей в скрытых контейнерах
            } else {
                // Ваша логика валидации...
                const fieldParent = field.closest('span.wpcf7-form-control-wrap') || field.closest('.form-field-class') || field.parentNode; // Более гибкий поиск родителя

                if (field.tagName === 'SELECT') { /* ... */
                    const hasSelectedOption = field.selectedIndex > 0;
                    const hasValue = field.value && field.value !== "" && !field.value.toLowerCase().includes("select");
                    if (!hasSelectedOption || !hasValue) { isValid = false; addErrorStyling(field, fieldParent, "Please select an option.");}
                }
                else if (field.type === 'checkbox' || field.type === 'radio') { /* ... */
                    // Для группы радиокнопок, проверяем, выбрана ли хотя бы одна с тем же именем
                    if (field.type === 'radio') {
                        const groupName = field.name;
                        if (groupName) {
                            const checkedInGroup = parentForm.querySelector(`input[name="${groupName}"]:checked`);
                            if (!checkedInGroup) {isValid = false; addErrorStyling(field, fieldParent, "Please select an option.");}
                        } else if (!field.checked) { // Если нет имени (одиночная радио), проверяем ее
                             isValid = false; addErrorStyling(field, fieldParent, "This field is required.");
                        }
                    } else if (!field.checked) { // Для чекбокса
                        isValid = false; addErrorStyling(field, fieldParent, "This field is required.");
                    }
                }
                else { /* ... */
                    if (!field.value.trim()) {isValid = false; addErrorStyling(field, fieldParent, "This field is required."); }
                    if (field.type === 'email' && field.value.trim()) { /* ... */
                        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailPattern.test(field.value.trim())) { isValid = false; addErrorStyling(field, fieldParent, "Please enter a valid email address.");}
                    }
                    // ... (другие ваши проверки)
                }
            }
        });
        return isValid;
    }

    function addErrorStyling(field, fieldParent, errorText) { /* ... (ваша функция без изменений) ... */
         field.classList.add('input-error');
        // Убедимся, что не добавляем сообщение об ошибке многократно
        if (fieldParent.querySelector('.form-error-message')) return;

        const errorMessage = document.createElement('span');
        errorMessage.className = 'form-error-message';
        errorMessage.textContent = errorText;

        // Вставляем сообщение после поля или в конец родителя
        if (field.nextSibling) {
            fieldParent.insertBefore(errorMessage, field.nextSibling);
        } else {
            fieldParent.appendChild(errorMessage);
        }

        if (typeof gsap !== 'undefined') {
            errorMessage.style.opacity = '0'; // Начальное состояние для GSAP
            gsap.to(errorMessage, { opacity: 1, duration: 0.3, ease: "power2.out" });
            gsap.fromTo(field, { x: 0 }, { x: 5, duration: 0.1, repeat: 3, yoyo: true, clearProps: "x" });
        } else {
            // Можно добавить простой класс для анимации появления ошибки, если GSAP нет
        }
    }


    const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
    if (submitButton) { /* ... (ваша логика без изменений) ... */
        if (submitButton.dataset.msfSubmitHandler) return;
        submitButton.addEventListener('click', function(e) {
            const currentStep = steps.find(step => step.style.display !== 'none' && step.contains(submitButton)); // Ищем видимый шаг
            if (!currentStep) { // Если не нашли видимый шаг с кнопкой (маловероятно, но для защиты)
                 // Проверяем все шаги на случай, если проверка видимости не сработала
                const lastStepWithButton = steps.slice().reverse().find(step => step.contains(submitButton));
                if (lastStepWithButton) {
                     const requiredFields = getRequiredFieldsInStep(lastStepWithButton);
                     if (!validateRequiredFields(requiredFields, form)) e.preventDefault();
                }
                return;
            }
            const requiredFields = getRequiredFieldsInStep(currentStep);
            if (!validateRequiredFields(requiredFields, form)) e.preventDefault();
        });
        submitButton.dataset.msfSubmitHandler = 'true';
    }


    // Стиль для ошибок (если еще не добавлен)
    if (!document.getElementById('multi-step-form-styles')) { /* ... (ваш код без изменений) ... */
        const style = document.createElement('style');
        style.id = 'multi-step-form-styles';
        style.textContent = `
            .input-error { border-color: red !important; }
            .form-error-message { color: red; font-size: 0.85em; display: block; margin-top: 4px; }
        `;
        document.head.appendChild(style);
    }


} catch (error) {
        console.error('Error in initMultiStepForm:', error);
    }
}


function initLoginPage(context = document.body) { // Принимает контекст
    // Ищем элементы внутри context, если он передан, иначе глобально
    const loginContainer = context.querySelector('#login-form-container') || document.getElementById('login-form-container');
    const recoveryContainer = context.querySelector('#recovery-form-container') || document.getElementById('recovery-form-container');
    const showRecoveryBtn = context.querySelector('#show-recovery') || document.getElementById('show-recovery');
    const showLoginBtn = context.querySelector('#show-login') || document.getElementById('show-login');
    const showContactBtn = context.querySelector('#show-contact') || document.getElementById('show-contact');
    const contactPopup = context.querySelector('#contact-popup') || document.getElementById('contact-popup');
    const closePopupBtn = context.querySelector('.close-popup') || document.querySelector('.close-popup'); // Может быть несколько, ищем в контексте или глобально


    // Проверка, чтобы не навешивать обработчики многократно, если элементы глобальны
    // Используем уникальные флаги для каждого типа обработчика/элемента

    if (recoveryContainer && !recoveryContainer.dataset.gsapInitLp) {
        gsap.set(recoveryContainer, { autoAlpha: 0, display: 'none' });
        recoveryContainer.dataset.gsapInitLp = 'true';
    }

    if (contactPopup && !contactPopup.dataset.gsapInitLp) {
        gsap.set(contactPopup, { autoAlpha: 0, display: 'none' });
        contactPopup.dataset.gsapInitLp = 'true';
    }

    if (showRecoveryBtn && showLoginBtn && loginContainer && recoveryContainer) {
        if (!showRecoveryBtn.dataset.handlerLp) {
            showRecoveryBtn.addEventListener('click', function(e) { /* ... (ваша логика с GSAP) ... */
                e.preventDefault();
                gsap.to(loginContainer, { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.out",
                    onComplete: () => {
                        gsap.set(loginContainer, { display: 'none' });
                        gsap.set(recoveryContainer, { display: 'block', y: 20, autoAlpha:0 }); // Устанавливаем начальное состояние перед анимацией
                        gsap.to(recoveryContainer, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" });
                    }
                });
            });
            showRecoveryBtn.dataset.handlerLp = 'true';
        }
        if (!showLoginBtn.dataset.handlerLp) {
            showLoginBtn.addEventListener('click', function(e) { /* ... (ваша логика с GSAP) ... */
                e.preventDefault();
                gsap.to(recoveryContainer, { autoAlpha: 0, y: -20, duration: 0.3, ease: "power2.out",
                    onComplete: () => {
                        gsap.set(recoveryContainer, { display: 'none' });
                        gsap.set(loginContainer, { display: 'block', y: 20, autoAlpha:0 });
                        gsap.to(loginContainer, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" });
                    }
                });
            });
            showLoginBtn.dataset.handlerLp = 'true';
        }
    }

    if (showContactBtn && contactPopup && closePopupBtn) {
        if(!showContactBtn.dataset.handlerLp) {
            showContactBtn.addEventListener('click', function(e) { /* ... */
                e.preventDefault();
                gsap.set(contactPopup, { display: 'flex' }); // 'flex' если так задумано в CSS
                gsap.fromTo(contactPopup, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" });
            });
            showContactBtn.dataset.handlerLp = 'true';
        }
        if(!closePopupBtn.dataset.handlerLp) {
            closePopupBtn.addEventListener('click', function() { /* ... */
                gsap.to(contactPopup, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: "power2.in", onComplete: () => gsap.set(contactPopup, { display: 'none' }) });
            });
            closePopupBtn.dataset.handlerLp = 'true';
        }
        if(!contactPopup.dataset.handlerBgLp) { // Для клика по фону
            contactPopup.addEventListener('click', function(e) { /* ... */
                 if (e.target === contactPopup) { // Клик на сам фон
                    gsap.to(contactPopup, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: "power2.in", onComplete: () => gsap.set(contactPopup, { display: 'none' }) });
                }
            });
            contactPopup.dataset.handlerBgLp = 'true';
        }
    }


    const loginForm = context.querySelector('#login-form') || document.getElementById('login-form');
    if (loginForm && !loginForm.dataset.handlerLp) { /* ... (ваша логика с GSAP и alert) ... */
        loginForm.addEventListener('submit', function(e) {
            const userLogin = loginForm.querySelector('#user_login'); // Ищем внутри формы
            const userPass = loginForm.querySelector('#user_pass');
            if (!userLogin.value || !userPass.value) {
                e.preventDefault();
                if(typeof gsap !== 'undefined') gsap.to(loginForm, { x: [-10, 10, -8, 8, -5, 5, 0], duration: 0.5, ease: "power2.out" });
                alert('Please fill in all fields.'); // На англ.
            }
        });
        loginForm.dataset.handlerLp = 'true';
    }


    const recoveryForm = context.querySelector('#recovery-form') || document.getElementById('recovery-form');
    if (recoveryForm && !recoveryForm.dataset.handlerLp) { /* ... (ваша логика с GSAP и alert) ... */
        recoveryForm.addEventListener('submit', function(e) {
            const userEmail = recoveryForm.querySelector('#user_email'); // Ищем внутри формы
            if (!userEmail.value) {
                e.preventDefault();
                if(typeof gsap !== 'undefined') gsap.to(recoveryForm, { x: [-10, 10, -8, 8, -5, 5, 0], duration: 0.5, ease: "power2.out" });
                alert('Please enter email or username.'); // На англ.
            }
        });
        recoveryForm.dataset.handlerLp = 'true';
    }


    const contactForm = context.querySelector('#contact-form') || document.getElementById('contact-form');
    if (contactForm && !contactForm.dataset.handlerLp && contactPopup) { /* ... (ваша логика с GSAP, alert и reset) ... */
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Your message has been sent. We will contact you shortly.'); // На англ.
            if(typeof gsap !== 'undefined' && contactPopup) {
                gsap.to(contactPopup, { autoAlpha: 0, scale: 0.9, duration: 0.3, ease: "power2.in",
                    onComplete: () => {
                        gsap.set(contactPopup, { display: 'none' });
                        contactForm.reset();
                    }
                });
            } else if (contactPopup) {
                contactPopup.style.display = 'none';
                contactForm.reset();
            }
        });
        contactForm.dataset.handlerLp = 'true';
    }


    // Эта проверка должна выполняться при каждой загрузке initLoginPage,
    // так как URL может измениться при SPA-навигации, но обычно login failed - это перезагрузка страницы.
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') && urlParams.get('login') === 'failed') {
        alert('Incorrect login or password. Please try again.'); // На англ.
        // Очищаем параметр из URL, чтобы alert не появлялся снова при F5
        if (window.history.replaceState) {
            const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path:cleanURL}, '', cleanURL);
        }
    }

    // Обработчик для togglePasswordVisibility
    // Ищем иконку в текущем контексте (или глобально, если она всегда есть)
    const toggleIcon = context.querySelector('.toggle-password') || document.querySelector('.toggle-password');
    if (toggleIcon && !toggleIcon.dataset.handlerLp) {
        toggleIcon.addEventListener('click', togglePasswordVisibility); // Вызываем функцию по имени
        toggleIcon.dataset.handlerLp = 'true';
    }
}

function togglePasswordVisibility() { // Эта функция может быть глобальной
    // `this` внутри обработчика будет указывать на иконку, если привязывать через `this`
    // Если привязывать по имени функции, `this` будет window или undefined (в strict mode)
    // Лучше найти поле пароля относительно иконки или по ID, если он есть
    const passwordField = document.getElementById('user_pass'); // Предполагаем, что ID всегда такой
    const toggleIcon = document.querySelector('.toggle-password'); // Если иконка одна

    if (passwordField && toggleIcon) { // Убедимся, что оба элемента существуют
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.classList.add('visible'); // Добавляем класс для изменения иконки (глаз открыт/закрыт)
        } else {
            passwordField.type = 'password';
            toggleIcon.classList.remove('visible');
        }
    }
}

// --- Конец ваших существующих функций ---