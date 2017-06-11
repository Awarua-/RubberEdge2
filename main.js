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
    if (!message.data) {
        console.log(message);
        console.error('Expected the message to contain data');
        return;
    }
    switch(message.type) {
        case 'touch':
            rubberEdge.updatePosition(message.data);
            logger.log(message.data);
            break;
        case 'log':
            logger.log(message.data);
            break;
        default:
            console.error('Message was not of a supported type: ' + message.type);
    }
},

    clean = () => {
        return new Promise((resolve, reject) => {
            server.close(() => socket.destructor().then(() => logger.destructor()).then(resolve).catch(err => reject(err)));
        });
    };

const express = require('express'),
    app = express(),
    Cleanup = require('./cleanup.js'),
    cleanup = new Cleanup(clean),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    Logger = require('./logger.js'),
    logger = new Logger(),
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
        res.sendStatus(400);
        return;
    }
    rubberEdge.changeTransferFunction(req.body.data);
    res.end();
});

app.get('/participantId', (req, res) => {
    res.json(logger.getCurrentParticipantId());
})

app.post('/participantId', (req, res) => {
    res.json(logger.newParticipant());
})

app.post('/presurvey', jsonParser, (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }
    logger.log(req.body);
    res.end();
})

app.post('/postsurvey', jsonParser, (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }
    logger.log(req.body);
    res.end();
})

app.post('/calibrate', jsonParser, (req, res) => {
    if (!req.body) {
        res.sendStatus(400);
        return;
    }
    rubberEdge.calibrateSwitch(req.body);
    res.end();
})

app.use((req, res, next) => {
    res.status(404).redirect('/#/lolcat');
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.sendStatus(500);
})

let server = app.listen(3000, () => {
    console.log('Starting server on port 3000');
});
