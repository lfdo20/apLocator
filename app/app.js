const puppeteer = require('puppeteer');
const { setIntervalAsync } = require("set-interval-async/fixed");
const { clearIntervalAsync } = require("set-interval-async");
const telegram = require('../bin/bot');
require("dotenv").config();
const { initializeApp } = require('firebase/app');
const {	getDatabase, ref, set, get} = require("firebase/database");

// Initialize Firebase
const firebaseConfig = {
	apiKey: process.env.API_KEY,
	authDomain: process.env.AUTH_DOMAIN,
	databaseURl: process.env.DATABASE_URL,
	projectId: process.env.PROJECT_ID,
	storageBucket: process.env.STORAGE_BUCKET,
	messagingSenderId: "50933893203",
	appId: process.env.APP_ID,
};
const app = initializeApp(firebaseConfig);

// App Global Vars
const filtroModel = {
		local0:['brasilia','guara'],
		local: ['asa-norte/', 'asa-sul/', 'guara-i/'],
		termos: ['sqn', 'sqn 216', 'sqs', 'guara', 'shcgn',''],
		area: [45, 50, 60, 70],
		valor: [1800,2300],
		quartos:[1,2]
}

let searchModel = [
	["brasilia", "asa-norte/", "shcgn", 50, [1600, 2500], 2],
	["brasilia", "asa-norte/", "sqn 216", 50, [1600, 2500], 2],
	["brasilia", "asa-norte/", "sqn 416", 50, [1600, 2500], 2],
	["brasilia", "asa-norte/", "sqn 407", 50, [1600, 2500], 2],
	["brasilia", "asa-norte/", "sqn 410", 50, [1600, 2500], 2],
	["brasilia", "asa-norte/", "sqn 411", 50, [1600, 2500], 2],
	//,["guara", "guara-i/", "", 50, [1200, 2000], 2]
];

let finalResult = [];
let parcialResult = [];
let searchResult = [[], [], [], [], [], [], []];
let lastSearch = [];
let apData = [[], [], []];
let counter = [30, 1];
let lastResults = [];
let telegramUsers;

// Firebase Save & Load
function readData() {
	const db = getDatabase(app);
	get(ref(db, "lastResults/"))
	.then((snapshot) => {
		if (snapshot.exists()) {
			lastResults = snapshot.val();
			console.log('lastResults : ', lastResults.length);
		} else {
			console.log("No lastResults available");
		}
	})
	.catch((error) => {
		console.error(error);
	});
	get(ref(db, "searchModel/"))
		.then((snapshot) => {
			if (snapshot.exists()) {
				searchModel = snapshot.val();
				console.log("searchModel : ", searchModel);
			} else {
				console.log("No searchModel available");
			}
		})
		.catch((error) => {
			console.error(error);
		});
		get(ref(db, "users/"))
			.then((snapshot) => {
				if (snapshot.exists()) {
					telegramUsers = snapshot.val();
					console.log("telegramUsers : ", telegramUsers);
				} else {
					console.log("No users available");
				}
				//console.log(`Loaded: lastResults, users, searchModel`);
			})
			.catch((error) => {
				console.error(error);
			});
}

//INIT data load
readData();

function saveData() {
	const db = getDatabase(app);
	set(ref(db, 'lastResults/'), lastResults);
	telegramUsers = telegram.TUsers();
	set(ref(db, 'users/'), telegramUsers );
	set(ref(db, "searchModel/"), searchModel);
}

process.on("SIGTERM", () => {
	console.log("Salvando dados e finalizando bot..");
	saveData(lastResults);
	setTimeout(() => {
		process.exit(0);
	}, 7000);
});


// App Functions
function dateNow(){
	var today = new Date();
	var date = `${today.getDate()}${today.getMonth() + 1}${today.getFullYear()}`;
	var time = `_${today.getHours()}${today.getMinutes()}`;
	return date + time;
}

function filtroBusca(smItem){
   let filtro = {
			local0: smItem[0],
			local: smItem[1],
			termos: smItem[2],
			area: smItem[3],
			valor: [smItem[4][0], smItem[4][1]],
			quartos: smItem[5],
			maxPagina: 2,
		};
		console.log(
			`Filtros da Busca: .${filtro.local0} / .${filtro.local} / .${filtro.termos} / .${filtro.area} / .${filtro.valor} / .${filtro.quartos}`
		);
  return filtro;
};

