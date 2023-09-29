// Класс `Form` представляет собой форму на веб-странице и содержит методы для валидации, отправки данных и отображения сообщений об успехе или ошибке.
class Form {
    // конструктор класса `Form`, принимает параметр `params`
    constructor(params) {
        // Получение элементов формы
        this.formElement = document.querySelector(params.form);
        this.fieldContainer = params.fieldContainer;

        this.urlToBackend = params.urlToBackend; //url-адрес для Серверной части

        // колличество миллесекунд через сколько удалить всплывающее окна
        if (Number(params.timeInterval)) {
            this.timeInterval = Number(params.timeInterval); 
        } else {
            this.timeInterval = 3000;
        }

        // переменная, которая содержит ссылки на все элементы формы
        this.inputElements = this.formElement.querySelectorAll('.input, .textarea, .checkbox, .select');

        // массив с вложенными массивами полей формы.
        this.elements = [this.inputElements];

        // Привязка обработчика события к методу `handleSubmit`.
        this.formElement.addEventListener('submit', this.handleSubmit.bind(this));

        // добавление обработчика события `input` к каждому полю формы.
        this.elements.forEach(element => {
            element.forEach(elem => {
                if (elem !== null) {
                    // Привязка обработчика события input к методу handleInput
                    elem.addEventListener('input', this.handleInput.bind(this));
                }
            });
        });
    }

    // обработчик события отправки формы. 
    handleSubmit(event) {
        event.preventDefault();

        // Проверка валидности формы
        if (!this.validateForm(this.elements)) {
            return;
        }

        // Создание объекта formData для отправки данных
        const formData = {
            ...{
                formType: this.formElement.dataset.type
            },
            ...this.getFormDate(this.elements)
        };

        // Отправка данных на сервер и обработка ответа
        this.sendData(formData)
            .then(response => {
                response.forEach((elem) => {
                    if (elem.data !== undefined) {
                        elem = elem.data;
                    }

                    if (elem === "success") {
                        // Показ сообщения об успешной отправке формы и очистка формы
                        this.creatingHowPopup('Форма успешно отправлена');
                        this.clearForm();
                    } else {
                        // Показ сообщения об ошибке отправки формы
                        this.creatingHowPopup('Ошибка отправки формы');
                    }
                })
            })
            .catch(error => {
                this.creatingHowPopup('Ошибка сервера. Пожалуйста, попробуйте еще раз.');
            });
    }

    // Валидация формы Проверяет каждое поле на заполненность и выбор обязательных полей.
    validateForm(elements) {
        let isValid = true;

        elements.forEach(element => {
            element.forEach(elem => {
                if (elem !== null) {

                    // Проверка наличия атрибута "data-required" у элемента
                    if (!elem.dataset.required) {
                        return; // Если атрибут отсутствует, прекратить выполнение кода
                    }

                    if (elem.type !== 'checkbox') {

                        if (elem.value.trim() === '') {
                            // Показ сообщения об ошибке заполнения поля
                            if (elem.tagName !== 'SELECT') {
                                this.checkAndShowErrorMessage(elem, 'Запоните поле!');
                                isValid = false;
                            } else {
                                this.checkAndShowErrorMessage(elem, 'Необходимо выбрать опцию');
                                isValid = false;
                            }
                        } else {
                            // Удаление сообщения об ошибке заполнения поля
                            this.removeError(elem);
                        }
                    } else {
                        // Проверка выбора checkbox
                        if (!elem.checked) {
                            // Показ сообщения об ошибке невыбранного checkbox
                            this.checkAndShowErrorMessage(elem, 'Необходимо поставить флажок');
                            isValid = false;
                        } else {
                            // Удаление сообщения об ошибке невыбранного checkbox
                            this.removeError(elem);
                        }
                    }
                }
            });
        });

        return isValid; // Возвращение флага валидности формы
    }

    // Функция для проверки и отображения сообщения об ошибке
    checkAndShowErrorMessage(elem, defaultMessage) {
        const message = elem.dataset.messageError || defaultMessage;
        this.showError(elem, message);
    }

    // метод для отображения сообщения об ошибке.
    showError(input, message) {
        if (input.closest(this.fieldContainer).querySelector('.error-message') !== null) {
            return;
        }

        // Создание элемента <p> для отображения сообщения об ошибке
        const errorParagraph = document.createElement('p');
        errorParagraph.className = 'error-message';
        
        errorParagraph.innerHTML = message;
        input.closest(this.fieldContainer).appendChild(errorParagraph);
        input.classList.add('error');
    }

    // метод для удаления сообщения об ошибке.
    removeError(input) {
        // Удаление элемента <p> с сообщением об ошибке
        const errorParagraph = input.closest(this.fieldContainer).querySelector('.error-message');
        if (errorParagraph) {
            errorParagraph.remove();
        }
        input.classList.remove('error');
    }

