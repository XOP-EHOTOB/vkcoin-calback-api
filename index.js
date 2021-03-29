var request = require("prequest");
const http = require("http");

let port = 1234;

module.exports = class VKCOIN {
  constructor(auth) {
    this.key = auth.key;
    this.id = auth.id;
  }

  async startServer(props) {
    if (!props.server)
      return console.error(
        "Start server Error: не указан сервер для получения событий!"
      );
    if (props.port) {
      port = props.port;
    }
    try {
      let connect = await request({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/set/",
        form: {
          callback: `http://${props.server}:${port}`,
          merchantId: this.id,
          key: this.key,
        },
        headers: { "Content-type": "Content-Type: application/json" },
      });
      if (connect.response === "ON") {
        console.log("Успешное подключение к VK Coin");
      } else {
        console.error("Ошибка: подключения к VK Coin:", connect.error);
      }
    } catch (e) {
      throw new Error("Ошибка: Не удалось подключится к VK Coin:", e)
    }
  }

  async startPolling(hand) {
    try {
      http
        .createServer((req, res) => {
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk.toString();
            });
            req.on("end", () => {
              let event = JSON.parse(body);
              res.writeHead(200, "OK");
              res.end("OK");
              hand(event);
            });
          }
        })
        .listen(port);
    } catch (err) {
      throw new Error("Ошибка: Не удалось подключится к VK Coin:", e)
    }
  }

  async send(toId, amount, fromShop) {
    if (!fromShop) {
      try {
        await request({
          method: "POST",
          url: "https://coin-without-bugs.vkforms.ru/merchant/send/",
          form: {
            merchantId: this.id,
            key: this.key,
            toId: toId,
            amount: amount,
          },
          headers: { "Content-type": "Content-Type: application/json" },
        });
      } catch (e) {
        throw new Error("Ошибка: ", e)
      }
    } else {
      try {
        await request({
          method: "POST",
          url: "https://coin-without-bugs.vkforms.ru/merchant/send/",
          form: {
            merchantId: this.id,
            key: this.key,
            toId: toId,
            amount: amount,
            markAsMerchant: fromShop,
          },
          headers: { "Content-type": "Content-Type: application/json" },
        });
      } catch (e) {
        console.error(e);
        throw new Error("Ошибка: ", e)
      }
    }
  }

  async getBalance(id) {
    try {
      let balance = await request({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/score/",
        form: {
          merchantId: this.id,
          key: this.key,
          userIds: id,
        },
        headers: { "Content-type": "Content-Type: application/json" },
      });
      return balance;
    } catch (e) {
      throw new Error("Ошибка: ", e)
    }
  }

  async shopName(name) {
    try {
      let res = await request({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/set/",
        form: {
          merchantId: this.id,
          key: this.key,
          name: name,
        },
        headers: { "Content-type": "Content-Type: application/json" },
      });
      if (res.response === 1) {
        console.log("Название магазина успешно установлно:", name);
      } else {
        console.error(
          "Ошибка: Попробуйте установить название магазина позже:",
          res
        );
      }
      return res;
    } catch (e) {
      throw new Error("Ошибка: ", e)
    }
  }

  getLink(amount, payload, fixed) {
    if (!this.id)
      return console.error(`Ошибка: Для начала необходимо авторизироваться!`);
    if (isNaN(+amount))
      return console.error(`Ошибка: Недопустимый формат VK Coin!`);
    let link = `vk.com/coin#x${this.id}_${+amount}_${payload}`;
    if (fixed) {
      link += "_1";
    }
    return link;
  }

  format(amount) {
    return (amount / 1000)
      .toLocaleString()
      .replace(/,/g, " ")
      .replace(/\./g, ",");
  }
};
