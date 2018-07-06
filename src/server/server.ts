import * as Express from 'express';

export class Server {
	constructor() {
		const app = Express();
		
		app.get('/', (req, res) => res.send('Hello World!'))
		
		app.listen(3000, () => console.log('Example app listening on port 3000!'));
		console.log('hello world nodejs');
	}
}

let server = new Server();