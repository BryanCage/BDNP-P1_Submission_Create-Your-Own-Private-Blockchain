/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persistent storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to
     * create the `block hash` and push the block into the chain array. Don't forget
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention
     * that this method is a private method.
     */
    _addBlock(block) {
        let self = this;
        let errorLog = {
            "blockTampering": [],
            "blockHashLinkEquality": []
        };
        return new Promise(async (resolve, reject) => {
            this.height = this.chain.length;
            block.height = await this.getChainHeight();
            block.time = new Date().getTime().toString().slice(0, -3);
            if (this.chain.length > 0) {
                // previous block hash
                block.previousBlockHash = this.chain[this.chain.length - 1].hash;
            }
            // SHA256 requires a string of data
            block.hash = SHA256(JSON.stringify(block)).toString();
            // add block to chain
            this.chain.push(block);
            resolve(block);
            errorLog = await self.validateChain();
            console.log(this.chain);
            console.log("Error Logs: ", errorLog)
            reject("An error occurred - Block not added to chain");
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            resolve(`bc1qvc32uhxaml75z48ue3zdqs6vqlt7d6qmyza43q:${new Date().getTime().toString().slice(0, -3)}:starRegistry`);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    submitStar(address, message, signature, star) {
        let self = this;
        // message = "not correct message"; // debug
        return new Promise(async (resolve, reject) => {
            // 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
            let messageTime = parseInt(message.split(':')[1]);
            // 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
            // let currentTime = parseInt(new Date().getTime().toString().slice(0, -3)); // debug
            let currentTime = 1629657149;
            let elapseTime = currentTime - messageTime;
            // 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
            if (bitcoinMessage.verify(message, address, signature, null, true)) {
                // 3. Check if the time elapsed is less than 5 minutes
                if (elapseTime <= 300 && elapseTime >= 0) {
                    // 5. Create the block and add it to the chain
                    let block = new BlockClass.Block({
                        data: {
                            owner: address,
                            star: {
                                dec: "68° 52' 56.9",
                                ra: "16h 29m 1.0s",
                                story: `Testing the story ${this.chain.length}`
                            }
                        }
                    });
                    // 6. Resolve with the block added.
                    resolve(block);
                    // console.log("Message Verified");
                    // console.log("Address: ",address, "\nMessage: ",message, "\nSignature: ",signature, "\nStar: ",star);
                    await this._addBlock(block);
                } else {
                // reject("Error occurred - New Star not added - No New Block Appended to Chain.");
                    reject({error: "Elapsed Time greater than 5 minutes - New Block could not be appended to the blockchain"});
                }
            } else {
                    reject({error: "Message could not be verified with signature - New Block with Star could not be appended to blockchain."})
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            for (let i = 0; i < this.chain.length; i++) {
                if (self.chain[i].hash === hash) {
                    resolve(this.chain[i]);
                }
            }
            resolve()
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        let body = "";
        return new Promise((resolve, reject) => {
            for (let i = 0; i < this.chain.length; i++) {
                body = this.chain[i].getBData();
                if (body && body.owner === address) {
                    stars.push(this.chain[i].getBData());
                }
            }
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = {
            "blockTampering": [],
            "blockHashLinkEquality": []
        };
        return new Promise(async (resolve, reject) => {

            for (let i = 0; i < this.chain.length; i++) {
                if(i > 0) {
                    if (this.chain[i].previousBlockHash !== this.chain[i - 1].hash) {
                        errorLog["blockHashLinkEquality"].push(`Block [${this.chain[i].height}]: Block Hash does not equal previousBlockHash.`);
                    }
                    let valid_tamper = self.chain[i].validate();
                    if (!valid_tamper) {
                        errorLog["blockTampering"].push(`Block [${this.chain[i].height}]: Current and Recalculated Hashes do not match.`);
                    }
                } else {
                    let valid_tamper = self.chain[0].validate();
                    if(!valid_tamper){
                        errorLog["blockTampering"].push(`Genesis Block: Current Hash and Recalculated Hash do not match.`)
                    }
                }
            }
            if (errorLog["blockTampering"].length === 0) {
                errorLog["blockTampering"].push("No block tampering detected.");
            }
            if (errorLog["blockHashLinkEquality"].length === 0) {
                errorLog["blockHashLinkEquality"].push("No invalid hash links between blocks detected.");
            }
            resolve(errorLog);
        });
    }
}

module.exports.Blockchain = Blockchain;   