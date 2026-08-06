const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    const { payment_id } = req.query;

    if (!payment_id) {
        return res.status(400).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Acesso negado: ID de pagamento ausente.</h1>');
    }

    try {
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });
        const payment = new Payment(client);

        // Consulta o Mercado Pago para verificar se a compra é REAL e APROVADA
        const paymentData = await payment.get({ id: payment_id });

        if (paymentData.status === 'approved') {
            const produtoComprado = paymentData.external_reference;
            
            // Pega a lista de links cadastrada nas Variáveis de Ambiente da Vercel
            const listaLinks = JSON.parse(process.env.RESETS_JSON || '{}');
            const linkDownload = listaLinks[produtoComprado];

            if (linkDownload) {
                // Redireciona o cliente diretamente para baixar o arquivo
                return res.redirect(302, linkDownload);
            } else {
                return res.status(404).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Arquivo não encontrado. Entre em contato com rajrgsinfors@gmail.com</h1>');
            }
        } else {
            return res.status(403).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Pagamento não aprovado ou em processamento.</h1>');
        }
    } catch (error) {
        console.error('Erro ao validar pagamento:', error);
        return res.status(500).send('<h1 style="font-family: sans-serif; text-align: center; margin-top: 50px;">Erro ao validar pagamento. Tente novamente mais tarde.</h1>');
    }
}