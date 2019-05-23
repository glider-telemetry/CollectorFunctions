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
    endpoint: 'http://localhost:8000'
  });



module.exports.saveDevice = async (event, context) => {
  let response;
  let item;

  try {
    item = JSON.parse(event.body);
  } catch (error) {
    console.log('Error in JSON request:' + error);
    return { statusCode: 200, body: JSON.stringify('{' + error + '}') };
  }

  console.log(item);

  

  try {
    //item.itemId = uuidv1();
    item.insertTime = Math.floor(new Date() / 1000);
    //console.log('Fix to be insterted:' + JSON.stringify(item));
    const params = { TableName: process.env.ITEMS_DEVICES_TABLE, Item: item };
    const data = await dynamo.put(params).promise();
    response = '{' + item.trackerID + '}';
  } catch (error) {
      console.log('Error writing: ' + '{' + item.trackerID + '} :', error);
      response = '{' + error + '}';
  }


  let params = {
    TableName: process.env.ITEMS_DEVICES_TABLE,
    KeyConditionExpression: "trackerID = :ti",
    ExpressionAttributeValues: {":ti": "123456ABC"}
    };

    try {
      let data;
      data = await dynamo.query(params).promise();
      console.log(data);
    } catch (error) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(error, null, 2));
  }

  console.log(data);


  return { statusCode: 200, body: JSON.stringify('response') };
};


//=========================================



module.exports.saveFix = async (event, context) => {
  let response;
  let items;

  try {
    items = JSON.parse(event.body);
  } catch (error) {
    console.log('Error in JSON request:' + error);
    return { statusCode: 200, body: JSON.stringify('{' + error + '}') };
  }

  async function processArray(array) {
    response = '[';
    for (const item of array) {
      try {
        //item.itemId = uuidv1();
        item.insertTime = Math.floor(new Date() / 1000);
        //console.log('Fix to be insterted:' + JSON.stringify(item));
        const params = { TableName: process.env.ITEMS_FIXES_TABLE, Item: item };
        const data = await dynamo.put(params).promise();
        response += '{' + item.trackerID + ',' + item.fixTime + '},';
      } catch (error) {
        console.log('Error writing: ' + '{' + item.trackerID + ',' + item.fixTime + '} :', error);
      }
    }
  }

  await processArray(items);
  response = response.replace(/,$/, ''); //remove the trailing comma
  response += ']';
  await console.log(response);
  return { statusCode: 200, body: JSON.stringify(response) };
};