function urlConstructor(filtros, value){
  if (value.length > 30) {
		const url = [`https://www.dfimoveis.com.br${value}`];
		console.log('Ap: ', value);
    return url;
  }else{
    const url = [
    `https://www.dfimoveis.com.br/aluguel/df/${filtros.local0}/${filtros.local}`,
    `apartamento?palavrachave=${filtros.termos}`,
    `&quartosinicial=${filtros.quartos}&quartosfinal=`,
    `&valorinicial=${filtros.valor[0]}&valorfinal=${filtros.valor[1]}`,
    `&areainicial=${filtros.area}&areafinal=`,
    `&ordenamento=menor-valor&pagina=${value}`
  ];
  return url.join("");
	}
};

function pagesCounter(value) {
  if (value == 000) {
    counter = [30,1];
    return 'Reset!';
  } else if (value.toString().length == 2) {
    counter[0] = counter[0] + 30;
    counter[1] = counter[1] + 1;
    console.log(counter[1]);
    return counter[1];
  } else {
    return counter[0];
  }
}

async function scrape(urlFilter){
  const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
  const page = await browser.newPage();
  let sharedUrl;

  await page.setViewport({
    width: 1280,
    height: 1024,
    deviceScaleFactor: 1,
  });

  page.setDefaultNavigationTimeout(120000);

  async function apPage(url) {
    //console.log(url.join(""));
    await page.goto(url.join(""), {
			waitUntil: "load",
			timeout: 0,
		});

    const apResult = await page.evaluate(() => {
      const ap = [[], [], [],[]];
      //Descrição document.querySelectorAll('.texto-descricao').innerText
      document
        .querySelectorAll(".texto-descricao")
        .forEach((cdesc) =>
          ap[0].push(
            JSON.stringify(cdesc.innerText).replaceAll(/(\\n)?(")?/gm, "")
          )
        );
      //Condominio document.querySelectorAll('.r-computador-dados>div:nth-child(3)>div:first-child>h6>small').innerText
      document
        .querySelectorAll(
          ".r-computador-dados>div:nth-child(3)>div:first-child>h6>small"
        )
        .forEach((condo) => ap[1].push(condo.innerText));

      //Fotos Carrossel document.querySelectorAll('.flickity-slider>div>img').currentSrc

      document
        .querySelectorAll(".flickity-slider>div>img")
        .forEach((fot) => ap[3].push(fot.currentSrc));
        ap[2].push(ap[3]);
      return ap;
    });
    apData.forEach((array, i) => {
      array.push(...apResult[i]);
    });
  }

  // Pagina resultado da Busca
  // local: document.querySelectorAll('.property__title.endereco-mobile>a').innerText
  // aluguel: document.querySelectorAll('.property__subtitle.hide-mobile').childen[1].innerText
  // area: document.querySelectorAll('.property__options>li[class=hide-mobile]').innerText // regex /(\d{2} m²)/
  // quartos: document.querySelectorAll('.property__options>li[class=hide-mobile]').nextElementSibling.innerText

  async function scrapSearchData(url) {
		let resultDescription;
    console.log(`
    URL base: '${url}
    `);
    await page.goto(url);
		page.waitForNetworkIdle();
    //page.on("console", (log) => console[log._type](log._text));
		if ((await page.$('.property-list > li > div[data-url]')) !== null) {
			//const tst = await page.waitForSelector(".property-list__item:last-child div.property__image>img")
			//await page.$eval(".property-list__item:last-child div.property__image>img",(e)=>{return e})
			resultDescription = await page.evaluate(() => {
				const locals = [],
					aluguels = [],
					areas = [],
					quartos = [],
					descricao = [],
					urls = [],
					imgs = [];

				//local: document.querySelectorAll('.property__title.endereco-mobile>a').innerText // regex /(\w+\s)?(\w+\s\w+)+(?=\\n)/g
				document
					.querySelectorAll(".property__title.endereco-mobile>a")
					.forEach((local) =>
						locals.push(
							JSON.stringify(local.innerText).match(/(\w+\s)?(\w+\s\w+)(\s\w+)?/g)[0]
						)
					);
				// aluguel: document.querySelectorAll('.property__subtitle.hide-mobile').children[1].innerText
				document
					.querySelectorAll(".property__subtitle.hide-mobile")
					.forEach((valor) => aluguels.push(valor.children[1].innerText));

				// area: document.querySelectorAll('.property__options>li[class=hide-mobile]').innerText // regex /(\d{2} m²)/
				document
					.querySelectorAll(".property__options>li[class=hide-mobile]")
					.forEach((area) => areas.push(area.innerText.match(/(\d{2} m²)/g)[0]));

				// quartos: document.querySelectorAll('.property__options>li[class=hide-mobile]').nextElementSibling.innerText
				document
					.querySelectorAll(".property__options>li[class=hide-mobile]")
					.forEach((quarto) => quartos.push(quarto.nextElementSibling.innerText));

				// Descrição : document.querySelectorAll(".property-list > li > meta[itemprop=description]").content
				document
					.querySelectorAll(".property-list > li > meta[itemprop=description]")
					.forEach((content) =>
						descricao.push(
							JSON.stringify(content.content).toLocaleLowerCase().replaceAll(/(\\n)?(")?/gm, ""))); //content.content;

				// url: document.querySelectorAll('.property-list > li > div[data-url').dataset.url `https://www.dfimoveis.com.br${}`
				document
					.querySelectorAll(".property-list > li > div[data-url]")
					.forEach((url) => urls.push(url.dataset.url));

				// imagem: document.querySelectorAll('div.property__image img[src]').currentSrc
				document
					.querySelectorAll(".property-list__item div.property__image>img[src]")
					.forEach((img) => {
						if (img.className == 'b-lazy')
							imgs.push(img.dataset.src);
						else
							imgs.push(img.currentSrc);
					}); //img.currentSrc or img.dataset.src

				return [locals, aluguels, areas, quartos, descricao, urls, imgs];
			});
			console.log(`${resultDescription[0].length} Apartamentos encontrados.`);
			searchResult.forEach((array,i)=>{
				array.push(...resultDescription[i])
			})
			lastSearch = resultDescription;
			sharedUrl = resultDescription[5];
		}else{
			console.log(`0 Apartamentos encontrados.`);
			sharedUrl = [];
		}

  }

	const scrapApData = async function () {
		for (const data of sharedUrl) {
			await apPage(urlConstructor(urlFilter, data));
		}
	};

  await scrapSearchData(urlConstructor(urlFilter,1));
  if (searchResult[0].length >= pagesCounter(1) ) {
    await scrapSearchData(urlConstructor(urlFilter, pagesCounter(searchResult[0].length)));
  }

  await scrapApData();
  browser.close();
}



function dataSync(){
  for (let index = 0; index < searchResult[0].length; index++) {
			parcialResult.push({
				local: searchResult[0][index],
				aluguel: searchResult[1][index],
				area: searchResult[2][index],
				quartos: searchResult[3][index],
				descricao: searchResult[4][index],
				url: searchResult[5][index],
				img: searchResult[6][index],
			});
		}
}

function sumAndTotal(al,cd) {
	let cnd = /(([0-9].)?[0-9]{3,4})/g.test(cd);
	let alg = /(([0-9].)?[0-9]{3,4})/g.test(al);
	if (cnd && alg) {
		let sum = parseFloat(al.replace(".", "")) + parseFloat(cd.replace(".", ""));
		return Intl.NumberFormat('de-DE').format(sum);
	}
}

function addExtraData() {
	for (let index = 0; index < searchResult[0].length; index++) {
		let totalValue = /(([0-9].)?[0-9]{3,4})/g.test(apData[1][index]) ? apData[1][index] : "000";
		parcialResult[index] = {
			...parcialResult[index],
			descCompleta: apData[0][index],
			condominio: totalValue,
			total: sumAndTotal(
				parcialResult[index].aluguel, totalValue
			),
			fotos: apData[2][index],
		};
	}
}

function findDup(originalItems, checkItems) {
	if (originalItems.length > 0) {
		let dup = [];
		Object.entries(originalItems).filter(([oIndex,oItem]) => {
			checkItems.filter((cItem, cIndex) => {
				if (cItem == oItem.url) {
					dup.push([cItem,oIndex]);
				}
			});
		});
		return dup;
	}
}
function removeDuplicates(dups){
	if (dups !== undefined && dups.length > 0) {
		dups.forEach((remove) => {
			delete finalResult[`${remove[1]}`];
		});
	}
	finalResult = finalResult.filter((item) => {
		return item !== undefined;
	});
}

function notifyNew(lasts){
	let newAps = finalResult.slice(-lasts);
	console.log("Novo Ap!", newAps.length);
	telegram.TMsg(newAps);
}

function addIfNew(){
	let finalResultLength = finalResult.length;
	let lastResultsLength = lastResults.length !== 0 ? lastResults[lastResults.length - 1].results.length : 0;
	let lasts = finalResultLength - lastResultsLength;
	console.log(finalResultLength, lastResultsLength, lasts);
	if (lastResultsLength == 0 || finalResultLength > lastResultsLength) {
		lastResults.push({
			date: dateNow(),
			results: finalResult,
		});
		saveData(lastResults);
		console.log("LR");
	}
		console.log(finalResultLength, lastResultsLength, lasts);

	if (lasts >= 1){
		notifyNew(lasts);
	}
}

function clearResults(mod) {
	parcialResult = [];
	searchResult = [[], [], [], [], [], [], []];
	lastSearch = [];
	apData = [[], [], []];
	if (mod == 'final')
		finalResult = [];
}

async function multipleSearch(searchModel,onetime) {
	clearResults('final');

	if (onetime == 'onetime') {
		await scrape(filtroBusca(searchModel)).then(() => {
			dataSync();
			addExtraData();
		});
		console.log("antiretorno", parcialResult);
		return parcialResult;
	} else {
		for (const search of searchModel) {
			await scrape(filtroBusca(search)).then(() => {
				dataSync();
				addExtraData();
				if (lastSearch.length > 0)
					removeDuplicates(findDup(finalResult, lastSearch[5]));
				if (parcialResult.length > 0)
					finalResult = [...finalResult, ...parcialResult];
				clearResults();
			});
			console.log("Final...", finalResult.length);
		}
		addIfNew();
	}
}

let searchFrequecny;
function startTimedSearch(min){
	searchFrequecny = setIntervalAsync(async()=>{
		await multipleSearch(searchModel);
	}, min * 1000);
}
startTimedSearch(2 * 60); // 2*60

async function unaTest(){
	setTimeout(()=>{multipleSearch(searchModel)},10000);
	setTimeout(()=>{
		multipleSearch([
			["brasilia", "asa-norte/", "705", 50, [1600, 2500], 2],
		])},
		40000
	);
	setTimeout(()=>{
		multipleSearch([
			["brasilia", "asa-norte/", "705", 50, [1600, 2500], 2],
			["brasilia", "asa-norte/", "707", 50, [1600, 2500], 2],
		]);},
		60000
	);
	setTimeout(()=>{
		multipleSearch([["brasilia", "asa-norte/", "shcgn", 50, [1600, 2500], 2]])},
		80000
	);
}

//unaTest()

module.exports.getAps = async (filter)=>{
	return await multipleSearch(filter, "onetime");
}

module.exports.getResult = ()=>{
	return finalResult;
}

module.exports.lastResults = () => {
	return lastResults;
};

module.exports.listSearch = async ()=>{
	const x = JSON.stringify(searchModel);
	const t = x.match(/(((?<=(\],\[|\[\[)).{30,70}(?=(\]\]|\],\[))){1,6})/g);
	return `${t.join("\r\n")}`;
}

module.exports.addSearch = async (location) =>{
	searchModel.push(location);
}

module.exports.removeSearch = async (location)=>{

	const remove = searchModel.findIndex((el,id)=>{
		let trueCount = 0
		for (let i = 0; i < searchModel[0].length; i++) {
			let modEl = Array.isArray(el[i]) ? el[i].join() : el[i].toString();
			let modLoc = Array.isArray(location[i]) ? location[i].join() : location[i].toString();
			if (modLoc == modEl) {
				trueCount += 1;
			}
			if (trueCount > 5) {
				return id;
			}
		}
	});
	searchModel.splice(remove,1);
}

module.exports.saveData = ()=>{
	return saveData();
}
module.exports.TUsersLoad = ()=>{
	return telegramUsers;
}


//! TimeoutError: Timeout exceeded while waiting for event não tem a ver com o setTimeout inicial
//FIXED está copiando o array de fotos das pesquisas anteriores.
//! não crashar quando a busca excede o tempo e tentar novamente
//DID: juntar os itens de cada array em um objeto
//DID: se .length >30 adicionar nova pagina e refazer scraper dentro da função antes de retornar o resultado
//DID: pagecounter para controlar a definição de paginas
//DID: entrar na pagina de cada imóvel para pegar o valor do condominio e descrição completa
//DID: entrar na pagina de cada imóvel para pegar varias fotos
//DID: criar função para gerar diferentes urls para pesquisa sequencial
//TODO: criar carrossel de fotos em modal
//TODO: criar descrição completa em modal
//DID: comparar com pesquisa anterior e salvar cumulativamente por data
//DID: enviar notificação para telegram ao detectar novo ap que não existia antes
//DID: endpoint para pesquisa em local específico, passando os filtros no pedido por telegram
//DID: Sort by sum of condominio and aluguel
//DID: tentar colocar o condominio depois de aluguel com desestruturação
//DID: converter o objeto de listas para array e refatorar todo o código
//DID: criar intervalo de pesquisa automática
//DID: save users do bot e searchqueries do app no firebase
//TODO: criar skill alexa para notificação
//TODO: criar métodos para adicionar novo site e novos queries de busca
//DID: criar método para adicionar novo local para buca sequencial
//TODO: reestruturar o addifnew(). Lógica por novos aps e não por lenght da lista de aps
//TODO: checar cada um dos dados do ap para ver se teve variação, se sim, adicionar como novo e destacar a mudança
