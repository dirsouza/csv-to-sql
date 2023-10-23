const listFiles = require("./list-files");
const Service = require("./service");
const Controller = require("./controller");

const service = new Service(listFiles);
const controller = new Controller(service);

(async () => {
  await controller.execute();
})();
