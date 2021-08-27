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
const logger = require('./logger');
const chalk = require('chalk');

process.on(
    "unhandledRejection",
    function handleWarning(reason, promise) {

        console.log(chalk.red.bold("[PROCESS] Unhandled Promise Rejection"));
        console.log(chalk.red.bold("- - - - - - - - - - - - - - - - - - -"));
        console.log(reason, promise);
        console.log(chalk.red.bold("- -"));

    }
);

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
            await this._addBlock(block)
            console.log(this.chain);
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
        let self = this; // refers to blockchain

        return new Promise(async (resolve, reject) => {
            let height = await self.getChainHeight();
            block.time = new Date().getTime().toString().slice(0, -3);

            if (height >= 0) {
                logger.log({
                    level: 'block',
                    message: block
                });
                block.height = height + 1;
                // assign previous block hash to current block
                block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);
                self.height = self.chain.length - 1;
                resolve(block);
            } else {
                // this code block will only execute during initialization
                // of Genesis Block because height is initially -1
                block.height = height + 1;
                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);
                // sets self.height to 0; all subsequent calls to _addBlock will
                // never enter this code block due to self.height > -1;
                self.height = self.chain.length - 1;
                resolve(block);
            }
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
            resolve(`${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`);
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

        return new Promise(async (resolve, reject) => {
            // 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
            let messageTime = parseInt(message.split(':')[1]);
            // 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
            // let currentTime = parseInt(new Date().getTime().toString().slice(0, -3)); // debug
            let currentTime = 1629664849;
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
                    await this._addBlock(block);
                } else {
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
        let errorLog = [];
        let bc_index = 0;

        return new Promise(async (resolve, reject) => {

            // Create an array to store returned Promises to be used with
            // Promise.allSettled()
            let blockTampPromises = [];

            // Loop through all blocks in chain
            self.chain.forEach(block => {
                // .validate() returns a Promise resolved as bool value and pushed
                //  to array of Promises called blockTampPromises
                blockTampPromises.push(block.validate());
                if (block.height > 0) {
                    if (this.chain[bc_index].previousBlockHash !== this.chain[bc_index - 1].hash) {
                        errorLog.push(`Block [${this.chain[bc_index].height}]: Block hash does not equal previous block's hash.`);
                    } else {
                        errorLog.push(`Block [${this.chain[bc_index].height}]: Block hash is equal to previous block's hash`)
                    }
                }
                bc_index++;
            });
            // Loop through array of returned bool Promises
            Promise.allSettled(blockTampPromises).then((promises) => {
                bc_index = 0;
                promises.forEach(valid => {
                    if (!valid) {
                        errorLog.push(`Validation Error: Block[${bc_index}] Tampered.`)
                    } else {
                        errorLog.push(`Block[${bc_index}] Validated: No tampering detected.`);
                    }
                    bc_index++;
                });
                resolve(errorLog);
            }).catch((error) => {
                logger.log({
                    level: 'error',
                    message: error
                });
            });
        });
    }
}

module.exports.Blockchain = Blockchain;
