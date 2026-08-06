const { MercadoPagoConfig, Preference } = require('mercadopago');

export default async function handler(req, res) {
    // Configuração de cabeçalhos CORS
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

        // Inicializa SDK com o Token vindo das Variáveis de Ambiente da Vercel
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });

        const preference = new Preference(client);

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
                back_urls: {
                    success: 'https://' + req.headers.host + '/sucesso.html',
                    failure: 'https://' + req.headers.host + '/erro.html',
                    pending: 'https://' + req.headers.host + '/pendente.html'
                },
                auto_return: 'approved'
            }
        });

        // Retorna o link oficial de pagamento do Mercado Pago
        return res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        console.error('Erro Mercado Pago:', error);
        return res.status(500).json({ error: 'Erro ao gerar checkout', details: error.message });
    }
}