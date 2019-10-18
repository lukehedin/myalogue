export default class Service {
	constructor(models, getServices) {
		this.models = models;
		this.getServices = getServices;
	}
	get services() {
		return this.getServices();
	}
}