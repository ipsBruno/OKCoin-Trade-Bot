"use strict";

// Carregar bibliotecas necessárias

var OKCoin = require('okcoin');
var dateFormat = require('dateformat');


// Definir suas API-KEY-SECRET
var apiKey = 'SUA API KEY';
var apiSecret = 'SUA API SECRET';



// Inicializar classes
global.publicClient = new OKCoin();
global.privateClient = new OKCoin(apiKey, apiSecret);


// Carregar biblioteca com funções básicas
var API = require('./info.js');

// Essa função serve para configurar as informações do servidor 
// Tem suporte para dois parâmetros callback,callbackorders
// callback orders é chamada logo que as informações de trade são recebidas
// Como conta do usuáro, cotação do bitcoin, entre outros
// callbackorder é chamada a cada segundo com uma informação em tempo real das ordens abertas pelo usuário
API.ConfigureInfos(onConfigureInfo, onUpdateOrders);


// Essa array global-pública vai servir para intermediar os valores 
// definidos no algorítimo de trade para o Bitcoin
var infoTrade;


// Essa é a callback que escolhemos lá em cima.
// Aqui ela já vai ter disponíveis as informações do usuário
// Veja getDollarUser getBitcoinUser getBitcoinPrice, entre outras ...
function onConfigureInfo() {

	// Aqui chama a função configurarTrade faz o algóritimo para criar novas ordens
	infoTrade = ConfigureTrade(API.getDollarUser());


	// Chamar função para comprar a ordem na exchange
	API.buybtc(infoTrade.buy.amount, infoTrade.buy.price, onCompleteBuyOrder);


	// Informar ao usuário
	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Tenho: " + API.getDollarUser() + " USD | Compra: " + infoTrade.buy.price + " | Venda: " + infoTrade.sell.price + "");
	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Criando ordem de compra | Quantia: " + infoTrade.buy.amount + " BTC");
}

// Essa função é chamada quando foi completada a ordem no modo buy
function onCompleteBuyOrder(orderid, type) {

	// Agora que a ordem buy foi fechada, temos Bitcoins comprados. Portanto vamos vende-los

	API.sellbtc(infoTrade.sell.amount, infoTrade.sell.price, onCompleteSellOrder);

	// Informar ao usuário
	logConsole("[" + dateFormat(new Date(), "h:MM:ss") + "] Criando ordem de venda | Quantia: " + infoTrade.sell.amount + " BTC");
}

// Ao completar a venda dos Bitcoins
// Vamos reiniciar o sistema tudo denovo.
// Obtendo a informação atualizado do Bitcoin e chamando a função pra comprar eles novamente
function onCompleteSellOrder() {
	API.ConfigureInfos(onConfigureInfo);
}



// Aqui entra a parte que vou colocar o StopLoss
// onUpdateOrders é chamado a cada segundo com informações em tempo reais das ordens
// Ordens com muito tempo abertas eu farei uma checagem para ver se a ordem está muito abaixo do mercado
// Caso estiver abaixo do mercado, cancela ela para evitar perdas. Stop Loss
function onUpdateOrders(orders) {
	for (var v = 0; v != orders["orders"].length; v++) {
		if (new Date().getTime()  - ["orders"][v]["create_date"] >= 600000) {
			logConsole("A ordem  já está a mais de 10 minutos sendo executada");
		}
	}
}


// ConfigurarTrade é a parte do algorítimo.
// Aqui você define qual sua margem de lucro. E quando deverá ser a diferença
// Veja que coloquei ordens buy - 0.5% do valor do Bitcoin
// Ordens Sell estão 0.5% valor do Bitcoin. Ou Seja, estou planejando um lucro de aproximadamente 0.1% a cada trade
// o parametro usd define com quantos dólares você quer fazer a conta
// Lá em cima eu to usando a função API.getDollarUser() portanto estou usando todos dólares que tem na conta para trade. 
// Atenção para esta parte quem tiver muito dinheiro e quer fazer teste com pouco
function ConfigureTrade(usd) {


	var tradeInfo = {
		buy: {
			price: 0.0,
			amount: 0.0
		},
		sell: {
			price: 0.0,
			amount: 0.0
		}
	};


	var price = API.getBitcoinPrice();

	tradeInfo.buy.price = price - parseFloat(price / 100) * 0.05;
	tradeInfo.buy.amount = (usd / price);

	tradeInfo.sell.price = price + parseFloat(price / 100) * 0.05;
	tradeInfo.sell.amount = (usd / price);

	// Aqui eu faço uma simples checagem pra ver se o cara tem bitcoins disponíveis
	if (API.getDollarUser() < usd || usd < 10) {
		throw new Error("Insuficient founds. USD " + API.getDollarUser() + "$");
	}

	return tradeInfo;

}


// Aqui é uma simples função de log no console;
// Ela impede que mensagens repetidas sejam enviadas no chat
var lastLog;

function logConsole(str) {
	if (lastLog != str) {
		lastLog = str;
		console.log(lastLog);
	}
}
