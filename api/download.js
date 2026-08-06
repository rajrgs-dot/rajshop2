const { MercadoPagoConfig, Payment } = require('mercadopago');

// Dicionário de downloads mantido no servidor (invisível no HTML público)
const DOWNLOAD_MAP = JSON.parse(process.env.RESETS_JSON || '{}');

export default async function handler(req, res) {
    const { payment_id } = req.query;

    if (!payment_id) {
        return res.status(400).send('<h1>Acesso negado: ID de pagamento ausente.</h1>');
    }

    try {
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });
        const payment = new Payment(client);

        // Consulta a API do Mercado Pago para verificar a compra real
        const paymentData = await payment.get({ id: payment_id });

        // Validação estrita do status do pagamento
        if (paymentData.status === 'approved') {
            const productName = paymentData.external_reference;
            const downloadUrl = DOWNLOAD_MAP[productName];

            if (downloadUrl) {
                // Redireciona o comprador para o arquivo real de download
                return res.redirect(302, downloadUrl);
            } else {
                return res.status(404).send('<h1>Arquivo não encontrado. Entre em contato com o suporte.</h1>');
            }
        } else {
            return res.status(403).send('<h1>Pagamento pendente ou não aprovado.</h1>');
        }
    } catch (error) {
        console.error('Erro na validação do download:', error);
        return res.status(500).send('<h1>Erro ao validar pagamento. Tente novamente mais tarde.</h1>');
    }
}