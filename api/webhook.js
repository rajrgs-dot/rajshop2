const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // O Mercado Pago envia dados via Query Params ou Body
        const { type, data } = req.body;
        const topic = req.query.topic || req.query.type || type;
        const paymentId = req.query['data.id'] || (data ? data.id : null);

        // Processa apenas notificações de pagamento
        if (topic === 'payment' && paymentId) {
            const client = new MercadoPagoConfig({ 
                accessToken: process.env.MP_ACCESS_TOKEN 
            });
            const payment = new Payment(client);

            // Busca os detalhes do pagamento atualizado
            const paymentData = await payment.get({ id: paymentId });
            
            const status = paymentData.status; // 'approved', 'pending', 'rejected', etc.
            const externalRef = paymentData.external_reference; // ID do produto/pedido
            const payerEmail = paymentData.payer?.email; // E-mail do pagador

            console.log(`[WEBHOOK] Pagamento ${paymentId} - Status: ${status} - Produto: ${externalRef}`);

            if (status === 'approved') {
                // ===============================================================
                // AÇÃO QUANDO O PAGAMENTO FOR APROVADO:
                // Exemplo: Salvar no Banco de Dados, Enviar e-mail com link do Reset, etc.
                // ===============================================================
                console.log(`✅ Liberar acesso/Reset para: ${payerEmail} - Item: ${externalRef}`);
            }
        }

        // O Mercado Pago exige resposta HTTP 200/201 para confirmar a entrega do webhook
        return res.status(200).send('OK');
    } catch (error) {
        console.error('Erro ao processar Webhook:', error);
        return res.status(500).json({ error: 'Erro no servidor' });
    }
}