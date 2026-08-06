const { MercadoPagoConfig, Payment } = require('mercadopago');

export default async function handler(req, res) {
    // Captura o ID da transação enviado pelo Mercado Pago
    const payment_id = req.query.payment_id || req.query.collection_id || req.query.id;

    if (!payment_id) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Acesso Negado</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #ebebeb; margin: 0; padding: 20px; }
                    .card { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                    h2 { color: #cc0000; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Acesso Negado</h2>
                    <p>Identificador de pagamento não encontrado na requisição.</p>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });
        const payment = new Payment(client);

        // Consulta a API do Mercado Pago para verificar a compra
        const paymentData = await payment.get({ id: payment_id });

        if (paymentData && paymentData.status === 'approved') {
            const produtoComprado = paymentData.external_reference;
            
            // Lê a lista de links protegida salva na Vercel
            let listaLinks = {};
            try {
                listaLinks = JSON.parse(process.env.RESETS_JSON || '{}');
            } catch (jsonErr) {
                console.error('Erro ao ler a variável RESETS_JSON:', jsonErr);
            }

            const linkDownload = listaLinks[produtoComprado];

            // Retorna a página HTML com o botão de download
            return res.status(200).send(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Pagamento Aprovado | RAJShop</title>
                    <style>
                        body { font-family: Arial, Helvetica, sans-serif; background: #ebebeb; margin: 0; padding: 20px; }
                        .container { max-width: 500px; margin: 40px auto; background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        .icon { font-size: 50px; color: #00a650; margin-bottom: 10px; }
                        h1 { font-size: 22px; color: #333; margin-bottom: 10px; }
                        p { color: #555; font-size: 15px; margin-bottom: 25px; line-height: 1.5; }
                        .product-name { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 10px; border-radius: 6px; font-weight: bold; color: #1e293b; margin-bottom: 25px; }
                        .btn-download {
                            display: inline-block;
                            background: #00a650;
                            color: white;
                            font-weight: bold;
                            text-decoration: none;
                            padding: 16px 32px;
                            border-radius: 8px;
                            font-size: 16px;
                            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
                            transition: background 0.2s, transform 0.1s;
                        }
                        .btn-download:hover { background: #008741; transform: scale(1.02); }
                        .footer { margin-top: 35px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>

                <div class="container">
                    <div class="icon">✓</div>
                    <h1>Pagamento Aprovado!</h1>
                    <p>Obrigado pela compra. Seu produto foi liberado com sucesso:</p>
                    
                    <div class="product-name">${produtoComprado || 'Reset Selecionado'}</div>

                    ${linkDownload ? `
                        <a href="${linkDownload}" target="_blank" class="btn-download">
                            Clique aqui para baixar o Reset
                        </a>
                    ` : `
                        <p style="color: #cc0000;">Não foi possível recuperar o link automático para este produto.</p>
                        <p>Por favor, envie o comprovante para nosso suporte:</p>
                    `}

                    <div class="footer">
                        <strong>RAJShop Resets</strong><br>
                        Suporte: rajrgsinfors@gmail.com | YouTube: youtube.com/@rajrgs
                    </div>
                </div>

                </body>
                </html>
            `);
        } else {
            return res.status(403).send(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Pagamento Pendente</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #ebebeb; margin: 0; padding: 20px; }
                        .card { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                        a { color: #00a650; font-weight: bold; text-decoration: none; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2>Pagamento Pendente ou Recusado</h2>
                        <p>Status atual da transação: <strong>${paymentData ? paymentData.status : 'desconhecido'}</strong></p>
                        <p><a href="/">Voltar para a página inicial</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Erro na geração da página de download:', error);
        return res.status(500).send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Erro no Servidor</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #ebebeb; margin: 0; padding: 20px; }
                    .card { max-width: 500px; margin: 50px auto; background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Erro ao Processar Solicitação</h2>
                    <p>Ocorreu uma falha na verificação da compra.</p>
                    <p>Informe o ID <strong>${payment_id}</strong> para o suporte: <strong>rajrgsinfors@gmail.com</strong></p>
                </div>
            </body>
            </html>
        `);
    }
}