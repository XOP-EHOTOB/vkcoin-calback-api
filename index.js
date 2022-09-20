const request = require("prequest");
const http = require("http");

let port = 1234;

module.exports = class VKCOIN {
  constructor(auth) {
    this.key = auth.key;
    this.id = auth.id;
  }

  async startServer(props) {
    if (!props.server)
      return console.error( "Start server Error: не указан сервер для получения событий!");
    if (props.port) { port = props.port;}
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
      return connect
    } catch (e) {
      throw new Error(e.message || "Ошибка сервера!")
    }
  }

  async startPolling(hand) {
    try {
      http.createServer((req, res) => {
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
        }).listen(port);
    } catch (err) {
      throw new Error(e.message || "Ошибка сервера!")
    }
  }

  async send(toId, amount, fromShop) {
    if (!fromShop) {
      try {
        let req = await request({
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
        return req
      } catch (e) {
        console.error(e.message);
        throw new Error(e.message || "Ошибка сервера!")
      }
    } else {
      try {
        let req = await request({
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
        return req
      } catch (e) {
        throw new Error(e.message || "Ошибка сервера!")
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
      throw new Error(e.message || "Ошибка сервера!")
    }
  }

  async shopName(name) {
    try {
      let req = await request({
        method: "POST",
        url: "https://coin-without-bugs.vkforms.ru/merchant/set/",
        form: {
          merchantId: this.id,
          key: this.key,
          name: name,
        },
        headers: { "Content-type": "Content-Type: application/json" }
      });
      return req
    } catch (e) {
      throw new Error(e.message || "Ошибка сервера!")
    }
  }

  getLink(amount, payload, fixed) {
    if (!this.id)
      throw new Error(`Ошибка: Для начала необходимо авторизироваться!`)
    if (isNaN(+amount))
      throw new Error(`Ошибка: Недопустимый формат VK Coin!`)
    let link = `vk.com/coin#x${this.id}_${+amount}_${payload}`
    if (fixed) { link += "_1" }
    return link
  }

  format(amount) {
    return (amount / 1000).toLocaleString('de-DE').replace(/\./g, " ")
  }
}