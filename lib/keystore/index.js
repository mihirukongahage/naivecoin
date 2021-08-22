const R = require('ramda');
const spawn = require('threads').spawn;
const CryptoUtil = require('../util/cryptoUtil');
const Db = require('../util/db');
const { generateKeyPair } = require('crypto');
const Keys = require('./keys')

const KEYSTORE_FILE = 'keystore.json';

class Keystore {

    constructor(dbName){
        this.keystore = new Db('data/' + dbName + '/' + KEYSTORE_FILE, new Keys());

        this.keys = this.keystore.read(Keys);

        if(this.keys.available == null) {

            generateKeyPair('rsa', {
                modulusLength: 530,
                publicExponent: 0x10101,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'der'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der',
                    cipher: 'aes-192-cbc',
                    passphrase: 'GeeksforGeeks is a CS-Portal!'
                }
                }, (err, publicKey, privateKey) => { 
                    if(!err)
                    {
                        console.log("Public Key : ", publicKey);
                        this.keystore.write({
                            available: true,
                            privateKey: privateKey.toString('hex'),
                            publicKey: publicKey.toString('hex')
                        });
    
                    }
                    else
                    {
                        console.log("Error generating keys : ", err);
                    }
                        
                });
        } else {
            console.log('Key pairs are available');
        }

    }

}
module.exports = Keystore;
