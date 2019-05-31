'use strict';

//const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient({
    region: 'ap-southeast-2',
    endpoint: 'http://localhost:8000'
  });



module.exports.saveDevice = async (event, context) => {
  let pilot1;
  let pilot2;
  let device;
  
  try {
    device = JSON.parse(event.body);
  } catch (error) {
    console.log('Error in JSON request:' + error);
    return { statusCode: 400, body: JSON.stringify('{' + error + '}') };
  }

  try {
    let params;
    if(device.pilot1ID) {
      params = {
        TableName: process.env.ITEMS_PILOTS_TABLE,
        KeyConditionExpression: "pilotID = :pid",
        ExpressionAttributeValues: {":pid": device.pilot1ID}};
      pilot1 = await dynamo.query(params).promise();  
    }
    if(device.pilot2ID) {
      params = {
        TableName: process.env.ITEMS_PILOTS_TABLE,
        KeyConditionExpression: "pilotID = :pid",
        ExpressionAttributeValues: {":pid": device.pilot2ID}};
      pilot2 = await dynamo.query(params).promise();  
    }
    
    Object.keys(device).forEach(k => (device[k] === "") && delete device[k]);   //remove values that have "" else dynamo complains
    params = { 
      TableName: process.env.ITEMS_DEVICES_TABLE, 
      Item: device };
    await dynamo.put(params).promise();
    
    let response = new Object();
    if(device.pilot1ID) {
      let ans = pilot1.Items[0].firstName;
        if(pilot1.Items[0].middleName === "" || pilot1.Items[0].middleName === null || pilot1.Items[0].middleName === undefined ){
        } else {
          ans += " " + pilot1.Items[0].middleName;
        }
        if(pilot1.Items[0].familyName === "" || pilot1.Items[0].familyName === null || pilot1.Items[0].familyName === undefined ){
        } else {
          ans += " " + pilot1.Items[0].familyName;
        }
        response.pilot1Name = ans;
    }
    
    if(device.pilot2ID) {
      let ans = pilot2.Items[0].firstName;
        if(pilot2.Items[0].middleName === "" || pilot2.Items[0].middleName === null || pilot2.Items[0].middleName === undefined ){
        } else {
          ans += " " + pilot2.Items[0].middleName;
        }
        if(pilot2.Items[0].familyName === "" || pilot2.Items[0].familyName === null || pilot2.Items[0].familyName === undefined ){
        } else {
          ans += " " + pilot2.Items[0].familyName;
        }
        response.pilot2Name = ans;
    }
    
    return { statusCode: 200, body: JSON.stringify(response)};
    
  } catch (error) {
      console.log('Error writing: ' + '{' + device.trackerID + '} :', error);
      return { statusCode: 400, body: JSON.stringify(error) };
  }

};


//=========================================



module.exports.saveFix = async (event, context) => {
  /*
Input data in format [{..},{..},{..}]
Returns [{trackerid,fixtime},{trackerid,fixtime},{trackerid,fixtime}] of successful Fixes
If input JSOn is incorrect it returns the error

 */

  let response;
  let items;

  try {
    items = JSON.parse(event.body);
  } catch (error) {
    console.log('Error in JSON request:' + error);
    return { statusCode: 400, body: JSON.stringify('{' + error + '}') };
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
