require("dotenv").config();
const apLocator = require("../app/app");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

let users = {};

function clearPolling(msg){
	const check = Date.now() - msg.date * 1000 < 2000 ? true : false;
	return check;
}

async function sendApsMessage(aps, userChatId) {
	//await Promise.all(
		for (const ap of aps) {
			let msg =
				`<b>${ap.local}</b>
				.Area: ${ap.area}
				.Total: ${ap.total}

				<code>https://www.dfimoveis.com.br${ap.url}</code>
				`;

				await bot.sendPhoto(userChatId, ap.img).then(() => {
					bot.sendMessage(userChatId, msg, {
						disable_web_page_preview: true,
						parse_mode: 'HTML'
					});
				});
		}
	//);
}
function saveLoadUsers(mod) {
	if (mod == 'load') {
		users = apLocator.TUsersLoad();
	}else{
		apLocator.saveData();
	}
}
function sendWatchMessage(aps) {
	saveLoadUsers('load');
	console.log('Enviando para : ', users);
	for (const user in users) {
		if (users[user].watchAp == true) {
			sendApsMessage(aps, users[user].chatId);
		}
	}
}
bot.onText(/\/smg/, (msg, match) => {
	sendWatchMessage();
});

bot.onText(/\/startwatch/, (msg, match) => {
	if (clearPolling(msg)) {
		saveLoadUsers('load');
		let id = msg.chat.id;
		users[id] = {
			'chatId' : id,
			'watchAp' : true,
		};
		saveLoadUsers('save');
		console.log('user Startwatch: ', users[id]);
		const resp = `Ok, enviarei os novos aps que surgirem.`;
		bot.sendMessage(id, resp);
	}
});
bot.onText(/\/stopwatch/, (msg, match) => {
	if (clearPolling(msg)) {
		saveLoadUsers('save');
		let id = msg.chat.id;
		users[id].watchAp = false;
		saveLoadUsers('save');
		console.log("user Stopwatch: ", users[id]);
		const resp = `Ok, não enviarei mais aps.`;
		bot.sendMessage(id, resp);
	}
});

const regx =
	/(\/search|\/addsearch|\/removesearch|\/listsearch|\/listsite)(\s(\w{4,8})\s(\w{3,6}-\w{1,8})\s((\w{2,8}\s?(\d{1,3})?)\s)?(\d{2,3})\s(\d{3,4})\s(\d{3,4})\s(\d))?/g;

bot.onText(regx, async (msg, txt) => {
	if (clearPolling(msg)) {
		let filterArray = [];
		let chatId = msg.chat.id;
		let txtIdx =[3,4,6,8,9,10,11];
		txtIdx.map((vl,idx)=>{
			if (idx == 1) {
				filterArray[idx] = txt[vl] !== undefined ? `${txt[vl]}/` : "";
			}else{
				filterArray[idx] = txt[vl] !== undefined ? txt[vl] : "";
			}
		});
		filterArray[4] = [filterArray[4],filterArray[5]];
		filterArray = filterArray.filter(Boolean);
		filterArray.splice(5,1);
		let commandCheck1 = txt[0] !== '/listsite' ? true : false;
		let commandCheck2 = txt[0] !== '/listsearch' ? true : false;
		let commandCheck = commandCheck1 || commandCheck2 == true ? false : true;
		if (filterArray.length < 6 && commandCheck) {
			const resp1 =
			`
			Formato:
			/search Local1 Local2 Termo Area ValorInicial ValorFinal Quartos
			local1: brasilia, guara
			local2: asa-norte/, asa-sul/, guara-i/
			termo: sqn, sqn 216, sqs, qi 16, shcgn
			area: 45, 50, 60, 70,
			valor: 1800,2300,
			quartos: 1, 2`;
			bot.sendMessage(chatId, resp1);
		} else {
			async function searchType(type, filterArray) {
				const search = {
					"/addsearch": async (filterArray) => {
						await apLocator.addSearch(filterArray).then(() => {
							console.log(`Padrão de busca adicionado: ${filterArray}`);
							const resp = `Padrão de busca adicionado.`;
							bot.sendMessage(chatId, resp);
						});
					},
					"/removesearch": async (filterArray) => {
						filterArray[4] = filterArray[4].join();
						await apLocator.removeSearch(filterArray).then(() => {
							console.log(`Padrão de busca removido: ${filterArray}`);
							const resp = `Padrão de busca removido.`;
							bot.sendMessage(chatId, resp);
						});
					},
					"/listsearch": async (filterArray) => {
						await apLocator.listSearch(filterArray).then((res) => {
							bot.sendMessage(chatId, res);
						});
					},
					"/listsite": () => {
						const res = `https://aplocator.herokuapp.com/`;
						bot.sendMessage(chatId, res);
					},
					default: async () => {
						const resp = `Ok, espere um pouco...`;
						bot.sendMessage(chatId, resp);

						await apLocator.getAps(filterArray).then((aps) => {
							sendApsMessage(aps, chatId);
						});
					},
				};
				await (search[type] || search['default'])(filterArray);
			}
			searchType(txt[1], filterArray);
		}
	}
});

bot.on("polling_error", console.log);

module.exports.TMsg = (aps) => {
	return sendWatchMessage(aps);
};

module.exports.TUsers = ()=>{
	return users;
}
