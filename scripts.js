document.addEventListener("DOMContentLoaded", function () {
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split("T")[0];
  document.getElementById("dataVencimento").value = dataFormatada;
  document.getElementById("btn-validar-codigo").disabled = true;
});

async function gerarCodigoBarras() {
  const dataVencimento = document.getElementById("dataVencimento").value;
  const valor = document.getElementById("valor").value;

  if (!dataVencimento || !valor) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  document.getElementById("loader").style.display = "block";
  document.getElementById("resultContent").style.display = "none";
  document.getElementById("gerarButton").disabled = true;

  try {
    const response = await fetch("http://localhost:7999/api/barcode-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataVencimento: dataVencimento,
        valor: parseFloat(valor),
      }),
    });

    if (!response.ok) throw new Error(`Erro: ${response.status}`);

    const data = await response.json();
    console.log("📦 Resposta JSON:", data);

    // Verifica se vem com I maiúsculo ou minúsculo
    const imagem = data?.ImagemBase64 ?? data?.imagemBase64 ?? null;

    if (imagem && imagem.length > 50) {
      document.getElementById("barcodeImage").src = `data:image/png;base64,${imagem}`;
      document.getElementById("barcodeImage").alt = "Código de Barras";
    } else {
      console.error("⚠️ ImagemBase64 ausente ou inválida", imagem);
      document.getElementById("barcodeImage").alt = "Erro ao carregar imagem";
    }

    document.getElementById("barcodeText").textContent = data.barcode;
    document.getElementById("resultContent").style.display = "block";
    document.getElementById("btn-validar-codigo").disabled = false;

    clearValidationUI();
  } catch (error) {
    console.error("Erro ao gerar o código de barras:", error);
    alert("Erro ao gerar o código de barras.");
  } finally {
    document.getElementById("loader").style.display = "none";
    document.getElementById("gerarButton").disabled = false;
  }
}

async function validarCodigo() {
  const barcode = document.getElementById("barcodeText").innerText;

  if (!barcode) {
    alert("Nenhum código de barras para validar.");
    return;
  }

  try {
    const response = await fetch("http://localhost:7998/api/barcode-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode }),
    });

    if (!response.ok) throw new Error(`Erro: ${response.status}`);

    const result = await response.json();
    updateValidationUI(result);
  } catch (err) {
    alert("Erro ao validar o código.");
    console.error(err);
  }
}

function updateValidationUI(result) {
  const barcodeResult = document.getElementById("barcodeText");
  const validationMessage = document.getElementById("validation-message");

  barcodeResult.classList.remove("barcode-valid", "barcode-invalid");
  validationMessage.classList.remove("validation-valid", "validation-invalid");

  if (result.valido === true) {
    barcodeResult.classList.add("barcode-valid");
    validationMessage.textContent = result.mensagem || "Boleto válido";
    validationMessage.classList.add("validation-valid");
  } else {
    barcodeResult.classList.add("barcode-invalid");
    validationMessage.textContent = result.mensagem || "Código inválido";
    validationMessage.classList.add("validation-invalid");
  }
}

function clearValidationUI() {
  const barcodeResult = document.getElementById("barcodeText");
  const validationMessage = document.getElementById("validation-message");

  barcodeResult.classList.remove("barcode-valid", "barcode-invalid");
  validationMessage.textContent = "";
  validationMessage.classList.remove("validation-valid", "validation-invalid");
}
