'use strict';

const databaseManager = require('./databaseManager');
const uuidv1 = require('uuid/v1');

function createResponse(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

module.exports.saveItem = (event, context, callback) => {
  //This module reads a JSON array and inserts them in the DB
  //The format of the input is [{...},{...},{....}]
  //The return is the id of the record
  var msgType = "";
  var response1 = "";
  var response = "";
  const items = JSON.parse(event.body);
  console.log(items);


  if (event.queryStringParameters && event.queryStringParameters.type) {
    console.log("Received action: " + event.queryStringParameters.type);
    msgType = event.queryStringParameters.type;
  }

  if(msgType == "fix") {
    async function processArray(array) {
      response = "[";
      for (const item of array) {
        item.itemId = uuidv1();
        await databaseManager.saveItem(item).then(response1 => {
        console.log("itemId: "+response1);
        response += "{"+item.trackerID+","+item.fixTime+"},";
        //response += response1 + ",";
        });
      }
      response = response.replace(/,$/, ""); //remove the trailing comma
      response += "]";
      console.log(response);
      callback(null, createResponse(200, response));
    }
    processArray(items);
    //console.log("End of JSON array processing");
  } else {
    response = "Unkonwn message type";
    console.log(response);
    callback(null, createResponse(200, response));
  }

};

module.exports.getItem = (event, context, callback) => {
  const itemId = event.pathParameters.itemId;

  databaseManager.getItem(itemId).then(response => {
    console.log(response);
    callback(null, createResponse(200, response));
  });
};

module.exports.deleteItem = (event, context, callback) => {
  const itemId = event.pathParameters.itemId;

  databaseManager.deleteItem(itemId).then(response => {
    callback(null, createResponse(200, 'Item was deleted'));
  });
};

module.exports.updateItem = (event, context, callback) => {
  const itemId = event.pathParameters.itemId;

  const body = JSON.parse(event.body);
  const paramName = body.paramName;
  const paramValue = body.paramValue;

  databaseManager.updateItem(itemId, paramName, paramValue).then(response => {
    console.log(response);
    callback(null, createResponse(200, response));
  });
};

module.exports.triggerStream = (event, context, callback) => {
  console.log('trigger stream was called');

  const eventData = event.Records[0];
  //console.log(eventData);

  console.log(eventData.dynamodb.NewImage);
  callback(null, null);
};
