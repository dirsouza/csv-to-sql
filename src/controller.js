class Controller {
  #service;

  constructor(service) {
    this.#service = service;
  }

  async execute() {
    try {
      this.#service.execute();
    } catch (error) {
      console.error(error.message, error.stack);
    }
  }
}

module.exports = Controller;
