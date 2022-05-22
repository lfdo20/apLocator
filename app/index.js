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
    console.log('a');
    Object.entries(element[1]).forEach((el) => {
      console.log('b');
        if (el[0] == "img") {
          document
            .getElementById(`ap${element[0]}A`)
            .insertAdjacentHTML(
              "afterbegin",
              `<img id='baseImg' src='${el[1]}'>`
            );
        }
        else if (el[0] == "url"){
					console.log(`https://www.dfimoveis.com.br${el[1]}`);
          document
            .getElementById(`ap${element[0]}B`)
            .insertAdjacentHTML(
              "afterbegin",
              `<a class='link infos' href='https://www.dfimoveis.com.br${el[1]}'>https://www.dfimoveis.com.br</a>`
            );
        }
        else if (el[0] == "fotos"){
          document
            .getElementById(`ap${element[0]}C`)
            .insertAdjacentHTML(
              "beforeend",
              `<div id='fotoCarrap${element[0]}' class='fotoCarr'></div>`
            );
            fotoParse(el[1],element);
        }
        else if (el[0] == "descCompleta") {
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
        } else {
          document
            .getElementById(`ap${element[0]}B`)
            .insertAdjacentHTML(
              "afterbegin",
              `<div class='infos' > ${el[0]} : ${el[1]}</div>`
            );
        }
      })
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
        console.log(data);
        data2 = data;
        console.log(data2);
        dataHtml();
    });
}

getData();


