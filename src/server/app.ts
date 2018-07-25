import { HttpServer } from "./server";

export class App {
	private server = new HttpServer();
}

const app = new App();