    //обработчик события `input`. Проверяет поле на наличие ошибки и добавляет кнопку очистки, если поле не пустое.
    handleInput(event) {
        const input = event.target;

        // Если чекбокс выбран, удаляем ошибку
        if (input.checked) {
            return this.removeError(input);
        }

        // Если поле содержит класс 'error' и значение не пустое, удаляем ошибку
        if (input.classList.contains('error') && input.value.trim() !== '') {
            this.removeError(input);
            this.addClearButton(event);
        } else if (input.value.trim() === '') {
            input.parentNode.querySelector('button').remove();
        } else {
            this.addClearButton(event);
        }
    }

    // метод для отправки данных на сервер с помощью `fetch API`. Принимает объект `formData`, преобразует его в JSON и отправляет на сервер. Возвращает промис с ответом от сервера.
    sendData(formData) {
        return fetch(this.urlToBackend, { //url-to-backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json()); // Преобразование ответа в JSON
    }

    // метод для отображения всплывающего окна с сообщением об успехе/ошибке отправки формы.
    creatingHowPopup(message) {
        // создание всплывающего окна
        const popupElement = document.createElement('div');
        const popupElementParagraph = document.createElement('p');

        const popupClass = 'submitting-message-popup';
        const customPopupClass = this.formElement.dataset.popupClass;

        // проверяем наличие атрибута data-popup-class у формы и добавляем класс/ы всплывающему окну
        popupElement.className = customPopupClass ? `${popupClass} ${customPopupClass}` : popupClass;
        
        popupElementParagraph.className = 'submitting-message-popup__paragraph';

        popupElementParagraph.textContent = message;

        popupElement.appendChild(popupElementParagraph);

        document.body.appendChild(popupElement);

        // Добавления класса всплывающего окна для плавного отображения
        setTimeout(() => {
            popupElement.classList.add('fade-in');
        }, 50);

        // Удаление всплывающего окна через `this.time` секунд
        setTimeout(() => {
            popupElement.classList.remove('fade-in');
            setTimeout(() => {
                popupElement.remove();
            }, 1000);
        }, this.timeInterval);
    }

    // метод для очистки формы. Сбрасывает значения полей формы.
    clearForm() {
        this.formElement.reset();
    }

    // Создает кнопку очистки и добавляет ее к родительскому элементу поля.
    addClearButton(event) {
        const field = event.target;
        const clearButtonClassName = field.dataset.classClearButton;

        if (clearButtonClassName) {
            const clearButton = field.parentNode.querySelector(`.${clearButtonClassName}`);

            if (!clearButton) {
                const button = document.createElement('button');
                button.classList.add('clear-button', clearButtonClassName);
                button.addEventListener('click', this.handleClearButton.bind(this));
                const label = field.parentNode;
                label.appendChild(button);
            }
        }
    }

    // обработчик события клика по кнопке очистки. Очищает поле и удаляет кнопку очистки.
    handleClearButton(event) {
        const button = event.target;
        const field = button.parentNode.querySelector('input, textarea');

        if (field) {
            field.value = '';
            button.remove();
        }
    }

    // метод для получения данных формы. Создает объект `formDate` и заполняет его значениями полей формы. Возвращает объект `formDate`.
    getFormDate(elements) {
        let formDate = {};
        elements.forEach(element => {
            element.forEach(elem => {
                if (elem !== null) {
                    const value = elem.type === 'checkbox' ? String(elem.checked) : elem.value;

                    formDate[elem.name] = value;
                }
            });
        });

        return formDate;
    }
}

// Создание экземпляра класса формы с двумя обязательными парраметрами
const urlToBackend = 'server.json';
const fieldContainer = '.field-container';

let paramsForm1 = {
    form: '.form1', // class/id/tagName DOM елемента формы
    fieldContainer: fieldContainer, // class/id/tagName DOM елемента который будет контейнером для сообщением о незаполненном поле
    urlToBackend: urlToBackend, // urlToBackend (url-адрес для Серверной части)
}
const myForm1 = new Form(paramsForm1);

let paramsForm2 = {
    form: '.form2',
    fieldContainer: fieldContainer,
    urlToBackend: urlToBackend,
}
const myForm2 = new Form(paramsForm2);

let paramsForm3 = {
    form: '.form3',
    fieldContainer: fieldContainer,
    urlToBackend: urlToBackend,
    timeInterval: 2000, // не обязательный параметр, содержит интервал времени для Удаление всплывающего окна через `timeInterval` по умолчанию значение 3000
}
const myForm3 = new Form(paramsForm3);
