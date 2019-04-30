import { createServer } from 'http'

const whenRequestReceived = (request /* the request sent by the client*/, response /* the response we use to answer*/) => {
  response.writeHead(200, { 'Content-type': `text/plain` });
  response.write(`Hello`);
  response.end( );
}

const server = createServer(whenRequestReceived)

server.listen(8080, ()=>{console.log('ok, listening')});