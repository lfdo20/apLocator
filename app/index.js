let data2;

function dataHtml(){
  function fotoParse(el,element){
    el.forEach((im) => {
      document
        .getElementById(`fotoCarrap${element[0]}`)
        .insertAdjacentHTML(
          "beforeend",
          `<img class="fotSel" src="${im}"></img>`
        );
    });
  }

  function objParse(element){
		let linkElem, condElem, totalElem;
		function elemHtml(kn, e, s) {
			document
				.getElementById(`ap${element[0]}B`)
				.insertAdjacentHTML(
					"beforeend",
					`<div class='infos' > <span>${kn}:</span> ${e}</div>`
				);
		}

		Object.entries(element[1]).forEach((el) => {
			let keyName = el[0].replace(/(\b[a-z](?!\s))/g, (m) => {
				return m.toUpperCase();
			});
			console.log('teste0', el[0], el[1]);
			if (el[0] == "img") {
				document
					.getElementById(`ap${element[0]}A`)
					.insertAdjacentHTML("beforeend", `<img id='baseImg' src='${el[1]}'>`);
			} else if (el[0] == "url") {
				linkElem = document.createElement('a')
				linkElem.className = 'link infos';
				linkElem.href = `https://www.dfimoveis.com.br${el[1]}`;
				linkElem.innerText = `https://www.dfimoveis.com.br`;
			} else if (el[0] == "fotos") {
				document
					.getElementById(`ap${element[0]}C`)
					.insertAdjacentHTML(
						"beforeend",
						`<div id='fotoCarrap${element[0]}' class='fotoCarr'></div>`
					);
				fotoParse(el[1], element);
			} else if (el[0] == "descCompleta") {
				document
					.getElementById(`ap${element[0]}C`)
					.insertAdjacentHTML(
						"afterbegin",
						`<div class='infos descC hide' > ${el[1].toString()}</div>`
					);
			} else if (el[0] == "descricao") {
				document
					.getElementById(`ap${element[0]}C`)
					.insertAdjacentHTML(
						"afterbegin",
						`<div class='infos descS' > ${el[1].toString()}</div>`
					);
					//condElem.match(/(([0-9].)?[0-9]{3,4})/g)
			} else if (el[0] == "condominio" || el[0] == "aluguel") {
				condElem = document.createElement("div");
				condElem.className = "infos";
				let condVal = /(([0-9].)?[0-9]{3,4})/g.test(el[1])
					? `R$${el[1]},00`
					: "000";
				if (condVal == "000") condElem.style.color = `red`;
				if (el[0] == "aluguel") elemHtml(keyName, condVal);
				condElem.innerHTML = `<span>${keyName}:</span> ${condVal}`;
			} else if (el[0] == "total") {
				totalElem = document.createElement("div");
				totalElem.className = "infos";
				totalElem.style.color = `darkgreen`;
				totalElem.innerHTML = `<span>${keyName}:</span> R$${el[1]},00`;
				console.log('teste:', element);
				console.log('teste2', totalElem);
			} else {
				elemHtml(keyName, el[1]);
			}
		});
		console.log('ttsts', condElem, totalElem);
		document.querySelectorAll(`div[id=ap${element[0]}B] div.infos`)[1]
			.insertAdjacentElement("afterend", condElem);

		document
			.querySelectorAll(`div[id=ap${element[0]}B] div.infos`)[2]
			.insertAdjacentElement("afterend", totalElem);

		document
			.getElementById(`ap${element[0]}B`)
			.insertAdjacentElement("beforeend", linkElem);
	}

  Object.entries(data2).forEach((element) => {
    document
      .getElementById("all")
      .insertAdjacentHTML(
        "beforeend",
        `<div id='ap${element[0]}' class='aps'></div>`
      );
      document
        .getElementById(`ap${element[0]}`)
        .insertAdjacentHTML("afterbegin", `<div id='ap${element[0]}A'></div>`);
      document
        .getElementById(`ap${element[0]}`)
        .insertAdjacentHTML("beforeend", `<div id='ap${element[0]}B'></div>`);
      document
        .getElementById(`ap${element[0]}`)
        .insertAdjacentHTML("beforeend", `<div id='ap${element[0]}C' class='flexrow'></div>`);
    objParse(element);
  });
}

async function getData() {
  const response = await fetch('/data');
    response.json().then((data) => {
        data2 = data;
        dataHtml();
    });
}

getData();


