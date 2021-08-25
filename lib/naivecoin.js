const HttpServer = require('./httpServer');
const Blockchain = require('./blockchain');
const Operator = require('./operator');
const Miner = require('./miner');
const Minter = require('./minter');
const Node = require('./node');
const Generator = require('./generator');
const Keystore = require('./keystore');
const Timer = require('./timer/timer')

module.exports = function naivecoin(host, port, peers, logLevel, name) {
    host = process.env.HOST || host || 'localhost';
    port = process.env.PORT || process.env.HTTP_PORT || port || 3001;
    peers = (process.env.PEERS ? process.env.PEERS.split(',') : peers || []);
    peers = peers.map((peer) => { return { url: peer }; });
    logLevel = (process.env.LOG_LEVEL ? process.env.LOG_LEVEL : logLevel || 6);    
    name = process.env.NAME || name || '1';

    require('./util/consoleWrapper.js')(name, logLevel);

    console.info(`Starting node ${name}`);

    let blockchain = new Blockchain(name);
    let keystore = new Keystore(name);
    let operator = new Operator(name, blockchain);
    // let miner = new Miner(blockchain, logLevel);
    let generator = new Generator(name);
    let node = new Node(host, port, peers, blockchain, name, generator, keystore);
    let minter = new Minter(blockchain, logLevel, name, keystore, node);
    let httpServer = new HttpServer(node, blockchain, operator, minter, generator, keystore);
    let timer = new Timer(generator);

    httpServer.listen(host, port);
};