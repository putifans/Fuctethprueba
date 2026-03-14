const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

// Configuración de APIs (Falsas)
const FAUCETPAY_API_KEY = 'apifaucetpay123456789';
const HCAPTCHA_SECRET = 'secretkeyhc123456789';
const REWARD_AMOUNT = 0.00000004;
const CURRENCY = 'ETH';

app.get('/', (req, res) => {
    // Si no existe la cookie de reclamos, la iniciamos en 0
    let claims = req.cookies.claims_count ? parseInt(req.cookies.claims_count) : 0;
    res.render('index', { claims: claims, sitekey: 'sitekeyhc123456789' });
});

app.post('/claim', async (req, res) => {
    const { email, 'h-captcha-response': hCaptchaResponse } = req.body;
    let claims = req.cookies.claims_count ? parseInt(req.cookies.claims_count) : 0;

    // 1. Verificar Límite de 25
    if (claims >= 25) {
        return res.send("Has alcanzado el límite diario de 25 reclamos.");
    }

    // 2. Verificar hCaptcha
    try {
        const verify = await axios.post(`https://hcaptcha.com/siteverify`, null, {
            params: {
                secret: HCAPTCHA_SECRET,
                response: hCaptchaResponse
            }
        });

        if (!verify.data.success) return res.send("Error en el Captcha.");

        // 3. Enviar pago a FaucetPay (Simulado)
        // Documentación: https://faucetpay.io/api/v1/send
        const response = await axios.post('https://faucetpay.io/api/v1/send', {
            api_key: FAUCETPAY_API_KEY,
            amount: REWARD_AMOUNT,
            currency: CURRENCY,
            to: email,
            referral: false
        });

        // 4. Actualizar contador en Cookie (Expira en 24h)
        res.cookie('claims_count', claims + 1, { maxAge: 86400000 });
        res.redirect('/');

    } catch (error) {
        console.error(error);
        res.send("Error al procesar el pago.");
    }
});

app.listen(3000, () => console.log('Faucet corriendo en http://localhost:3000'));