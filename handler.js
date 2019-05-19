'use strict';
/*
Input data in format [{..},{..},{..}]
Returns [{trackerid,fixtime},{trackerid,fixtime},{trackerid,fixtime}] of successful Fixes
If input JSOn is incorrect it returns the error

 */

//const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient({
    region: 'ap-southeast-2',
    //endpoint: 'http://localhost:8000' // comment to deploy in AWS, uncomment for local deployment
})

module.exports.saveFix = async (event, context) => {
  let response;
  let items;
  let msgType;

  if (event.queryStringParameters && event.queryStringParameters.type) {
    console.log("Received action: " + event.queryStringParameters.type);
    msgType = event.queryStringParameters.type;
  }

  if(msgType == "fix") {
    try {
      items = JSON.parse(event.body);
    } catch(error) {
        console.log("Error in JSON request:"+error);
        return { statusCode: 200, body: JSON.stringify('{'+error+'}') };
    }
    //console.log(items);

    async function processArray(array) {
      response = "[";
      for (const item of array) {
        try {
          //item.itemId = uuidv1();
          item.insertTime = Math.floor(new Date() / 1000);
          console.log("Fix to be insterted:"+JSON.stringify(item));
          const params = {TableName: process.env.ITEMS_DYNAMODB_TABLE, Item: item};
          const data = await dynamo.put(params).promise();
          response += "{"+item.trackerID+","+item.fixTime+"},";
        } catch (error) {
          console.log("Error writing: "+ "{"+item.trackerID+","+item.fixTime+"} :",error);
        }
      }
    }

    await processArray(items);
    response = response.replace(/,$/, ""); //remove the trailing comma
    response += "]";
    await console.log(response);
  } else {
    response  = "Invalid request Type"
    console.log(response);
  }
  return { statusCode: 200, body: JSON.stringify(response) };
};
