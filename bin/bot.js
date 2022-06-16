require("dotenv").config();
//const bridge = require("../bin/botbridge.js");
const apLocator = require("../app/app");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let users = {};

function sendApsMessage(aps, userChatId) {
	aps.map(async (ap) => {
		let msg =
			`<b>${ap.local}</b>
			.Area: ${ap.area}
			.Total: ${ap.total}

			<code>https://www.dfimoveis.com.br${ap.url}</code>
			`;
		await bot.sendPhoto(userChatId, ap.img).then(async() => {
			await bot.sendMessage(userChatId, msg, {
				disable_web_page_preview: true,
				parse_mode: 'HTML'
			});
		});
	});
}

function sendWatchMessage(aps) {
	for (const user in users) {
		if (users[user].watchAp == true) {
			sendApsMessage(aps, users[user].chatId);
		}
	}
}

function uniqueSearch() {

}

bot.onText(/\/startwatch/, (msg, match) => {
	let id = msg.chat.id;
	users[id] = {};
	users[id].chatId = id;
	users[id].watchAp = true;
	const resp = `Ok, enviarei os novos aps que surgirem.`;
	bot.sendMessage(id, resp);
});
bot.onText(/\/stopwatch/, (msg, match) => {
	let id = msg.chat.id;
	users[id].watchAp = false;
	const resp = `Ok, não enviarei mais aps.`;
	bot.sendMessage(id, resp);
});

const regx = /\/search(\s(\w{4,8})\s(\w{3,6}-\w{1,8})\s((\w{2,8}\s?(\d{2,3})?)\s)?(\d{2,3})\s(\d{3,4})\s(\d{3,4})\s(\d))?/g;
bot.onText(regx, async (msg, txt) => {
		let chatId = msg.chat.id;
		console.log(txt);
		let filterArray = [];
		let txtIdx =[2,3,4,7,8,9,10];
		txtIdx.map((vl,idx)=>{
			console.log('aaa', txt[vl], idx);
			if (idx == 1) {
				filterArray[idx] = txt[vl] !== undefined ? `${txt[vl]}/` : "";
			}else{
				filterArray[idx] = txt[vl] !== undefined ? txt[vl] : "";
			}
		});
		filterArray[4] = [filterArray[4],filterArray[5]];
		filterArray.splice(5,1);
		console.log('bbb', filterArray);
		if (filterArray.length < 6) {
			const resp1 =
			`
			Formato:
			/search Local1 Local2 Termo Area ValorInicial ValorFinal Quartos
			local1: brasilia, guara
			local2: asa-norte/, asa-sul/, guara-i/
			termo: sqn, sqn 216, sqs, guara, shcgn
			area: 45, 50, 60, 70,
			valor: 1800,2300,
			quartos: 1, 2`;
			bot.sendMessage(chatId, resp1);
		} else {
			const resp2 = `Ok, espere um pouco...`;
			bot.sendMessage(chatId, resp2);

			await apLocator.getAps(filterArray).then((aps) => {
				console.log('retorno', aps);
				sendApsMessage(aps, chatId);
			});

		}
	}
);

module.exports.TMsg = (aps) => {
		return sendWatchMessage(aps);
};
