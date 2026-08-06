document.getElementById('pay-btn').addEventListener('click', async () => {
  const btn = document.getElementById('pay-btn');
  btn.disabled = true;
  btn.innerText = 'Processando...';

  try {
    const response = await fetch('/api/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Produto RajShop',
        price: 10.0,
        quantity: 1
      }),
    });

    const data = await response.json();

    if (data.init_point) {
      // Redireciona diretamente para o checkout do Mercado Pago
      window.location.href = data.init_point;
    } else {
      alert('Erro ao criar link de pagamento.');
      btn.disabled = false;
      btn.innerText = 'Comprar com Mercado Pago';
    }
  } catch (err) {
    console.error(err);
    alert('Erro na requisição.');
    btn.disabled = false;
    btn.innerText = 'Comprar com Mercado Pago';
  }
});