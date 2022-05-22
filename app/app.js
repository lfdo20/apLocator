const puppeteer = require('puppeteer');
const TelegramBot = require("node-telegram-bot-api");

const filtroModel = {
    local0:['brasilia','guara'],
    local: ['asa-norte/', 'asa-sul/', 'guara-i/'],
    termos: ['sqn', 'sqn 216', 'sqs', 'guara', 'shcgn',''],
    area: [45, 50, 60, 70],
    valor: [1800,2300],
    quartos:[1,2]
}

const searchModel = [
	["brasilia", "asa-norte/", "shcgn", 50, [1600, 2300], 2]
	,["brasilia", "asa-norte/", "sqn 216", 50, [1600, 2400], 2]
	,["brasilia", "asa-norte/", "sqn 416", 50, [1600, 2400], 2]
	,["brasilia", "asa-norte/", "shcgn 716", 50, [1600, 2300], 2]
	//,["guara", "guara-i/", "", 50, [1200, 2000], 2]
];

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
			`Filtros da Busca:
      .${filtro.local0}
      .${filtro.local}
      .${filtro.termos}
      .${filtro.area}
      .${filtro.valor}
      .${filtro.quartos}
      `
		);
  return filtro;
};

// https://www.dfimoveis.com.br/aluguel/df/brasilia/asa-norte/apartamento?palavrachave=sqn&quartosinicial=2
// &quartosfinal=&valorinicial=1400&valorfinal=2400&areainicial=40&areafinal=&ordenamento=menor-valor&pagina=1
function urlConstructor(filtros, value){
  if (value.length > 30) {
		const url = [`https://www.dfimoveis.com.br${value}`];
		console.log('Ap: ', url[0]);
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

let finalResult = {};
let parcialResult = {};
let searchResult = [[], [], [], [], [], [], []];
let apData = [[], [], []];
let counter = [30, 1];
let oldResult = [];

async function scrape(urlFilter){
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
	let sharedData;

  await page.setViewport({
    width: 1280,
    height: 1024,
    deviceScaleFactor: 1,
  });

  page.setDefaultNavigationTimeout(80000);

  async function apPage(url) {
    //console.log(url.join(""));
    await page.goto(url.join(""));

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
    console.log(`
    URL base: '${url}
    `);
    await page.goto(url);
    //page.on("console", (log) => console[log._type](log._text));

    const resultDescription = await page.evaluate(() => {
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
            JSON.stringify(content.content).replaceAll(/(\\n)?(")?/gm, ""))); //content.content;

      // url: document.querySelectorAll('.property-list > li > div[data-url').dataset.url `https://www.dfimoveis.com.br${}`
      document
        .querySelectorAll(".property-list > li > div[data-url]")
        .forEach((url) => urls.push(url.dataset.url));

      // imagem: document.querySelectorAll('div.property__image img[src]').currentSrc
      document
        .querySelectorAll("div.property__image img[src]")
        .forEach((img) => imgs.push(img.currentSrc)); //img.currentSrc

      return [locals, aluguels, areas, quartos, descricao, urls, imgs];
    });
    console.log(`${resultDescription[0].length} Apartamentos encontrados.`);
    searchResult.forEach((array,i)=>{
      array.push(...resultDescription[i])
    })
		sharedData = resultDescription[5]
  }

	const scrapApData = async function () {
		for (const data of sharedData) {
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
				parcialResult[index + 1] = {
					local: searchResult[0][index],
					aluguel: searchResult[1][index],
					area: searchResult[2][index],
					quartos: searchResult[3][index],
					descricao: searchResult[4][index],
					url: searchResult[5][index],
					img: searchResult[6][index],
				};
			}
}

function addExtraData() {
	for (let index = 0; index < searchResult[0].length; index++) {
		parcialResult[index + 1] = {
			...parcialResult[index + 1],
			descCompleta: apData[0][index],
			condominio: apData[1][index],
			fotos: apData[2][index],
		};
	}
}

TODO: // implementar a verificação por duplicados e remover o item duplicado. iterar por array ou obj ?
function findDup(items, itemCheck){
	items.forEach((item,i)=>{
			return item.url == itemCheck.url ? i : false;
	})
}
//let index;
//parcialResult.forEach((item, i)=>{
//	index = findDup(finalResult, item) == false ? i : false;
//}
//parcialResult

async function multipleSearch(searchModel) {
  for (const search of searchModel) {
    await scrape(filtroBusca(search)).then(() => {
      dataSync();
			addExtraData();
			finalResult = {...finalResult, ...parcialResult}
			parcialResult = {};
		});
  }
	console.log("Final...", finalResult);
	return finalResult;
}

function timedSearch(time){
	setInterval(multipleSearch(searchModel), 60 * 60 * 1000);
}

multipleSearch(searchModel)

module.exports = {
	'result': finalResult,
	'getResult': ()=>{
		return finalResult;
	}
}

//DID:: juntar os itens de cada array em um objeto
//DID:: se .length >30 adicionar nova pagina e refazer scraper dentro da função antes de retornar o resultado
//DID:: pagecounter para controlar a definição de paginas
//DID:: entrar na pagina de cada imóvel para pegar o valor do condominio e descrição completa
//DID:: entrar na pagina de cada imóvel para pegar varias fotos
//TODO: criar carrossel de fotos em modal
//TODO: criar descrição completa em modal
//TODO: criar função para gerar diferentes urls para pesquisa sequencial
//TODO: criar intervalo de pesquisa automática
//TODO: comparar com pesuisa anterior
//TODO: enviar notificação de novo ap para o telegram
