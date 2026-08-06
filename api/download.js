const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    // Captura o ID do pagamento enviado via query string pelo Mercado Pago
    const payment_id = req.query.payment_id || req.query.collection_id || req.query.id;

    if (!payment_id) {
        return res.status(400).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                <h2>Acesso Negado</h2>
                <p>Identificador de pagamento ausente na requisição.</p>
            </div>
        `);
    }

    try {
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });
        const payment = new Payment(client);

        // Consulta o pagamento na API do Mercado Pago
        const paymentData = await payment.get({ id: payment_id });

        if (paymentData && paymentData.status === 'approved') {
            const produtoComprado = paymentData.external_reference;
            
            // Leitura segura da variável RESETS_JSON
            let listaLinks = {};
            try {
                listaLinks = JSON.parse(process.env.RESETS_JSON || '{}');
            } catch (jsonErr) {
                console.error('Erro ao ler a variável RESETS_JSON:', jsonErr);
            }

            const linkDownload = listaLinks[produtoComprado];

            if (linkDownload) {
                // Redireciona o comprador para o link do arquivo
                return res.redirect(302, linkDownload);
            } else {
                return res.status(404).send(`
                    <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                        <h2>Pagamento Aprovado com Sucesso! 🎉</h2>
                        <p>O produto <strong>${produtoComprado || 'solicitado'}</strong> foi pago.</p>
                        <p>Para receber o arquivo do reset, entre em contato com nosso suporte:</p>
                        <p><strong>Email:</strong> rajrgsinfors@gmail.com</p>
                    </div>
                `);
            }
        } else {
            return res.status(403).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                    <h2>Pagamento Pendente ou Recusado</h2>
                    <p>Status atual: ${paymentData ? paymentData.status : 'desconhecido'}</p>
                    <a href="/">Voltar para a loja</a>
                </div>
            `);
        }
    } catch (error) {
        console.error('Erro no processamento de download:', error);
        return res.status(500).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 40px;">
                <h2>Ocorreu um erro no servidor</h2>
                <p>Por favor, entre em contato informando o ID da compra: <strong>${payment_id}</strong></p>
                <p>Contato: rajrgsinfors@gmail.com</p>
            </div>
        `);
    }
}
