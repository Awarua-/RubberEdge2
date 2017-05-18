'use-strict';

/**
 * Handles a message recieved from a socket.
 * @param  {Object} message message to handle
 * @example
 * // example message Object
 * {type: "thing", data: {}}
 */
let messageHandler = (message) => {
    if (!message.type) {
        console.error('Expected the message to have type');
        return;
    }
    switch(message.type) {
        case 'transferFunction':
        {
            rubberEdge.changeTransferFunction(message.data);
            break;
        }
        case 'log':
        {
            console.error('log output, to implement')
            break;
        }
        default:
        {
            console.error('Message was not of a supported type: ' + message.type);
        }
    }
};

const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    WSSocket = require('./websocket.js'),
    socket = new WSSocket(messageHandler.bind(this)),
    RubberEdge = require('./rubberedge.js'),
    rubberEdge = new RubberEdge(socket.send.bind(socket), true);

app.use(express.static('wwwroot'));

app.get('/transferFunctions', (req, res) => {
    res.json(rubberEdge.getTransferFunctions());
});

app.post('/transferFunctions', jsonParser, (req, res) => {
    if (!req.body) {
        return res.sendStatus(400);
    }
    rubberEdge.changeTransferFunction(req.body.data);
    res.end();
});

app.listen(3000, () => {
    console.log('Starting server on port 3000');
});
