const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { title, unit_price } = req.body;

        if (!title || !unit_price) {
            return res.status(400).json({ error: 'Título e preço são obrigatórios' });
        }

        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });

        const preference = new Preference(client);

        // Monta a URL base do seu domínio hospedado na Vercel
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const response = await preference.create({
            body: {
                items: [
                    {
                        title: title,
                        quantity: 1,
                        unit_price: Number(unit_price),
                        currency_id: 'BRL'
                    }
                ],
                // Rastreio interno do produto enviado de volta no Webhook
                external_reference: title,

                // URL do Webhook que receberá o aviso do pagamento
                notification_url: `${baseUrl}/api/webhook`,

                // Páginas de redirecionamento do cliente na tela
                back_urls: {
                    success: `${baseUrl}/sucesso.html`,
                    failure: `${baseUrl}/erro.html`,
                    pending: `${baseUrl}/pendente.html`
                },
                auto_return: 'approved'
            }
        });

        return res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        console.error('Erro Mercado Pago:', error);
        return res.status(500).json({ error: 'Erro ao gerar pagamento', details: error.message });
    }
}