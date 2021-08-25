const R = require('ramda');
const spawn = require('threads').spawn;
const CryptoUtil = require('../util/cryptoUtil');
const Db = require('../util/db');
const { generateKeyPair } = require('crypto');
const Keys = require('./keys')
var crypto = require('crypto');
const fs = require('fs-extra');


const KEYSTORE_FILE = 'keystore.json';

class Keystore {

    constructor(dbName){
        this.keystore = new Db('data/' + dbName + '/' + KEYSTORE_FILE, new Keys());

        this.keys = this.keystore.read(Keys);

        if(this.keys.available == null) {

            generateKeyPair('rsa', {
                modulusLength: 2048,
                publicExponent: 0x10101,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem',
                    //cipher: 'aes-192-cbc',
                    //passphrase: 'password'
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

    signMessage(message) {
        const signature = require("crypto").sign("sha256", Buffer.from(message), 
        {
            key: this.keys.privateKey,
            padding: require("crypto").constants.RSA_PKCS1_PSS_PADDING,
        });
        //Convert the signature to base64 for storage.
        console.log(JSON.stringify(signature.toString("base64")));

        this.verifySignature(message, signature)
    }

    verifySignature(verifiableData, signature) {
        const isVerified = require("crypto").verify(
            "sha256",
            Buffer.from(verifiableData),
            {
              key: this.keys.publicKey,
              padding: require("crypto").constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(signature.toString("base64"), "base64")
          );
      
          // isVerified should be `true` if the signature is valid
          console.log("signature verified: ", isVerified);
    }

    getPublicKey() {
        return this.keys.publicKey;
    }



    

}
module.exports = Keystore;
