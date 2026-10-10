const TELEGRAM_BOT_TOKEN = "ВАШ_ТОКЕН_БОТА";
const TELEGRAM_CHAT_ID = "ВАШ_CHAT_ID";


function formatOrderMessage(order) {

    let message = `🛒 *Новый заказ #${order.id}*\n\n`;

    message += `👤 *Покупатель:*\n`;

    message += `Имя: ${order.customer.name}\n`;
    message += `Телефон: ${order.customer.phone}\n`;
    message += `Email: ${order.customer.email}\n`;
    message += `Город: ${order.customer.city}\n`;
    message += `Доставка: ${order.customer.delivery}\n`;
    message += `Адрес/отделение: ${order.customer.address}\n\n`;

    message += `📦 *Товары:*\n`;

    let total = 0;

    order.products.forEach(function (product, index) {

        const productTotal =
            product.price * product.quantity;

        total += productTotal;

        message += `${index + 1}. ${product.name}\n`;
        message += `   Количество: ${product.quantity}\n`;
        message += `   Цена: ${product.price} грн\n`;
        message += `   Сумма: ${productTotal} грн\n\n`;

    });

    message += `💰 *Итого: ${total} грн*\n\n`;

    message += `📅 Дата: ${
        new Date(order.createdAt).toLocaleString("ru-RU")
    }`;

    return message;
}


async function sendOrderToTelegram(order) {

    const text = formatOrderMessage(order);

    const url =
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;


    const response = await fetch(url, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            chat_id: TELEGRAM_CHAT_ID,

            text: text,

            parse_mode: "Markdown"

        })

    });


    const data = await response.json();


    if (!data.ok) {

        throw new Error(
            data.description ||
            "Ошибка отправки в Telegram"
        );

    }


    return data;

}


function renderOrder() {

    const orderItems =
        document.getElementById("orderItems");

    const orderTotal =
        document.getElementById("orderTotal");


    let cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    if (cart.length === 0) {

        orderItems.innerHTML = `

            <p>
                Корзина пуста.
            </p>

            <br>

            <a href="index.html">
                Вернуться в магазин
            </a>

        `;

        orderTotal.textContent = "0 грн";

        return;

    }


    let total = 0;

    let html = "";


    cart.forEach(function (product) {

        const productTotal =
            product.price * product.quantity;

        total += productTotal;


        html += `

            <div class="order-item">

                <div class="order-item-name">

                    ${product.name}

                    × ${product.quantity}

                </div>

                <div class="order-item-price">

                    ${productTotal} грн

                </div>

            </div>

        `;

    });


    orderItems.innerHTML = html;

    orderTotal.textContent =
        total + " грн";

}


function showMessage(text, type) {

    const message =
        document.getElementById("message");


    message.textContent = text;

    message.className =
        "message " + type;

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const checkoutForm =
            document.getElementById("checkoutForm");


        if (!checkoutForm) {
            return;
        }


        renderOrder();


        checkoutForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                let cart =
                    JSON.parse(
                        localStorage.getItem("cart")
                    ) || [];


                if (cart.length === 0) {

                    showMessage(
                        "Корзина пуста.",
                        "error"
                    );

                    return;

                }


                const name =
                    document.getElementById("name")
                        .value.trim();


                const phone =
                    document.getElementById("phone")
                        .value.trim();


                const email =
                    document.getElementById("email")
                        .value.trim();


                const city =
                    document.getElementById("city")
                        .value.trim();


                const delivery =
                    document.getElementById("delivery")
                        .value;


                const address =
                    document.getElementById("address")
                        .value.trim();


                if (
                    !name ||
                    !phone ||
                    !email ||
                    !city ||
                    !delivery ||
                    !address
                ) {

                    showMessage(
                        "Пожалуйста, заполните все поля.",
                        "error"
                    );

                    return;

                }


                const order = {

                    id: Date.now(),

                    customer: {

                        name: name,

                        phone: phone,

                        email: email,

                        city: city,

                        delivery: delivery,

                        address: address

                    },

                    products: cart,

                    createdAt:
                        new Date().toISOString()

                };


                const submitButton =
                    checkoutForm.querySelector(
                        ".submit-button"
                    );


                const originalText =
                    submitButton.textContent;


                submitButton.disabled = true;

                submitButton.textContent =
                    "Отправка...";


                try {

                    await sendOrderToTelegram(order);


                    localStorage.setItem(
                        "lastOrder",
                        JSON.stringify(order)
                    );


                    localStorage.removeItem("cart");


                    showMessage(
                        "Заказ успешно оформлен! Мы свяжемся с вами.",
                        "success"
                    );


                    checkoutForm.reset();


                    renderOrder();


                } catch (error) {

                    console.error(error);


                    showMessage(
                        "Ошибка при отправке заказа. Попробуйте позже.",
                        "error"
                    );

                } finally {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        originalText;

                }

            }
        );

    }
);