import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  // Permite apenas requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Inicializa o cliente com o Access Token vindo das variáveis de ambiente
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
  });

  const preference = new Preference(client);

  try {
    const { title, price, quantity } = req.body;

    const response = await preference.create({
      body: {
        items: [
          {
            title: title || 'Produto RajShop',
            unit_price: Number(price) || 10.0,
            quantity: Number(quantity) || 1,
            currency_id: 'BRL',
          },
        ],
        back_urls: {
          success: `${req.headers.origin}/?status=success`,
          failure: `${req.headers.origin}/?status=failure`,
          pending: `${req.headers.origin}/?status=pending`,
        },
        auto_return: 'approved',
      },
    });

    // Retorna o ID da preferência e a URL de checkout
    return res.status(200).json({
      id: response.id,
      init_point: response.init_point
    });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    return res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
}